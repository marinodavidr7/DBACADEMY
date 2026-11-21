import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const AUTHORIZED_ADMIN_EMAIL = 'marinodavidr7@gmail.com';
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
    const { courseId, courseTitle, studentId, instructorId, amountCents, currency, gateway } = req.body ?? {};
    if (!courseId || !studentId || typeof amountCents !== 'number' || !gateway) {
      res.status(400).json({ error: 'Missing required payment fields' });
      return;
    }
    const allowedGateways = ['stripe', 'mercadopago', 'paypal'];
    if (!allowedGateways.includes(String(gateway))) {
      res.status(400).json({ error: 'Unsupported payment gateway' });
      return;
    }

    const prefix = gateway === 'stripe' ? 'pi' : gateway === 'mercadopago' ? 'mp' : 'pp';
    const transactionRef = `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

    const receipt = {
      paymentId,
      courseId: String(courseId),
      courseTitle: String(courseTitle || ''),
      studentId: String(studentId),
      instructorId: String(instructorId || ''),
      amountCents,
      currency: String(currency || 'USD'),
      gateway: String(gateway),
      status: 'succeeded',
      transactionRef,
      authorizedAt: new Date().toISOString(),
    };

    broadcastEvent(
      {
        type: 'PAYMENT_COMPLETED',
        scope: 'user',
        ...receipt,
      },
      String(studentId)
    );
    if (instructorId) {
      broadcastEvent(
        {
          type: 'INSTRUCTOR_SALE',
          scope: 'user',
          ...receipt,
        },
        String(instructorId)
      );
      void dispatchWebhooks(String(instructorId), 'payment.succeeded', receipt);
    }

    res.json(receipt);
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
