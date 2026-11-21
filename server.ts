import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import type { Coupon, CouponRedemption, Referral, ReferralSettings } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const AUTHORIZED_ADMIN_EMAIL = 'marinodavidr7@gmail.com';

// ---------------------------------------------------------------------------
// Firebase Admin SDK (para cupones, referidos y reglas de servidor)
// Requiere: FIREBASE_SERVICE_ACCOUNT (JSON string) o FIREBASE_SERVICE_ACCOUNT_PATH
// ---------------------------------------------------------------------------
let adminDb: Firestore | null = null;

function initFirebaseAdmin(): Firestore | null {
  if (adminDb) return adminDb;
  try {
    let serviceAccount: Record<string, unknown> | null = null;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (raw) {
      serviceAccount = JSON.parse(raw) as Record<string, unknown>;
    } else if (pathEnv && fs.existsSync(pathEnv)) {
      serviceAccount = JSON.parse(fs.readFileSync(pathEnv, 'utf8')) as Record<string, unknown>;
    }

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      });
      adminDb = getFirestore();
    }
  } catch {
    // Admin SDK no disponible; los endpoints de cupones/referidos devolverán error 503
  }
  return adminDb;
}

function getAdminDb(): Firestore {
  const db = initFirebaseAdmin();
  if (!db) {
    throw new Error('Firebase Admin SDK no configurado. Define FIREBASE_SERVICE_ACCOUNT o FIREBASE_SERVICE_ACCOUNT_PATH.');
  }
  return db;
}

// (auth helpers moved below token verification)

// ---------------------------------------------------------------------------
// Rate limiting simple para /api/coupons/validate (evita fuerza bruta de códigos)
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Limpieza periódica del mapa de rate limit
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

function loadFirebaseProjectId(): string {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { projectId?: string };
    if (parsed.projectId) return parsed.projectId;
  } catch {
    // Fallback handled below
  }
  return process.env.FIREBASE_PROJECT_ID || 'river-pipe-m6tvw';
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();
let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } = {
  certs: {},
  expiresAt: 0,
};

async function getGooglePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  if (!forceRefresh && Date.now() < cachedGoogleCerts.expiresAt && Object.keys(cachedGoogleCerts.certs).length > 0) {
    return cachedGoogleCerts.certs;
  }
  const resp = await fetch(FIREBASE_CERT_URL);
  if (!resp.ok) {
    throw new Error('Unable to fetch Firebase public verification certificates');
  }
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const certs = (await resp.json()) as Record<string, string>;
  cachedGoogleCerts = {
    certs,
    expiresAt: Date.now() + Math.max(60, maxAgeSec) * 1000,
  };
  return certs;
}

class AuthValidationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function verifyFirebaseAdminBearerToken(
  authHeader?: string
): Promise<{ uid: string; email: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthValidationError(401, 'Token de autenticación requerido.');
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthValidationError(401, 'Formato de token inválido.');
  }
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: {
    aud?: unknown;
    iss?: unknown;
    sub?: unknown;
    exp?: unknown;
    iat?: unknown;
    email?: unknown;
    email_verified?: unknown;
  };
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as {
      alg?: string;
      kid?: string;
    };
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as typeof payload;
  } catch {
    throw new AuthValidationError(401, 'Token JWT malformado.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new AuthValidationError(401, 'Algoritmo o identificador de clave no válido.');
  }

  let certs = await getGooglePublicCerts(false);
  let cert = certs[header.kid];
  if (!cert) {
    certs = await getGooglePublicCerts(true);
    cert = certs[header.kid];
  }
  if (!cert) {
    throw new AuthValidationError(401, 'Certificado de firma no reconocido.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const isSignatureValid = verifier.verify(cert, Buffer.from(sigB64, 'base64url'));
  if (!isSignatureValid) {
    throw new AuthValidationError(401, 'Firma del token de Firebase inválida.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` ||
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    typeof payload.exp !== 'number' ||
    payload.exp <= nowSec ||
    typeof payload.iat !== 'number' ||
    payload.iat > nowSec + 60
  ) {
    throw new AuthValidationError(401, 'Token expirado o emitido para otro proyecto.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (payload.email_verified !== true || email !== AUTHORIZED_ADMIN_EMAIL) {
    throw new AuthValidationError(
      403,
      'Permiso denegado: solo Marinodavidr7@gmail.com tiene permisos de escritura.'
    );
  }

  return { uid: payload.sub, email };
}

async function verifyFirebaseTokenAny(authHeader?: string): Promise<{ uid: string; email: string | null; emailVerified: boolean }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthValidationError(401, 'Token de autenticación requerido.');
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthValidationError(401, 'Formato de token inválido.');
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: { aud?: unknown; iss?: unknown; sub?: unknown; exp?: unknown; iat?: unknown; email?: unknown; email_verified?: unknown };
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as typeof header;
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as typeof payload;
  } catch {
    throw new AuthValidationError(401, 'Token JWT malformado.');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new AuthValidationError(401, 'Algoritmo o identificador de clave no válido.');
  }
  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) throw new AuthValidationError(401, 'Certificado de firma no reconocido.');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  if (!verifier.verify(certPem, Buffer.from(sigB64, 'base64url'))) {
    throw new AuthValidationError(401, 'Firma del token de Firebase inválida.');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` ||
    typeof payload.sub !== 'string' || payload.sub.length === 0 ||
    typeof payload.exp !== 'number' || payload.exp <= nowSec ||
    typeof payload.iat !== 'number' || payload.iat > nowSec + 60
  ) {
    throw new AuthValidationError(401, 'Token expirado o emitido para otro proyecto.');
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : null;
  return { uid: payload.sub, email, emailVerified: payload.email_verified === true };
}

async function requireAdmin(req: express.Request, res: express.Response): Promise<boolean> {
  try {
    const auth = await verifyFirebaseTokenAny(req.headers.authorization);
    if (auth.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: 'Admin access required' });
      return false;
    }
    return true;
  } catch (err) {
    const status = err instanceof AuthValidationError ? err.status : 401;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Invalid token' });
    return false;
  }
}

async function requireAuth(req: express.Request, res: express.Response): Promise<{ uid: string; email: string | null } | null> {
  try {
    const auth = await verifyFirebaseTokenAny(req.headers.authorization);
    return { uid: auth.uid, email: auth.email };
  } catch (err) {
    const status = err instanceof AuthValidationError ? err.status : 401;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Invalid token' });
    return null;
  }
}

interface SyncClient {
  ws: WebSocket;
  uid: string;
  deviceId: string;
  deviceLabel: string;
  role: string;
  connectedAt: string;
}

interface RegisteredApiKey {
  id: string;
  ownerId: string;
  keyHash: string;
  label: string;
  webhookUrl?: string;
}

interface CloudBackupRecord {
  ownerId: string;
  provider: string;
  folder: string;
  checksumSha256: string;
  bytes: number;
  syncedAt: string;
}

const clients = new Set<SyncClient>();
const registeredKeys = new Map<string, RegisteredApiKey>();
const cloudBackups = new Map<string, CloudBackupRecord[]>();
const recentWebhooks: Array<{
  id: string;
  event: string;
  targetUrl: string;
  status: number;
  dispatchedAt: string;
}> = [];

function getUserDeviceCount(uid: string): number {
  const uniqueDevices = new Set<string>();
  for (const client of clients) {
    if (client.uid === uid && client.ws.readyState === WebSocket.OPEN) {
      uniqueDevices.add(client.deviceId);
    }
  }
  return uniqueDevices.size;
}

function broadcastPresence(uid: string) {
  const deviceCount = getUserDeviceCount(uid);
  const devices: Array<{ deviceId: string; deviceLabel: string; connectedAt: string }> = [];
  const seen = new Set<string>();
  for (const client of clients) {
    if (client.uid === uid && client.ws.readyState === WebSocket.OPEN && !seen.has(client.deviceId)) {
      seen.add(client.deviceId);
      devices.push({
        deviceId: client.deviceId,
        deviceLabel: client.deviceLabel,
        connectedAt: client.connectedAt,
      });
    }
  }
  const payload = JSON.stringify({
    type: 'PRESENCE_SYNC',
    uid,
    deviceCount,
    devices,
    timestamp: new Date().toISOString(),
  });
  for (const client of clients) {
    if (client.uid === uid && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastEvent(message: Record<string, unknown>, targetUid?: string) {
  const encoded = JSON.stringify({
    ...message,
    serverTimestamp: new Date().toISOString(),
  });
  for (const client of clients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (!targetUid || client.uid === targetUid || message.scope === 'global') {
      client.ws.send(encoded);
    }
  }
}

async function dispatchWebhooks(ownerId: string, event: string, data: Record<string, unknown>) {
  for (const key of registeredKeys.values()) {
    if (key.ownerId === ownerId && key.webhookUrl) {
      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      });
      const signature = crypto.createHmac('sha256', key.keyHash).update(body).digest('hex');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(key.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Catedra-Event': event,
            'X-Catedra-Signature': `sha256=${signature}`,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        recentWebhooks.unshift({
          id: crypto.randomUUID(),
          event,
          targetUrl: key.webhookUrl,
          status: resp.status,
          dispatchedAt: new Date().toISOString(),
        });
      } catch {
        recentWebhooks.unshift({
          id: crypto.randomUUID(),
          event,
          targetUrl: key.webhookUrl,
          status: 0,
          dispatchedAt: new Date().toISOString(),
        });
      }
      if (recentWebhooks.length > 25) recentWebhooks.pop();
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // REST API v1 for third-party integrations, payment gateways, cloud storage & webhooks
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'catedra-lms-api',
      version: '1.0.0',
      connectedSockets: clients.size,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/openapi.json', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      openapi: '3.0.3',
      info: {
        title: 'Cátedra Virtual Learning API',
        version: '1.0.0',
        description: 'REST API for course sync, real-time progress webhooks, payment gateway verification, and certificate validation.',
      },
      servers: [{ url: `${baseUrl}/api/v1` }],
      paths: {
        '/health': { get: { summary: 'API and WebSocket Gateway Health' } },
        '/payments/checkout': { post: { summary: 'Authorize Stripe, Mercado Pago, or PayPal course purchase' } },
        '/webhooks/register': { post: { summary: 'Register API key hash and webhook endpoint' } },
        '/webhooks/test': { post: { summary: 'Dispatch signed HMAC-SHA256 webhook event' } },
        '/cloud-storage/sync': { post: { summary: 'Upload client-encrypted E2EE backup manifest' } },
      },
    });
  });

  app.post('/api/v1/payments/checkout', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { courseId, gateway, couponCode, referralWelcome, testMode } = req.body ?? {};
    const isTestModeAdmin = testMode === true && auth.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    if (!courseId || !gateway) {
      res.status(400).json({ error: 'Missing required payment fields' });
      return;
    }
    const allowedGateways = ['stripe', 'mercadopago', 'paypal'];
    if (!allowedGateways.includes(String(gateway))) {
      res.status(400).json({ error: 'Unsupported payment gateway' });
      return;
    }

    try {
      const db = getAdminDb();

      // Fuente de verdad: curso desde Firestore
      const courseSnap = await db.collection('courses').doc(String(courseId)).get();
      if (!courseSnap.exists) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }
      const course = courseSnap.data() as { title?: string; instructorId?: string; priceCents?: number; currency?: string };
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      const currency = (course.currency === 'EUR' || course.currency === 'MXN' ? course.currency : 'USD') as 'USD' | 'EUR' | 'MXN';

      // Calcular descuento en servidor
      let discountCents = 0;
      let appliedCouponCode: string | undefined;
      let redemptionId: string | undefined;
      let discountSource: 'none' | 'coupon' | 'referral_welcome' = 'none';

      // Descuento bienvenida por referido (primera compra pagada, referido válido)
      let welcomeDiscountCents = 0;
      if (referralWelcome === true && originalAmountCents > 0) {
        const settingsSnap = await db.collection('settings').doc('referrals').get();
        const settings = settingsSnap.exists ? (settingsSnap.data() as ReferralSettings) : null;
        if (settings?.active) {
          const userSnap = await db.collection('users').doc(auth.uid).get();
          const userData = userSnap.exists ? (userSnap.data() as { referredBy?: string }) : {};
          if (userData.referredBy && userData.referredBy !== auth.uid) {
            // Solo primera compra pagada
            const prevPayments = await db.collection('payments')
              .where('studentId', '==', auth.uid)
              .where('status', '==', 'succeeded')
              .limit(1)
              .get();
            if (prevPayments.empty) {
              const pct = Math.min(100, Math.max(0, Number(settings.welcomeDiscountPercent ?? 10)));
              welcomeDiscountCents = Math.min(originalAmountCents, Math.round((originalAmountCents * pct) / 100));
            }
          }
        }
      }

      let couponDiscountCents = 0;
      let couponToApply: Coupon | null = null;
      const normalizedCoupon = typeof couponCode === 'string' && couponCode.trim() ? normalizeCode(couponCode) : '';

      if (normalizedCoupon && originalAmountCents > 0) {
        const couponRef = db.collection('coupons').doc(normalizedCoupon);
        const couponSnap = await couponRef.get();
        if (!couponSnap.exists) {
          res.status(400).json({ error: 'Código de cupón no encontrado.' });
          return;
        }
        couponToApply = couponSnap.data() as Coupon;
        if (!isCouponActive(couponToApply)) {
          res.status(400).json({ error: 'El cupón no está activo, expiró o agotó sus usos.' });
          return;
        }
        if (couponToApply.appliesTo === 'courses' && !couponToApply.courseIds?.includes(String(courseId))) {
          res.status(400).json({ error: 'Este cupón no aplica a este curso.' });
          return;
        }
        if (couponToApply.minPurchaseCents && originalAmountCents < couponToApply.minPurchaseCents) {
          res.status(400).json({ error: `Compra mínima requerida: ${couponToApply.minPurchaseCents / 100} ${couponToApply.currency}.` });
          return;
        }
        couponDiscountCents = calculateDiscount(couponToApply, originalAmountCents).discountCents;
      }

      // No acumulación: usar el mayor descuento
      if (couponDiscountCents >= welcomeDiscountCents && couponDiscountCents > 0) {
        discountCents = couponDiscountCents;
        discountSource = 'coupon';
        appliedCouponCode = normalizedCoupon;
      } else if (welcomeDiscountCents > 0) {
        discountCents = welcomeDiscountCents;
        discountSource = 'referral_welcome';
      }

      const finalAmountCents = Math.max(0, originalAmountCents - discountCents);

      // Canje atómico de cupón (reserva pending + confirmación inmediata en pago mock exitoso)
      if (discountSource === 'coupon' && couponToApply && appliedCouponCode && !isTestModeAdmin) {
        const couponRef = db.collection('coupons').doc(appliedCouponCode);
        redemptionId = `cr_${crypto.randomBytes(8).toString('hex')}`;
        const redemptionRef = db.collection('couponRedemptions').doc(redemptionId);

        await db.runTransaction(async (tx: Transaction) => {
          const freshCouponSnap = await tx.get(couponRef);
          if (!freshCouponSnap.exists) throw new Error('Cupón no encontrado.');
          const freshCoupon = freshCouponSnap.data() as Coupon;

          if (!isCouponActive(freshCoupon)) throw new Error('El cupón ya no está disponible.');
          if (freshCoupon.appliesTo === 'courses' && !freshCoupon.courseIds?.includes(String(courseId))) {
            throw new Error('Este cupón no aplica a este curso.');
          }
          if (freshCoupon.maxRedemptions !== undefined && freshCoupon.redemptionCount >= freshCoupon.maxRedemptions) {
            throw new Error('El cupón ha agotado sus usos.');
          }

          // Límite por usuario (redenciones confirmed/pending)
          const userRedemptionsSnap = await tx.get(
            db.collection('couponRedemptions')
              .where('couponCode', '==', appliedCouponCode)
              .where('userId', '==', auth.uid)
          );
          const usedByUser = userRedemptionsSnap.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => {
            const st = (d.data() as CouponRedemption).status;
            return st === 'pending' || st === 'confirmed';
          }).length;
          if (usedByUser >= (freshCoupon.maxPerUser ?? 1)) {
            throw new Error('Ya has usado este cupón el máximo de veces permitido.');
          }

          const now = new Date().toISOString();
          const redemption: CouponRedemption = {
            id: redemptionId!,
            couponCode: appliedCouponCode!,
            userId: auth.uid,
            courseId: String(courseId),
            discountCents,
            status: 'confirmed', // mock payment succeeded immediately
            createdAt: now,
          };

          tx.set(redemptionRef, redemption);
          tx.update(couponRef, {
            redemptionCount: (freshCoupon.redemptionCount ?? 0) + 1,
            updatedAt: now,
          });
        });
      }

      // Si el precio final es 0, no pasamos por pasarela
      const isFree = finalAmountCents === 0;
      const prefix = isFree ? 'free' : gateway === 'stripe' ? 'pi' : gateway === 'mercadopago' ? 'mp' : 'pp';
      const transactionRef = `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
      const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

      const receipt = {
        paymentId,
        courseId: String(courseId),
        courseTitle: String(course.title || ''),
        studentId: auth.uid,
        instructorId: String(course.instructorId || ''),
        amountCents: finalAmountCents,
        originalAmountCents,
        discountCents,
        discountSource,
        couponCode: appliedCouponCode,
        redemptionId,
        currency,
        gateway: isFree ? 'free' : String(gateway),
        status: 'succeeded',
        transactionRef,
        authorizedAt: new Date().toISOString(),
      };

      broadcastEvent({ type: 'PAYMENT_COMPLETED', scope: 'user', ...receipt }, auth.uid);
      if (course.instructorId) {
        broadcastEvent({ type: 'INSTRUCTOR_SALE', scope: 'user', ...receipt }, String(course.instructorId));
        void dispatchWebhooks(String(course.instructorId), 'payment.succeeded', receipt);
      }

      res.json(receipt);
    } catch (err) {
      console.error('Checkout error:', err);
      const message = err instanceof Error ? err.message : 'Error procesando el pago.';
      res.status(400).json({ error: message });
    }
  });

  // =========================================================================
  // CUPONES — Endpoints (validación en servidor; escritura solo desde admin)
  // =========================================================================

  function normalizeCode(code: string): string {
    return String(code).trim().toUpperCase().replace(/\s+/g, '');
  }

  function isCouponActive(coupon: Coupon): boolean {
    const now = Date.now();
    if (!coupon.active) return false;
    if (coupon.startsAt && new Date(String(coupon.startsAt)).getTime() > now) return false;
    if (coupon.expiresAt && new Date(String(coupon.expiresAt)).getTime() < now) return false;
    if (coupon.maxRedemptions !== undefined && coupon.redemptionCount >= coupon.maxRedemptions) return false;
    return true;
  }

  function calculateDiscount(coupon: Coupon, priceCents: number): { discountCents: number; finalPriceCents: number } {
    if (coupon.type === 'percent') {
      const discount = Math.round((priceCents * coupon.value) / 100);
      return {
        discountCents: Math.min(discount, priceCents), // nunca más que el precio
        finalPriceCents: Math.max(0, priceCents - Math.min(discount, priceCents)),
      };
    }
    // fixed
    const discount = Math.min(coupon.value, priceCents);
    return {
      discountCents: discount,
      finalPriceCents: Math.max(0, priceCents - discount),
    };
  }

  // POST /api/coupons/validate — Validar cupón para un curso y precio
  app.post('/api/coupons/validate', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp, 30, 60_000)) {
      res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
      return;
    }

    const { code, courseId, priceCents } = req.body ?? {};
    if (!code || typeof courseId !== 'string' || typeof priceCents !== 'number' || priceCents < 0) {
      res.status(400).json({ error: 'Parámetros inválidos: code, courseId y priceCents son requeridos.' });
      return;
    }

    try {
      const db = getAdminDb();
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const couponSnap = await couponRef.get();

      if (!couponSnap.exists) {
        res.status(404).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: 'USD',
          reason: 'Código de cupón no encontrado.',
        });
        return;
      }

      const coupon = couponSnap.data() as Coupon;

      // Verificar vigencia
      if (!isCouponActive(coupon)) {
        let reason = 'El cupón no está activo.';
        if (!coupon.active) reason = 'El cupón ha sido desactivado.';
        else if (coupon.expiresAt && new Date(String(coupon.expiresAt)).getTime() < Date.now()) {
          reason = 'El cupón ha expirado.';
        } else if (coupon.maxRedemptions !== undefined && coupon.redemptionCount >= coupon.maxRedemptions) {
          reason = 'El cupón ha agotado sus usos disponibles.';
        }
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason,
        });
        return;
      }

      // Verificar aplicaTo
      if (coupon.appliesTo === 'courses' && (!coupon.courseIds || !coupon.courseIds.includes(courseId))) {
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason: 'Este cupón no aplica a este curso.',
        });
        return;
      }

      // Verificar monto mínimo
      if (coupon.minPurchaseCents && priceCents < coupon.minPurchaseCents) {
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason: `Compra mínima requerida: ${coupon.minPurchaseCents / 100} ${coupon.currency}.`,
        });
        return;
      }

      const { discountCents, finalPriceCents } = calculateDiscount(coupon, priceCents);

      res.json({
        valid: true,
        originalPriceCents: priceCents,
        discountCents,
        finalPriceCents,
        currency: coupon.currency,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
        },
      });
    } catch (err) {
      console.error('Coupon validation error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error validando cupón.' });
    }
  });

  // GET /api/coupons — Listar todos los cupones (solo admin)
  app.get('/api/coupons', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const snap = await db.collection('coupons').orderBy('createdAt', 'desc').get();
      const coupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coupon);
      res.json({ coupons });
    } catch (err) {
      console.error('List coupons error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error listando cupones.' });
    }
  });

  // POST /api/coupons — Crear cupón (solo admin)
  app.post('/api/coupons', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const {
        code, description, type, value, currency, appliesTo, courseIds,
        startsAt, expiresAt, maxRedemptions, maxPerUser, minPurchaseCents,
      } = req.body ?? {};

      if (!code || !description || !type || typeof value !== 'number') {
        res.status(400).json({ error: 'Faltan campos requeridos: code, description, type, value.' });
        return;
      }

      const normalizedCode = normalizeCode(code);
      const couponId = normalizedCode;

      if (type === 'percent' && (value < 1 || value > 100)) {
        res.status(400).json({ error: 'El porcentaje debe estar entre 1 y 100.' });
        return;
      }

      const now = new Date().toISOString();
      const coupon: Coupon = {
        id: couponId,
        code: normalizedCode,
        description: String(description).trim(),
        type: type as Coupon['type'],
        value,
        currency: currency || 'USD',
        appliesTo: appliesTo || 'all',
        courseIds: Array.isArray(courseIds) ? courseIds : [],
        startsAt: startsAt || undefined,
        expiresAt: expiresAt || undefined,
        maxRedemptions: typeof maxRedemptions === 'number' ? maxRedemptions : undefined,
        maxPerUser: typeof maxPerUser === 'number' && maxPerUser > 0 ? maxPerUser : 1,
        minPurchaseCents: typeof minPurchaseCents === 'number' ? minPurchaseCents : undefined,
        redemptionCount: 0,
        active: true,
        createdBy: 'admin',
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('coupons').doc(couponId).set(coupon);
      res.status(201).json({ coupon });
    } catch (err) {
      console.error('Create coupon error:', err);
      if (err instanceof Error && err.message.includes('already-exists')) {
        res.status(409).json({ error: 'Ya existe un cupón con ese código.' });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error creando cupón.' });
    }
  });

  // PUT /api/coupons/:code — Actualizar cupón (solo admin)
  app.put('/api/coupons/:code', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const snap = await couponRef.get();

      if (!snap.exists) {
        res.status(404).json({ error: 'Cupón no encontrado.' });
        return;
      }

      const updates: Partial<Coupon> = { ...req.body, updatedAt: new Date().toISOString() };
      // No permitir cambiar el id/code
      delete updates.id;
      delete updates.code;

      await couponRef.update(updates as any);
      const updatedSnap = await couponRef.get();
      res.json({ coupon: { id: updatedSnap.id, ...updatedSnap.data() } as Coupon });
    } catch (err) {
      console.error('Update coupon error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error actualizando cupón.' });
    }
  });

  // DELETE /api/coupons/:code — Eliminar cupón (solo admin; solo si no tiene redenciones)
  app.delete('/api/coupons/:code', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const snap = await couponRef.get();

      if (!snap.exists) {
        res.status(404).json({ error: 'Cupón no encontrado.' });
        return;
      }

      const coupon = snap.data() as Coupon;
      if (coupon.redemptionCount > 0) {
        res.status(400).json({ error: 'No se puede eliminar un cupón con redenciones. Desactívalo en su lugar.' });
        return;
      }

      await couponRef.delete();
      res.json({ success: true });
    } catch (err) {
      console.error('Delete coupon error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error eliminando cupón.' });
    }
  });

  // POST /api/coupons/:code/toggle — Activar/desactivar cupón (solo admin)
  app.post('/api/coupons/:code/toggle', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const { active } = req.body ?? {};

      if (typeof active !== 'boolean') {
        res.status(400).json({ error: 'El campo active es requerido (boolean).' });
        return;
      }

      const couponRef = db.collection('coupons').doc(normalizedCode);
      await couponRef.update({ active, updatedAt: new Date().toISOString() });
      res.json({ success: true, active });
    } catch (err) {
      console.error('Toggle coupon error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error cambiando estado del cupón.' });
    }
  });

  // GET /api/coupons/:code/redemptions — Listar redenciones de un cupón (solo admin)
  app.get('/api/coupons/:code/redemptions', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const snap = await db.collection('couponRedemptions')
        .where('couponCode', '==', normalizedCode)
        .orderBy('createdAt', 'desc')
        .get();

      const redemptions = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }) as CouponRedemption);
      const totalDiscount = redemptions
        .filter((r: CouponRedemption) => r.status === 'confirmed')
        .reduce((acc: number, r: CouponRedemption) => acc + r.discountCents, 0);

      res.json({ redemptions, totalDiscountCents: totalDiscount });
    } catch (err) {
      console.error('List redemptions error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error listando redenciones.' });
    }
  });

  // =========================================================================
  // REFERIDOS — Endpoints
  // =========================================================================

  // GET /api/referrals/settings — Obtener configuración de referidos (admin)
  app.get('/api/referrals/settings', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const snap = await db.collection('settings').doc('referrals').get();
      if (!snap.exists) {
        // Valores por defecto
        const defaults: ReferralSettings = {
          id: 'default',
          welcomeDiscountPercent: 10,
          referrerRewardPercent: 10,
          retentionDays: 7,
          maxRewardsPerReferrerPerMonth: 10,
          active: true,
          updatedAt: new Date().toISOString(),
        };
        await db.collection('settings').doc('referrals').set(defaults);
        res.json({ settings: defaults });
        return;
      }
      res.json({ settings: snap.data() as ReferralSettings });
    } catch (err) {
      console.error('Get referral settings error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error obteniendo configuración de referidos.' });
    }
  });

  // PUT /api/referrals/settings — Actualizar configuración de referidos (admin)
  app.put('/api/referrals/settings', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { welcomeDiscountPercent, referrerRewardPercent, retentionDays, maxRewardsPerReferrerPerMonth, active } = req.body ?? {};

      const settingsRef = db.collection('settings').doc('referrals');
      const updates: Partial<ReferralSettings> = {
        updatedAt: new Date().toISOString(),
      };
      if (typeof welcomeDiscountPercent === 'number') updates.welcomeDiscountPercent = welcomeDiscountPercent;
      if (typeof referrerRewardPercent === 'number') updates.referrerRewardPercent = referrerRewardPercent;
      if (typeof retentionDays === 'number') updates.retentionDays = retentionDays;
      if (typeof maxRewardsPerReferrerPerMonth === 'number') updates.maxRewardsPerReferrerPerMonth = maxRewardsPerReferrerPerMonth;
      if (typeof active === 'boolean') updates.active = active;

      await settingsRef.update(updates as any);
      const updatedSnap = await settingsRef.get();
      res.json({ settings: updatedSnap.data() as ReferralSettings });
    } catch (err) {
      console.error('Update referral settings error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error actualizando configuración de referidos.' });
    }
  });

  // GET /api/referrals — Listar todos los referidos (admin)
  app.get('/api/referrals', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const snap = await db.collection('referrals').orderBy('createdAt', 'desc').get();
      const referrals = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }) as Referral);
      res.json({ referrals });
    } catch (err) {
      console.error('List referrals error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error listando referidos.' });
    }
  });

  // GET /api/referrals/my — Obtener mis datos de referido (estudiante autenticado)
  app.get('/api/referrals/my', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const db = getAdminDb();
      const userId = auth.uid;

      const userSnap = await db.collection('users').doc(userId).get();
      const userData = userSnap.exists ? (userSnap.data() as { referralCode?: string; referredBy?: string }) : {};
      const referralCode = userData.referralCode;

      // Mis referidos como referidor
      const referralsSnap = await db.collection('referrals')
        .where('referrerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      const myReferrals = referralsSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }) as Referral);

      const totalRewards = myReferrals
        .filter((r: Referral) => r.status === 'rewarded')
        .reduce((acc: number, r: Referral) => acc + r.rewardValue, 0);
      const pendingRewards = myReferrals
        .filter((r: Referral) => r.status === 'qualified')
        .reduce((acc: number, r: Referral) => acc + r.rewardValue, 0);

      res.json({
        referralCode,
        referredBy: userData.referredBy,
        myReferrals,
        totalRewardsCents: totalRewards,
        pendingRewardsCents: pendingRewards,
      });
    } catch (err) {
      console.error('Get my referrals error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error obteniendo referidos.' });
    }
  });

  // POST /api/referrals/record — Registrar un referido tras pago confirmado (servidor interno)
  app.post('/api/referrals/record', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const { referrerId, referredId, orderId, rewardValue } = req.body ?? {};

      if (!referrerId || !referredId || !orderId || typeof rewardValue !== 'number') {
        res.status(400).json({ error: 'Faltan campos requeridos.' });
        return;
      }

      if (referrerId === referredId) {
        res.status(400).json({ error: 'No se permite autorreferido.' });
        return;
      }

      // Verificar que el referido no tenga ya un referido previo
      const existing = await db.collection('referrals')
        .where('referredId', '==', referredId)
        .limit(1)
        .get();
      if (!existing.empty) {
        res.status(400).json({ error: 'El usuario ya tiene un referidor asignado.' });
        return;
      }

      const now = new Date().toISOString();
      const referral: Referral = {
        id: `ref_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        referrerId,
        referredId,
        orderId,
        status: 'pending',
        rewardType: 'referrer_credit',
        rewardValue,
        createdAt: now,
      };

      await db.collection('referrals').doc(referral.id).set(referral);
      res.status(201).json({ referral });
    } catch (err) {
      console.error('Record referral error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error registrando referido.' });
    }
  });

  // POST /api/referrals/reconcile — Pasar referidos pendientes a qualified tras retención (admin/cron)
  app.post('/api/referrals/reconcile', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = getAdminDb();
      const settingsSnap = await db.collection('settings').doc('referrals').get();
      const settings = settingsSnap.exists ? (settingsSnap.data() as ReferralSettings) : {
        retentionDays: 7,
        active: true,
      };

      if (!settings.active) {
        res.json({ processed: 0 });
        return;
      }

      const retentionMs = (settings.retentionDays || 7) * 24 * 60 * 60 * 1000;
      const cutoff = new Date(Date.now() - retentionMs).toISOString();

      const pendingSnap = await db.collection('referrals')
        .where('status', '==', 'pending')
        .get();

      const batch = db.batch();
      let processed = 0;

      for (const docSnap of pendingSnap.docs) {
        const referral = docSnap.data() as Referral;
        if (referral.createdAt && String(referral.createdAt) <= cutoff) {
          batch.update(docSnap.ref, { status: 'qualified', qualifiedAt: new Date().toISOString() });
          processed++;
        }
      }

      if (processed > 0) await batch.commit();
      res.json({ processed });
    } catch (err) {
      console.error('Reconcile referrals error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error reconociendo referidos.' });
    }
  });

  app.post('/api/v1/webhooks/register', (req, res) => {
    const { id, ownerId, keyHash, label, webhookUrl } = req.body ?? {};
    if (!id || !ownerId || !keyHash) {
      res.status(400).json({ error: 'Missing id, ownerId, or keyHash' });
      return;
    }
    registeredKeys.set(String(id), {
      id: String(id),
      ownerId: String(ownerId),
      keyHash: String(keyHash),
      label: String(label || 'Integration Key'),
      webhookUrl: webhookUrl ? String(webhookUrl) : undefined,
    });
    res.json({ registered: true, id, activeKeys: registeredKeys.size });
  });

  app.post('/api/v1/webhooks/test', async (req, res) => {
    const { ownerId, event, webhookUrl, samplePayload } = req.body ?? {};
    const eventName = String(event || 'course.progress.updated');
    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: samplePayload || {
        courseId: 'excel-basico-05',
        progressPercent: 100,
        certificateIssued: true,
      },
    };
    const hmacSecret = crypto.createHash('sha256').update(String(ownerId || 'catedra')).digest('hex');
    const signature = crypto.createHmac('sha256', hmacSecret).update(JSON.stringify(payload)).digest('hex');

    let deliveryStatus = 200;
    let deliveryNote = 'Verified local HMAC-SHA256 payload signed';
    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Catedra-Event': eventName,
            'X-Catedra-Signature': `sha256=${signature}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);
        deliveryStatus = resp.status;
        deliveryNote = `Delivered HTTP ${resp.status} to ${webhookUrl}`;
      } catch (err) {
        deliveryStatus = 502;
        deliveryNote = err instanceof Error ? err.message : 'External endpoint unreachable';
      }
    }

    recentWebhooks.unshift({
      id: crypto.randomUUID(),
      event: eventName,
      targetUrl: String(webhookUrl || 'local-sandbox'),
      status: deliveryStatus,
      dispatchedAt: new Date().toISOString(),
    });
    if (recentWebhooks.length > 25) recentWebhooks.pop();

    res.json({
      dispatched: true,
      signature: `sha256=${signature}`,
      deliveryStatus,
      deliveryNote,
      payload,
      recentDeliveries: recentWebhooks.slice(0, 8),
    });
  });

  app.get('/api/v1/webhooks/logs', (_req, res) => {
    res.json({ deliveries: recentWebhooks });
  });

  app.post('/api/v1/cloud-storage/sync', (req, res) => {
    const { ownerId, provider, folder, encryptedEnvelope } = req.body ?? {};
    if (!ownerId || !provider || !encryptedEnvelope || encryptedEnvelope.algorithm !== 'AES-GCM-256') {
      res.status(400).json({ error: 'Encrypted AES-GCM-256 envelope required for zero-knowledge cloud sync' });
      return;
    }
    const serialized = JSON.stringify(encryptedEnvelope);
    const checksumSha256 = crypto.createHash('sha256').update(serialized).digest('hex');
    const record: CloudBackupRecord = {
      ownerId: String(ownerId),
      provider: String(provider),
      folder: String(folder || '/Catedra-Backups'),
      checksumSha256,
      bytes: Buffer.byteLength(serialized, 'utf8'),
      syncedAt: new Date().toISOString(),
    };
    const existing = cloudBackups.get(String(ownerId)) ?? [];
    existing.unshift(record);
    cloudBackups.set(String(ownerId), existing.slice(0, 15));
    res.json({
      ok: true,
      ...record,
      history: existing.slice(0, 5),
    });
  });

  const generatedCoversDir = path.resolve(__dirname, 'public', 'generated-covers');
  fs.mkdirSync(generatedCoversDir, { recursive: true });
  app.use('/generated-covers', express.static(generatedCoversDir));

  app.post('/api/v1/courses/generate-cover', async (req, res) => {
    try {
      await verifyFirebaseAdminBearerToken(req.headers.authorization);
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      res.status(401).json({ error: 'No autorizado para generar portadas.' });
      return;
    }

    const { title, category, level } = req.body ?? {};
    const safeTitle = String(title || 'Nuevo Curso Técnico').trim().slice(0, 64);
    const safeCategory = String(category || 'DB Academy').trim().slice(0, 32);
    const safeLevel = String(level || 'intermediate').trim();

    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const palettes: Record<string, { bg: string; accent: string; secondary: string }> = {
      Productividad: { bg: '#0A1914', accent: '#10B981', secondary: '#064E3B' },
      Ingeniería: { bg: '#090F1E', accent: '#3B82F6', secondary: '#1E3A8A' },
      Datos: { bg: '#0B1120', accent: '#0EA5E9', secondary: '#0C4A6E' },
      Diseño: { bg: '#18141C', accent: '#F59E0B', secondary: '#78350F' },
      Seguridad: { bg: '#111318', accent: '#EF4444', secondary: '#7F1D1D' },
    };
    const palette = palettes[safeCategory] || { bg: '#0F172A', accent: '#2563EB', secondary: '#1E293B' };

    const slug = safeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'course';
    const fileName = `${slug}-${Date.now().toString(36)}.svg`;
    const filePath = path.join(generatedCoversDir, fileName);

    const words = safeTitle.split(/\s+/);
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="720" fill="url(#bgGrad)"/>
  <rect width="1280" height="720" fill="url(#grid)"/>
  <circle cx="1040" cy="180" r="240" fill="${palette.secondary}" fill-opacity="0.35"/>
  <rect x="860" y="150" width="290" height="420" rx="18" fill="#0F172A" fill-opacity="0.7" stroke="${palette.accent}" stroke-opacity="0.45" stroke-width="2"/>
  <line x1="900" y1="220" x2="1110" y2="220" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round"/>
  <line x1="900" y1="265" x2="1060" y2="265" stroke="#94A3B8" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round"/>
  <line x1="900" y1="300" x2="1090" y2="300" stroke="#94A3B8" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>
  <rect x="900" y="360" width="210" height="140" rx="10" fill="${palette.secondary}" fill-opacity="0.4" stroke="#FFFFFF" stroke-opacity="0.1"/>
  <polyline points="920,470 965,425 1015,445 1085,385" fill="none" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="88" y="132" fill="${palette.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" letter-spacing="2">DB ACADEMY · ${escapeXml(safeCategory.toUpperCase())}</text>
  <text x="88" y="310" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${escapeXml(line1)}</text>
  ${line2 ? `<text x="88" y="384" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${escapeXml(line2)}</text>` : ''}
  <text x="88" y="610" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="22">LEVEL: ${escapeXml(safeLevel.toUpperCase())} · FORMATIONAL TRACK</text>
</svg>`;

    fs.writeFileSync(filePath, svg, 'utf8');
    res.json({
      coverImage: `/generated-covers/${fileName}`,
      generatedAt: new Date().toISOString(),
    });
  });

  const server = http.createServer(app);

  if (!isProduction) {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: { server, path: '/vite-ws' },
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    let currentClient: SyncClient | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg.type === 'IDENTIFY' && typeof msg.uid === 'string' && typeof msg.deviceId === 'string') {
          currentClient = {
            ws,
            uid: msg.uid,
            deviceId: msg.deviceId,
            deviceLabel: typeof msg.deviceLabel === 'string' ? msg.deviceLabel : 'Web Browser',
            role: typeof msg.role === 'string' ? msg.role : 'student',
            connectedAt: new Date().toISOString(),
          };
          clients.add(currentClient);
          broadcastPresence(currentClient.uid);
          return;
        }

        if (!currentClient) return;

        if (msg.type === 'SYNC_PREFS' || msg.type === 'TASK_UPDATED') {
          broadcastEvent(msg, currentClient.uid);
          return;
        }

        if (
          msg.type === 'PROGRESS_UPDATED' ||
          msg.type === 'FORUM_POSTED' ||
          msg.type === 'CERTIFICATE_ISSUED' ||
          msg.type === 'CALENDAR_ALERT'
        ) {
          broadcastEvent({ ...msg, scope: 'global', senderUid: currentClient.uid });
          if (msg.type === 'PROGRESS_UPDATED' && typeof msg.instructorId === 'string') {
            void dispatchWebhooks(msg.instructorId, 'module.completed', msg);
          }
          if (msg.type === 'CERTIFICATE_ISSUED' && typeof msg.instructorId === 'string') {
            void dispatchWebhooks(msg.instructorId, 'certificate.issued', msg);
          }
        }
      } catch {
        // Ignore malformed socket frames
      }
    });

    ws.on('close', () => {
      if (currentClient) {
        const uid = currentClient.uid;
        clients.delete(currentClient);
        broadcastPresence(uid);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Cátedra LMS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
