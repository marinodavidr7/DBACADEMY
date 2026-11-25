import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { isSupabaseAdminConfigured, serverDb } from './src/lib/supabase/serverClient';
import { getLegalDocumentByFile } from './src/services/legalDocuments';
import type { Coupon, CouponRedemption, Referral, ReferralSettings } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// El servidor necesita las credenciales de servicio (no las VITE_* del cliente).
// En local están en .env.local; en producción las inyecta el hosting.
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

const supabaseAdminConfigured = isSupabaseAdminConfigured();
if (!supabaseAdminConfigured) {
  console.warn(
    '[server] Falta SUPABASE_URL o la clave de servicio (SUPABASE_SERVICE_KEY / SUPABASE_SECRET_KEY): las escrituras de administrador fallarán.'
  );
}

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const AUTHORIZED_ADMIN_EMAIL = 'marinodavidr7@gmail.com';

// Sesiones por inactividad también en el backend (defensa en profundidad).
// Un token reutilizado tras 15 min sin peticiones autenticadas se rechaza con 401.
const SERVER_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
interface SessionActivity { tokenIat: number; lastSeen: number }
const sessionActivity = new Map<string, SessionActivity>();

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
  // Conserva las sesiones expiradas 24 h para poder rechazar tokens reutilizados.
  for (const [uid, session] of sessionActivity.entries()) {
    if (now - session.lastSeen > 24 * 60 * 60 * 1000) sessionActivity.delete(uid);
  }
}, 60_000);
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

function loadFirebaseConfig(): { projectId: string; firestoreDatabaseId: string; apiKey: string } {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as {
      projectId?: string;
      firestoreDatabaseId?: string;
      apiKey?: string;
    };
    return {
      projectId: parsed.projectId || process.env.FIREBASE_PROJECT_ID || 'river-pipe-m6tvw',
      firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)',
      apiKey: parsed.apiKey || '',
    };
  } catch {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || 'river-pipe-m6tvw',
      firestoreDatabaseId: '(default)',
      apiKey: '',
    };
  }
}

const FIREBASE_APP_CONFIG = loadFirebaseConfig();
const FIREBASE_PROJECT_ID = FIREBASE_APP_CONFIG.projectId;
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

  // Inactividad: si el mismo token se reutiliza tras el timeout, se rechaza.
  // Un token recién emitido (nuevo inicio de sesión / renovación) inicia sesión nueva.
  const nowMs = Date.now();
  const tokenIat = payload.iat as number;
  const session = sessionActivity.get(payload.sub);
  if (!session || tokenIat > session.tokenIat) {
    sessionActivity.set(payload.sub, { tokenIat, lastSeen: nowMs });
  } else {
    if (nowMs - session.lastSeen > SERVER_IDLE_TIMEOUT_MS) {
      throw new AuthValidationError(401, 'Sesión expirada por inactividad. Inicia sesión nuevamente.');
    }
    session.lastSeen = nowMs;
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

interface PendingLemonCheckout {
  paymentId: string;
  checkoutId: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userEmail: string | null;
  instructorId: string;
  amountCents: number;
  originalAmountCents: number;
  discountCents: number;
  discountSource: 'none' | 'coupon' | 'gift_card';
  couponCode?: string;
  giftCardCode?: string;
  currency: 'DOP' | 'USD' | 'EUR' | 'MXN';
  chargedCents: number;
  variantId: string;
  testMode: boolean;
  createdAtMs: number;
}

interface VerifiedLemonOrder {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  identifier: string;
  courseId: string;
  userId: string;
  status: 'paid' | 'refunded';
  receiptUrl?: string;
  totalCents: number;
  currency: string;
  verifiedAt: string;
}

const pendingLemonCheckouts = new Map<string, PendingLemonCheckout>();
const verifiedLemonOrders = new Map<string, VerifiedLemonOrder>();

function parseFirestoreValue(val: Record<string, unknown>): unknown {
  if ('stringValue' in val) return String(val.stringValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return String(val.timestampValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val && val.arrayValue && typeof val.arrayValue === 'object') {
    const values = (val.arrayValue as { values?: Array<Record<string, unknown>> }).values ?? [];
    return values.map((item) => parseFirestoreValue(item));
  }
  if ('mapValue' in val && val.mapValue && typeof val.mapValue === 'object') {
    const fields = (val.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = parseFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

async function readFirestoreDoc(
  collectionName: 'courses' | 'coupons' | 'giftCards',
  docId: string,
  _bearerHeader?: string
): Promise<Record<string, unknown> | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(docId)) {
    return null;
  }
  const snap = await serverDb.collection(collectionName).doc(docId).get();
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}

function getLemonSqueezyConfig() {
  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || '').trim();
  const defaultVariantId = (process.env.LEMONSQUEEZY_DEFAULT_VARIANT_ID || '').trim();
  const webhookSecret = (process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '').trim();
  const testMode = process.env.LEMONSQUEEZY_TEST_MODE === 'true';
  const storeCurrency = (process.env.LEMONSQUEEZY_STORE_CURRENCY || 'USD').trim().toUpperCase();
  const dopPerUsd = Math.max(1, Number(process.env.LEMONSQUEEZY_DOP_PER_USD || 60));
  const mxnPerUsd = Math.max(1, Number(process.env.LEMONSQUEEZY_MXN_PER_USD || 18));

  let variantMap: Record<string, string> = {};
  const rawMap = (process.env.LEMONSQUEEZY_VARIANT_MAP || '').trim();
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' || typeof v === 'number') {
          variantMap[k] = String(v).trim();
        }
      }
    } catch {
      // Ignore invalid JSON variant map; fallback to defaultVariantId
    }
  }

  const missingKeys: string[] = [];
  if (!apiKey) missingKeys.push('LEMONSQUEEZY_API_KEY');
  if (!storeId) missingKeys.push('LEMONSQUEEZY_STORE_ID');
  if (!defaultVariantId && Object.keys(variantMap).length === 0) {
    missingKeys.push('LEMONSQUEEZY_DEFAULT_VARIANT_ID');
  }

  return {
    apiKey,
    storeId,
    defaultVariantId,
    variantMap,
    webhookSecret,
    testMode,
    storeCurrency,
    dopPerUsd,
    mxnPerUsd,
    configured: Boolean(apiKey && storeId && (defaultVariantId || Object.keys(variantMap).length > 0)),
    webhookConfigured: Boolean(webhookSecret),
    missingKeys,
  };
}

function resolveAppBaseUrl(req: express.Request): string {
  const configured = (process.env.APP_URL || '').trim();
  if (configured && configured !== 'MY_APP_URL') {
    try {
      const u = new URL(configured);
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        return u.origin;
      }
    } catch {
      // Fallback to request host
    }
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = typeof protoHeader === 'string' ? protoHeader.split(',')[0].trim() : req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto === 'https' ? 'https' : 'http'}://${host}`;
}

function convertCourseCentsToStoreCents(
  amountCents: number,
  courseCurrency: string,
  config: ReturnType<typeof getLemonSqueezyConfig>
): number {
  if (amountCents <= 0) return 0;
  if (courseCurrency === config.storeCurrency) {
    return Math.max(50, Math.round(amountCents));
  }
  if (config.storeCurrency === 'USD') {
    if (courseCurrency === 'DOP') {
      return Math.max(50, Math.round(amountCents / config.dopPerUsd));
    }
    if (courseCurrency === 'MXN') {
      return Math.max(50, Math.round(amountCents / config.mxnPerUsd));
    }
  }
  return Math.max(50, Math.round(amountCents));
}

async function startServer() {
  const app = express();
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

  // REST API v1 for third-party integrations, payment gateways, cloud storage & webhooks
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'catedra-lms-api',
      version: '1.0.0',
      connectedSockets: clients.size,
      // Booleano: permite a QA verificar la inyección de ENV sin exponer secretos.
      supabaseAdminConfigured,
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
        description: 'REST API for course sync, real-time progress webhooks, Lemon Squeezy & multi-gateway payment verification, and certificate validation.',
      },
      servers: [{ url: `${baseUrl}/api/v1` }],
      paths: {
        '/health': { get: { summary: 'API and WebSocket Gateway Health' } },
        '/payments/checkout': { post: { summary: 'Authorize Lemon Squeezy, Stripe, Mercado Pago, or PayPal course purchase' } },
        '/payments/lemonsqueezy/status': { get: { summary: 'Inspect Lemon Squeezy server configuration status' } },
        '/payments/lemonsqueezy/checkout': { post: { summary: 'Create hosted Lemon Squeezy checkout session (app.lemonsqueezy.com)' } },
        '/payments/lemonsqueezy/webhook': { post: { summary: 'Receive HMAC-SHA256 signed Lemon Squeezy order webhooks' } },
        '/payments/lemonsqueezy/verify': { get: { summary: 'Verify Lemon Squeezy order completion for authenticated student' } },
        '/webhooks/register': { post: { summary: 'Register API key hash and webhook endpoint' } },
        '/webhooks/test': { post: { summary: 'Dispatch signed HMAC-SHA256 webhook event' } },
        '/cloud-storage/sync': { post: { summary: 'Upload client-encrypted E2EE backup manifest' } },
      },
    });
  });

  // -------------------------------------------------------------------------
  // Lemon Squeezy (https://app.lemonsqueezy.com) Payment Gateway Integration
  // -------------------------------------------------------------------------
  app.get('/api/v1/payments/lemonsqueezy/status', (_req, res) => {
    const cfg = getLemonSqueezyConfig();
    res.json({
      configured: cfg.configured,
      webhookConfigured: cfg.webhookConfigured,
      testMode: cfg.testMode,
      providerUrl: 'https://app.lemonsqueezy.com',
      storeCurrency: cfg.storeCurrency,
      missingKeys: cfg.missingKeys,
    });
  });

  app.post('/api/v1/payments/lemonsqueezy/checkout', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { courseId, couponCode, giftCardCode, customerName } = req.body ?? {};
    const safeCourseId = typeof courseId === 'string' ? courseId.trim() : '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(safeCourseId)) {
      res.status(400).json({ error: 'Identificador de curso inválido.' });
      return;
    }

    try {
      const course = await readFirestoreDoc('courses', safeCourseId, req.headers.authorization);
      if (!course) {
        res.status(404).json({ error: 'Curso no encontrado en Firestore.' });
        return;
      }

      const courseTitle = String(course.title || 'Curso DB Academy').slice(0, 140);
      const instructorId = String(course.instructorId || '');
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      const rawCurr = String(course.currency || 'DOP');
      const currency = (
        rawCurr === 'EUR' || rawCurr === 'MXN' || rawCurr === 'USD' ? rawCurr : 'DOP'
      ) as 'DOP' | 'USD' | 'EUR' | 'MXN';

      let discountCents = 0;
      let discountSource: 'none' | 'coupon' | 'gift_card' = 'none';
      let appliedCouponCode: string | undefined;
      let appliedGiftCardCode: string | undefined;

      const normalizedGiftCard =
        typeof giftCardCode === 'string' && giftCardCode.trim()
          ? normalizeCode(giftCardCode)
          : '';
      const normalizedCoupon =
        typeof couponCode === 'string' && couponCode.trim()
          ? normalizeCode(couponCode)
          : '';

      if (normalizedGiftCard && originalAmountCents > 0) {
        if (!/^[A-Z0-9_-]{6,64}$/.test(normalizedGiftCard)) {
          res.status(400).json({ error: 'Formato de Gift Card inválido.' });
          return;
        }
        const card = await readFirestoreDoc('giftCards', normalizedGiftCard, req.headers.authorization);
        if (!card || card.active !== true || card.status !== 'active') {
          res.status(400).json({ error: 'La Gift Card no está activa o no existe.' });
          return;
        }
        if (card.courseId && String(card.courseId) !== safeCourseId) {
          res.status(400).json({ error: 'Esta Gift Card no aplica a este curso.' });
          return;
        }
        if (String(card.currency) !== currency) {
          res.status(400).json({ error: 'La moneda de la Gift Card no coincide con el curso.' });
          return;
        }
        const remaining = Math.max(0, Math.round(Number(card.remainingAmountCents ?? 0)));
        if (remaining <= 0) {
          res.status(400).json({ error: 'La Gift Card no tiene saldo disponible.' });
          return;
        }
        discountCents = Math.min(originalAmountCents, remaining);
        discountSource = 'gift_card';
        appliedGiftCardCode = normalizedGiftCard;
      } else if (normalizedCoupon && originalAmountCents > 0) {
        if (!/^[A-Z0-9_-]{3,64}$/.test(normalizedCoupon)) {
          res.status(400).json({ error: 'Formato de cupón inválido.' });
          return;
        }
        const couponDoc = await readFirestoreDoc('coupons', normalizedCoupon, req.headers.authorization);
        if (!couponDoc) {
          res.status(400).json({ error: 'Código de cupón no encontrado.' });
          return;
        }
        const coupon = couponDoc as unknown as Coupon;
        if (!isCouponActive(coupon)) {
          res.status(400).json({ error: 'El cupón no está activo, expiró o agotó sus usos.' });
          return;
        }
        if (coupon.appliesTo === 'courses' && !coupon.courseIds?.includes(safeCourseId)) {
          res.status(400).json({ error: 'Este cupón no aplica a este curso.' });
          return;
        }
        if (coupon.minPurchaseCents && originalAmountCents < coupon.minPurchaseCents) {
          res.status(400).json({ error: 'El monto del curso no alcanza el mínimo requerido por el cupón.' });
          return;
        }
        discountCents = calculateDiscount(coupon, originalAmountCents).discountCents;
        discountSource = 'coupon';
        appliedCouponCode = normalizedCoupon;
      }

      const finalAmountCents = Math.max(0, originalAmountCents - discountCents);
      const paymentId = `pay_ls_${crypto.randomBytes(8).toString('hex')}`;

      if (finalAmountCents === 0) {
        res.json({
          freeBypass: true,
          paymentId,
          courseId: safeCourseId,
          amountCents: 0,
          originalAmountCents,
          discountCents,
          currency,
          couponCode: appliedCouponCode,
          giftCardCode: appliedGiftCardCode,
        });
        return;
      }

      const lsConfig = getLemonSqueezyConfig();
      const resolvedVariantId = lsConfig.variantMap[safeCourseId] || lsConfig.defaultVariantId;

      if (!lsConfig.apiKey || !lsConfig.storeId || !resolvedVariantId) {
        res.status(503).json({
          code: 'LEMONSQUEEZY_NOT_CONFIGURED',
          error:
            'Falta configurar las credenciales de Lemon Squeezy en Secrets del servidor (LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID y LEMONSQUEEZY_DEFAULT_VARIANT_ID).',
          missingKeys: lsConfig.missingKeys,
        });
        return;
      }

      const appBaseUrl = resolveAppBaseUrl(req);
      const redirectUrl =
        `${appBaseUrl}/?ls_checkout=success` +
        `&course_id=${encodeURIComponent(safeCourseId)}` +
        `&payment_id=${encodeURIComponent(paymentId)}`;

      const chargedCents = convertCourseCentsToStoreCents(finalAmountCents, currency, lsConfig);

      const checkoutPayload = {
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: chargedCents,
            product_options: {
              name: courseTitle,
              description: `Acceso completo en DB Academy · ${currency} ${(finalAmountCents / 100).toFixed(2)}`,
              redirect_url: redirectUrl,
              receipt_button_text: 'Volver al curso en DB Academy',
              receipt_link_url: redirectUrl,
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
            },
            checkout_data: {
              ...(auth.email ? { email: auth.email } : {}),
              ...(typeof customerName === 'string' && customerName.trim()
                ? { name: customerName.trim().slice(0, 100) }
                : {}),
              custom: {
                payment_id: paymentId,
                course_id: safeCourseId,
                user_id: auth.uid,
                coupon_code: appliedCouponCode || '',
                gift_card_code: appliedGiftCardCode || '',
              },
            },
            test_mode: lsConfig.testMode,
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: lsConfig.storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: resolvedVariantId,
              },
            },
          },
        },
      };

      const lsResp = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${lsConfig.apiKey}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        body: JSON.stringify(checkoutPayload),
      });

      const lsBody = (await lsResp.json().catch(() => ({}))) as {
        data?: { id?: string; attributes?: { url?: string } };
        errors?: Array<{ detail?: string; title?: string }>;
      };

      const checkoutUrl = lsBody.data?.attributes?.url;
      const checkoutId = lsBody.data?.id;

      if (!lsResp.ok || !checkoutUrl || !checkoutId) {
        const detail =
          lsBody.errors?.map((e) => e.detail || e.title).filter(Boolean).join('; ') ||
          `HTTP ${lsResp.status}`;
        res.status(502).json({
          error: `Lemon Squeezy rechazó la creación del checkout: ${detail}`,
        });
        return;
      }

      pendingLemonCheckouts.set(paymentId, {
        paymentId,
        checkoutId,
        courseId: safeCourseId,
        courseTitle,
        userId: auth.uid,
        userEmail: auth.email,
        instructorId,
        amountCents: finalAmountCents,
        originalAmountCents,
        discountCents,
        discountSource,
        couponCode: appliedCouponCode,
        giftCardCode: appliedGiftCardCode,
        currency,
        chargedCents,
        variantId: resolvedVariantId,
        testMode: lsConfig.testMode,
        createdAtMs: Date.now(),
      });

      res.json({
        freeBypass: false,
        checkoutUrl,
        checkoutId,
        paymentId,
        courseId: safeCourseId,
        amountCents: finalAmountCents,
        originalAmountCents,
        discountCents,
        currency,
        couponCode: appliedCouponCode,
        giftCardCode: appliedGiftCardCode,
        testMode: lsConfig.testMode,
      });
    } catch (err) {
      console.error('Lemon Squeezy checkout error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error creando el checkout en Lemon Squeezy.',
      });
    }
  });

  app.post('/api/v1/payments/lemonsqueezy/webhook', (req, res) => {
    const lsConfig = getLemonSqueezyConfig();
    if (!lsConfig.webhookSecret) {
      res.status(503).json({ error: 'LEMONSQUEEZY_WEBHOOK_SECRET not configured' });
      return;
    }

    const signatureHeader = req.headers['x-signature'];
    const signatureHex = typeof signatureHeader === 'string' ? signatureHeader.trim() : '';
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;

    if (!signatureHex || !rawBody || rawBody.length === 0) {
      res.status(401).json({ error: 'Missing webhook signature or payload' });
      return;
    }

    const expectedHex = crypto
      .createHmac('sha256', lsConfig.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signatureHex, 'utf8');
    const expBuf = Buffer.from(expectedHex, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      res.status(401).json({ error: 'Invalid Lemon Squeezy webhook signature' });
      return;
    }

    const payload = (req.body ?? {}) as {
      meta?: {
        event_name?: string;
        custom_data?: {
          payment_id?: string;
          course_id?: string;
          user_id?: string;
        };
      };
      data?: {
        id?: string;
        attributes?: {
          order_number?: number;
          identifier?: string;
          status?: string;
          total?: number;
          currency?: string;
          urls?: { receipt?: string };
        };
      };
    };

    const eventName = payload.meta?.event_name || '';
    const customData = payload.meta?.custom_data || {};
    const paymentId = typeof customData.payment_id === 'string' ? customData.payment_id : '';
    const courseId = typeof customData.course_id === 'string' ? customData.course_id : '';
    const userId = typeof customData.user_id === 'string' ? customData.user_id : '';
    const orderId = String(payload.data?.id || '');
    const attrs = payload.data?.attributes || {};

    if (paymentId && (eventName === 'order_created' || eventName === 'order_refunded')) {
      const orderStatus: 'paid' | 'refunded' =
        eventName === 'order_refunded' || attrs.status === 'refunded' ? 'refunded' : 'paid';

      if (orderStatus === 'paid' && attrs.status && attrs.status !== 'paid') {
        res.json({ received: true, ignoredStatus: attrs.status });
        return;
      }

      const verifiedRecord: VerifiedLemonOrder = {
        paymentId,
        orderId,
        orderNumber: String(attrs.order_number || orderId),
        identifier: String(attrs.identifier || orderId),
        courseId,
        userId,
        status: orderStatus,
        receiptUrl: attrs.urls?.receipt,
        totalCents: Number(attrs.total ?? 0),
        currency: String(attrs.currency || 'USD'),
        verifiedAt: new Date().toISOString(),
      };
      verifiedLemonOrders.set(paymentId, verifiedRecord);

      if (orderStatus === 'paid' && userId) {
        const pending = pendingLemonCheckouts.get(paymentId);
        const eventPayload = {
          paymentId,
          courseId: courseId || pending?.courseId || '',
          courseTitle: pending?.courseTitle || '',
          studentId: userId,
          instructorId: pending?.instructorId || '',
          amountCents: pending?.amountCents ?? verifiedRecord.totalCents,
          currency: pending?.currency || verifiedRecord.currency,
          gateway: 'lemonsqueezy',
          status: 'succeeded',
          transactionRef: `LS-${verifiedRecord.orderNumber}`,
          authorizedAt: verifiedRecord.verifiedAt,
        };
        broadcastEvent({ type: 'PAYMENT_COMPLETED', scope: 'user', ...eventPayload }, userId);
        if (pending?.instructorId) {
          broadcastEvent({ type: 'INSTRUCTOR_SALE', scope: 'user', ...eventPayload }, pending.instructorId);
          void dispatchWebhooks(pending.instructorId, 'payment.succeeded', eventPayload);
        }
      }
    }

    res.json({ received: true });
  });

  app.get('/api/v1/payments/lemonsqueezy/verify', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId.trim() : '';
    const courseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : '';
    const orderIdQuery = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';

    if (!paymentId || !/^[a-zA-Z0-9_-]{4,128}$/.test(paymentId)) {
      res.status(400).json({ error: 'paymentId inválido.' });
      return;
    }

    const pending = pendingLemonCheckouts.get(paymentId);
    if (pending && pending.userId !== auth.uid) {
      res.status(403).json({ error: 'Esta sesión de pago pertenece a otro usuario.' });
      return;
    }
    if (pending && courseId && pending.courseId !== courseId) {
      res.status(400).json({ error: 'El curso no coincide con la sesión de pago.' });
      return;
    }

    // 1) Check webhook-confirmed order first
    let verified = verifiedLemonOrders.get(paymentId);
    if (verified && verified.userId && verified.userId !== auth.uid) {
      res.status(403).json({ error: 'La orden verificada pertenece a otro usuario.' });
      return;
    }

    // 2) Fallback: Query Lemon Squeezy Orders API directly using server API key
    const lsConfig = getLemonSqueezyConfig();
    if (!verified && lsConfig.apiKey && lsConfig.storeId && (pending || orderIdQuery)) {
      try {
        if (orderIdQuery && /^[0-9]+$/.test(orderIdQuery)) {
          const orderResp = await fetch(`https://api.lemonsqueezy.com/v1/orders/${orderIdQuery}`, {
            headers: {
              Authorization: `Bearer ${lsConfig.apiKey}`,
              Accept: 'application/vnd.api+json',
            },
          });
          if (orderResp.ok) {
            const orderJson = (await orderResp.json()) as {
              data?: {
                id?: string;
                attributes?: {
                  status?: string;
                  order_number?: number;
                  identifier?: string;
                  user_email?: string;
                  total?: number;
                  currency?: string;
                  urls?: { receipt?: string };
                };
              };
            };
            const attrs = orderJson.data?.attributes;
            const emailMatches =
              !auth.email ||
              !attrs?.user_email ||
              attrs.user_email.trim().toLowerCase() === auth.email.toLowerCase();
            if (orderJson.data?.id && attrs?.status === 'paid' && emailMatches) {
              verified = {
                paymentId,
                orderId: String(orderJson.data.id),
                orderNumber: String(attrs.order_number || orderJson.data.id),
                identifier: String(attrs.identifier || orderJson.data.id),
                courseId: pending?.courseId || courseId,
                userId: auth.uid,
                status: 'paid',
                receiptUrl: attrs.urls?.receipt,
                totalCents: Number(attrs.total ?? 0),
                currency: String(attrs.currency || 'USD'),
                verifiedAt: new Date().toISOString(),
              };
              verifiedLemonOrders.set(paymentId, verified);
            }
          }
        } else if (pending && auth.email) {
          const ordersUrl = new URL('https://api.lemonsqueezy.com/v1/orders');
          ordersUrl.searchParams.set('filter[store_id]', lsConfig.storeId);
          ordersUrl.searchParams.set('filter[user_email]', auth.email);
          ordersUrl.searchParams.set('sort', '-createdAt');
          ordersUrl.searchParams.set('page[size]', '10');

          const ordersResp = await fetch(ordersUrl.toString(), {
            headers: {
              Authorization: `Bearer ${lsConfig.apiKey}`,
              Accept: 'application/vnd.api+json',
            },
          });
          if (ordersResp.ok) {
            const ordersJson = (await ordersResp.json()) as {
              data?: Array<{
                id?: string;
                attributes?: {
                  status?: string;
                  order_number?: number;
                  identifier?: string;
                  created_at?: string;
                  total?: number;
                  currency?: string;
                  urls?: { receipt?: string };
                  first_order_item?: { variant_id?: number | string };
                };
              }>;
            };
            const matched = (ordersJson.data ?? []).find((ord) => {
              const a = ord.attributes;
              if (!a || a.status !== 'paid') return false;
              const createdMs = a.created_at ? new Date(a.created_at).getTime() : 0;
              const afterCheckout = createdMs >= pending.createdAtMs - 60_000;
              const variantOk =
                !a.first_order_item?.variant_id ||
                String(a.first_order_item.variant_id) === String(pending.variantId);
              return afterCheckout && variantOk;
            });
            if (matched?.id && matched.attributes) {
              verified = {
                paymentId,
                orderId: String(matched.id),
                orderNumber: String(matched.attributes.order_number || matched.id),
                identifier: String(matched.attributes.identifier || matched.id),
                courseId: pending.courseId,
                userId: auth.uid,
                status: 'paid',
                receiptUrl: matched.attributes.urls?.receipt,
                totalCents: Number(matched.attributes.total ?? 0),
                currency: String(matched.attributes.currency || 'USD'),
                verifiedAt: new Date().toISOString(),
              };
              verifiedLemonOrders.set(paymentId, verified);
            }
          }
        }
      } catch (err) {
        console.error('Lemon Squeezy verify lookup error:', err);
      }
    }

    if (!verified || verified.status !== 'paid') {
      res.json({
        verified: false,
        status: verified?.status === 'refunded' ? 'refunded' : 'pending',
        paymentId,
        courseId: pending?.courseId || courseId,
        message:
          verified?.status === 'refunded'
            ? 'Esta orden fue reembolsada en Lemon Squeezy.'
            : 'El pago aún aparece pendiente de confirmación en Lemon Squeezy.',
      });
      return;
    }

    res.json({
      verified: true,
      status: 'paid',
      paymentId,
      courseId: pending?.courseId || verified.courseId || courseId,
      courseTitle: pending?.courseTitle,
      instructorId: pending?.instructorId,
      transactionRef: `LS-${verified.orderNumber}`,
      amountCents: pending?.amountCents,
      originalAmountCents: pending?.originalAmountCents,
      discountCents: pending?.discountCents,
      discountSource: pending?.discountSource ?? 'none',
      couponCode: pending?.couponCode,
      giftCardCode: pending?.giftCardCode,
      currency: pending?.currency,
      receiptUrl: verified.receiptUrl,
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
    const allowedGateways = ['lemonsqueezy', 'stripe', 'mercadopago', 'paypal'];
    if (!allowedGateways.includes(String(gateway))) {
      res.status(400).json({ error: 'Unsupported payment gateway' });
      return;
    }

    try {
      const db = serverDb;

      // Fuente de verdad: curso desde Firestore
      const courseSnap = await db.collection('courses').doc(String(courseId)).get();
      if (!courseSnap.exists()) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }
      const course = courseSnap.data() as { title?: string; instructorId?: string; priceCents?: number; currency?: string };
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      const currency = (course.currency === 'EUR' || course.currency === 'MXN' || course.currency === 'USD' ? course.currency : 'DOP') as 'DOP' | 'USD' | 'EUR' | 'MXN';

      // Calcular descuento en servidor
      let discountCents = 0;
      let appliedCouponCode: string | undefined;
      let redemptionId: string | undefined;
      let discountSource: 'none' | 'coupon' | 'referral_welcome' = 'none';

      // Descuento bienvenida por referido (primera compra pagada, referido válido)
      let welcomeDiscountCents = 0;
      if (referralWelcome === true && originalAmountCents > 0) {
        const settingsSnap = await db.collection('settings').doc('referrals').get();
        const settings = settingsSnap.exists() ? (settingsSnap.data() as ReferralSettings) : null;
        if (settings?.active) {
          const userSnap = await db.collection('users').doc(auth.uid).get();
          const userData = userSnap.exists() ? (userSnap.data() as { referredBy?: string }) : {};
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
        if (!couponSnap.exists()) {
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

        await db.runTransaction(async (tx: any) => {
          const freshCouponSnap = await tx.get(couponRef);
          if (!freshCouponSnap.exists()) throw new Error('Cupón no encontrado.');
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
          const usedByUser = userRedemptionsSnap.docs.filter((d: any) => {
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
      const prefix = isFree
        ? 'free'
        : gateway === 'lemonsqueezy'
          ? 'ls'
          : gateway === 'stripe'
            ? 'pi'
            : gateway === 'mercadopago'
              ? 'mp'
              : 'pp';
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
      const db = serverDb;
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const couponSnap = await couponRef.get();

      if (!couponSnap.exists()) {
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

  // ─── ADMIN: Courses CRUD ──────────────────────────────────────────────────

  // GET /api/admin/courses — Listar todos los cursos (solo admin)
  app.get('/api/admin/courses', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection('courses').get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al listar cursos' });
    }
  });

  // PUT /api/admin/courses/:id — Actualizar o crear curso (upsert, solo admin)
  app.put('/api/admin/courses/:id', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: 'Se requiere el id del curso.' }); return; }
    try {
      await serverDb.collection('courses').doc(id).set({ ...req.body, id });
      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al actualizar curso' });
    }
  });

  // POST /api/admin/courses — Crear curso nuevo (solo admin)
  app.post('/api/admin/courses', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const data = req.body as Record<string, unknown>;
    const id = (data.id as string)?.trim();
    if (!id) { res.status(400).json({ error: 'El cuerpo debe incluir un campo "id".' }); return; }
    try {
      await serverDb.collection('courses').doc(id).set(data);
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al crear curso' });
    }
  });

  // DELETE /api/admin/courses/:id — Eliminar curso (solo admin)
  app.delete('/api/admin/courses/:id', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id } = req.params;
    try {
      await serverDb.collection('courses').doc(id).delete();
      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al eliminar curso' });
    }
  });

  // ─── ADMIN: proxy de tablas protegidas por RLS (gift cards) ──────────────
  // El cliente no puede leer gift_cards con la key anónima (sólo service_role
  // tiene política). Estas rutas usan el cliente de servicio del servidor.
  const ADMIN_PROXY_TABLES = new Set([
    'gift_cards', 'gift_card_redemptions', 'enrollments', 'payments', 'certificates', 'users_private',
  ]);
  const isAdminProxyTable = (table: string): boolean => ADMIN_PROXY_TABLES.has(table);

  app.get('/api/admin/:table', async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) { res.status(404).json({ error: 'Tabla no disponible' }); return; }
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection(req.params.table).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al listar' });
    }
  });

  app.get('/api/admin/:table/:id', async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) { res.status(404).json({ error: 'Tabla no disponible' }); return; }
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection(req.params.table).doc(req.params.id).get();
      if (!snap.exists()) { res.status(404).json({ error: 'No encontrado' }); return; }
      res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al leer' });
    }
  });

  app.put('/api/admin/:table/:id', async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) { res.status(404).json({ error: 'Tabla no disponible' }); return; }
    if (!await requireAdmin(req, res)) return;
    try {
      await serverDb.collection(req.params.table).doc(req.params.id).set({ ...req.body, id: req.params.id });
      res.json({ ok: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al guardar' });
    }
  });

  app.post('/api/admin/:table', async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) { res.status(404).json({ error: 'Tabla no disponible' }); return; }
    if (!await requireAdmin(req, res)) return;
    const id = String((req.body as { id?: unknown })?.id || '').trim();
    if (!id) { res.status(400).json({ error: 'Se requiere el campo "id".' }); return; }
    try {
      await serverDb.collection(req.params.table).doc(id).set(req.body);
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al crear' });
    }
  });

  app.delete('/api/admin/:table/:id', async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) { res.status(404).json({ error: 'Tabla no disponible' }); return; }
    if (!await requireAdmin(req, res)) return;
    try {
      await serverDb.collection(req.params.table).doc(req.params.id).delete();
      res.json({ ok: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al eliminar' });
    }
  });

  // Validación de gift card para estudiantes: sólo devuelve la tarjeta cuyo
  // código conoce el usuario autenticado; nunca expone un listado público.
  app.get('/api/gift-cards/:code', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{6,64}$/.test(code)) { res.status(400).json({ error: 'Código inválido' }); return; }
    try {
      const snap = await serverDb.collection('gift_cards').doc(code).get();
      if (!snap.exists()) { res.status(404).json({ error: 'Gift Card no encontrada' }); return; }
      res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al verificar' });
    }
  });

  // Canjes del estudiante autenticado (el frontend antes lo leía con key anónima).
  app.get('/api/gift-card-redemptions', async (req, res) => {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const snap = await serverDb.collection('gift_card_redemptions')
        .where('studentId', '==', auth.uid).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Error al listar canjes' });
    }
  });

  // GET /api/coupons — Listar todos los cupones (solo admin)
  app.get('/api/coupons', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db = serverDb;
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
      const db = serverDb;
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
      const db = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const snap = await couponRef.get();

      if (!snap.exists()) {
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
      const db = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db.collection('coupons').doc(normalizedCode);
      const snap = await couponRef.get();

      if (!snap.exists()) {
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
      const db = serverDb;
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
      const db = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const snap = await db.collection('couponRedemptions')
        .where('couponCode', '==', normalizedCode)
        .orderBy('createdAt', 'desc')
        .get();

      const redemptions = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as CouponRedemption);
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
      const db = serverDb;
      const snap = await db.collection('settings').doc('referrals').get();
      if (!snap.exists()) {
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
      const db = serverDb;
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
      const db = serverDb;
      const snap = await db.collection('referrals').orderBy('createdAt', 'desc').get();
      const referrals = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as Referral);
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
      const db = serverDb;
      const userId = auth.uid;

      const userSnap = await db.collection('users').doc(userId).get();
      const userData = userSnap.exists() ? (userSnap.data() as { referralCode?: string; referredBy?: string }) : {};
      const referralCode = userData.referralCode;

      // Mis referidos como referidor
      const referralsSnap = await db.collection('referrals')
        .where('referrerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      const myReferrals = referralsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as Referral);

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
      const db = serverDb;
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
      const db = serverDb;
      const settingsSnap = await db.collection('settings').doc('referrals').get();
      const settings = settingsSnap.exists() ? (settingsSnap.data() as ReferralSettings) : {
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

  // Documentos legales: se sirven antes de Vite (dev) y de express.static (producción)
  // con charset UTF-8 explícito para evitar mojibake en el navegador.
  const legalDocsDir = path.resolve(__dirname, 'public', 'legal');
  app.get(/^\/legal\/([A-Za-z0-9_-]+\.md)$/, (req, res, next) => {
    const fileName = String(req.params[0] || '');
    if (!getLegalDocumentByFile(fileName)) {
      next();
      return;
    }
    fs.readFile(path.join(legalDocsDir, fileName), (err, data) => {
      if (err) {
        next();
        return;
      }
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(data);
    });
  });

  const server = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
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
          return;
        }

        if (msg.type === 'GIFT_CARD_REDEEMED') {
          const eventPayload = {
            type: 'GIFT_CARD_REDEEMED',
            cardCode: typeof msg.cardCode === 'string' ? msg.cardCode.slice(0, 64) : '',
            courseId: typeof msg.courseId === 'string' ? msg.courseId.slice(0, 128) : '',
            courseTitle: typeof msg.courseTitle === 'string' ? msg.courseTitle.slice(0, 140) : '',
            instructorId: typeof msg.instructorId === 'string' ? msg.instructorId.slice(0, 128) : '',
            amountAppliedCents: typeof msg.amountAppliedCents === 'number' ? msg.amountAppliedCents : 0,
            currency: typeof msg.currency === 'string' ? msg.currency.slice(0, 8) : 'DOP',
            senderUid: currentClient.uid,
          };
          broadcastEvent({ ...eventPayload, scope: 'user' }, currentClient.uid);
          if (eventPayload.instructorId && eventPayload.instructorId !== currentClient.uid) {
            broadcastEvent({ ...eventPayload, scope: 'user' }, eventPayload.instructorId);
          }
          for (const client of clients) {
            if (
              client.ws.readyState === WebSocket.OPEN &&
              client.role === 'instructor' &&
              client.uid !== currentClient.uid &&
              client.uid !== eventPayload.instructorId
            ) {
              client.ws.send(JSON.stringify({ ...eventPayload, serverTimestamp: new Date().toISOString() }));
            }
          }
          if (eventPayload.instructorId) {
            void dispatchWebhooks(eventPayload.instructorId, 'gift_card.redeemed', eventPayload);
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
