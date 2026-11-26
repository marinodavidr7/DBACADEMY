// server.ts
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";
import { WebSocket, WebSocketServer } from "ws";

// src/lib/supabase/serverClient.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "river-pipe-m6tvw",
  appId: "1:103296721510:web:bf528f9d5f2f210585c3a7",
  apiKey: "AIzaSyDKZakPPo5rVbjz5OUblwqTx-hlzgGa2ug",
  authDomain: "river-pipe-m6tvw.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-53dee1f7-6e52-4d31-96d4-504a084c64e0",
  storageBucket: "river-pipe-m6tvw.firebasestorage.app",
  messagingSenderId: "103296721510",
  measurementId: "",
  oAuthClientId: "103296721510-tln06afa1aer16i1pjs0ksljp36va393.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/firebase.ts
var app = initializeApp(firebase_applet_config_default);
function initDb() {
  const settings = {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  };
  try {
    return initializeFirestore(app, settings, firebase_applet_config_default.firestoreDatabaseId);
  } catch {
    return getFirestore(app, firebase_applet_config_default.firestoreDatabaseId);
  }
}
var db = initDb();
var auth = getAuth(app);
var googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
var storage = getStorage(app);
var FIREBASE_PROJECT_ID = firebase_applet_config_default.projectId;
var FIREBASE_AUTH_SETTINGS_URL = `https://console.firebase.google.com/project/${firebase_applet_config_default.projectId}/authentication/settings`;
async function testConnection() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
      return false;
    }
    return true;
  }
}
void testConnection();

// src/lib/supabase/firestoreAdapter.ts
function pkFor(table) {
  if (table === "users" || table === "users_private") return "uid";
  if (table === "settings") return "key";
  return "id";
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function cleanWriteValue(v) {
  if (v && typeof v === "object" && v.__serverTimestamp === true) return nowIso();
  if (Array.isArray(v)) return v.map(cleanWriteValue);
  if (v && typeof v === "object" && !(v instanceof Date) && !(v instanceof Uint8Array)) {
    const out = {};
    for (const k of Object.keys(v)) out[k] = cleanWriteValue(v[k]);
    return out;
  }
  return v;
}
function cleanWrite(data) {
  const out = {};
  for (const k of Object.keys(data ?? {})) {
    const key = toSnake(k);
    out[key === "id" ? "id" : key] = cleanWriteValue(data[k]);
  }
  return out;
}
function toSnake(key) {
  if (!/[A-Z]/.test(key)) return key;
  return key.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
}
function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function rowToSnapshot(row, table = "unknown_table") {
  const pk = pkFor(table);
  const rowId = row ? String(row[pk] ?? row.id ?? "") : "";
  const out = {};
  if (row) {
    for (const key of Object.keys(row)) {
      out[snakeToCamel(key)] = row[key];
    }
    out.id = rowId;
    if (pk !== "id") out[snakeToCamel(pk)] = rowId;
  }
  return {
    id: rowId,
    data: () => out,
    exists: () => Boolean(row),
    ref: { id: rowId, _table: table }
  };
}

// src/lib/supabase/serverClient.ts
var client = null;
function getSupabaseServerEnv() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || "";
  const key = process.env.SUPABASE_SERVICE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || "";
  return { url, key };
}
function isSupabaseAdminConfigured() {
  const { url, key } = getSupabaseServerEnv();
  return Boolean(url && key);
}
function getSupabaseServiceClient() {
  const { url, key } = getSupabaseServerEnv();
  if (!url || !key) {
    throw new Error(
      "DBACADEMY server: falta SUPABASE_URL o una clave de servicio (SUPABASE_SERVICE_KEY o SUPABASE_SECRET_KEY). Env, sin imprimir valores."
    );
  }
  if (!client) {
    client = createClient2(url, key, { auth: { autoRefreshToken: false } });
  }
  return client;
}
function applyFilter(q, f) {
  const col = toSnake(f[0]);
  switch (f[1]) {
    case "==":
      return q.eq(col, f[2]);
    case "!=":
      return q.neq(col, f[2]);
    case ">":
      return q.gt(col, f[2]);
    case "<":
      return q.lt(col, f[2]);
    case ">=":
      return q.gte(col, f[2]);
    case "<=":
      return q.lte(col, f[2]);
    case "in":
      return q.in(col, f[2]);
    default:
      throw new Error(`serverClient: operador '${f[1]}' no soportado`);
  }
}
function queryRows(table, opts = {}) {
  let q = getSupabaseServiceClient().from(table).select("*");
  for (const f of opts.where ?? []) q = applyFilter(q, f);
  for (const o of opts.orderBy ?? []) q = q.order(toSnake(o.col), { ascending: o.dir === "asc" });
  if (opts.limitN) q = q.limit(opts.limitN);
  return q.then((res) => {
    if (res.error) throw new Error(`Supabase server ${table}.select: ${res.error.message}`);
    return res.data ?? [];
  });
}
function serverDocGet(table, id) {
  return queryRows(table, { where: [["id", "==", id]], limitN: 1 }).then((rows) => rowToSnapshot(rows[0] ?? null, table));
}
async function serverDocSet(table, id, data) {
  const payload = cleanWrite(data);
  payload.id = id;
  const { error } = await getSupabaseServiceClient().from(table).upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`Supabase server ${table}.set(${id}): ${error.message}`);
}
async function serverDocUpdate(table, id, data) {
  const { error } = await getSupabaseServiceClient().from(table).update(cleanWrite(data)).eq("id", id).select("id");
  if (error) throw new Error(`Supabase server ${table}.update(${id}): ${error.message}`);
}
async function serverDocDelete(table, id) {
  const { error } = await getSupabaseServiceClient().from(table).delete().eq("id", id);
  if (error) throw new Error(`Supabase server ${table}.delete(${id}): ${error.message}`);
}
function makeCollection(table, opts = {}) {
  return {
    doc(id) {
      return {
        id,
        get: () => serverDocGet(table, id),
        set: (data, _options) => serverDocSet(table, id, data),
        update: (data) => serverDocUpdate(table, id, data),
        delete: () => serverDocDelete(table, id)
      };
    },
    where(col, op, val) {
      return makeCollection(table, { ...opts, where: [...opts.where ?? [], [col, op, val]] });
    },
    orderBy(col, dir = "asc") {
      return makeCollection(table, { ...opts, orderBy: [...opts.orderBy ?? [], { col, dir }] });
    },
    limit(n) {
      return makeCollection(table, { ...opts, limitN: n });
    },
    async get() {
      const rows = await queryRows(table, opts);
      const docs = rows.map((r) => rowToSnapshot(r, table));
      return { docs, empty: docs.length === 0 };
    }
  };
}
async function runTransaction(fn, _tx) {
  const tx = {
    get: (ref) => serverDocGet(ref._table, ref.id),
    set: (ref, data) => serverDocSet(ref._table, ref.id, data),
    update: (ref, data) => serverDocUpdate(ref._table, ref.id, data),
    delete: (ref) => serverDocDelete(ref._table, ref.id)
  };
  return fn(tx);
}
function serverBatch() {
  const ops = [];
  return {
    update(ref, data) {
      ops.push({ type: "update", ref, data: cleanWrite(data) });
      return this;
    },
    delete(ref) {
      ops.push({ type: "delete", ref });
      return this;
    },
    async commit() {
      for (const op of ops) {
        if (op.type === "delete") await serverDocDelete(op.ref._table, op.ref.id);
        else if (op.type === "set") await serverDocSet(op.ref._table, op.ref.id, op.data);
        else await serverDocUpdate(op.ref._table, op.ref.id, op.data);
      }
    }
  };
}
var serverDb = {
  collection(table) {
    return makeCollection(table);
  },
  runTransaction,
  batch: () => serverBatch()
};

// src/services/legalDocuments.ts
var LEGAL_DOCUMENTS = [
  {
    slug: "terminos",
    file: "TERMINOS-Y-CONDICIONES.md",
    title: "T\xE9rminos y Condiciones de Uso",
    version: "v1.2-2026",
    lawRef: "Ley 358-05 \xB7 Ley 126-02 \xB7 Ley 172-13",
    description: "Contrato de adhesi\xF3n, pagos, propiedad intelectual y jurisdicci\xF3n en RD."
  },
  {
    slug: "privacidad",
    file: "POLITICA-DE-PRIVACIDAD.md",
    title: "Pol\xEDtica de Privacidad",
    version: "v1.2-2026",
    lawRef: "Constituci\xF3n art. 44 \xB7 Ley 172-13",
    description: "Datos tratados, finalidades, transferencias, conservaci\xF3n y derechos ARCO."
  },
  {
    slug: "cookies",
    file: "POLITICA-DE-COOKIES.md",
    title: "Pol\xEDtica de Cookies",
    version: "v1.1-2026",
    lawRef: "Ley 172-13 \xB7 Ley 53-07 \xB7 Ley 310-14",
    description: "Categor\xEDas de cookies, consentimiento previo, revocaci\xF3n y recursos de terceros."
  },
  {
    slug: "reembolsos",
    file: "POLITICA-CANCELACION-REEMBOLSOS.md",
    title: "Cancelaci\xF3n y Reembolsos",
    version: "v1.1-2026",
    lawRef: "Ley 358-05",
    description: "Garant\xEDa de satisfacci\xF3n, exclusiones y plazos de acreditaci\xF3n."
  },
  {
    slug: "uso-aceptable",
    file: "POLITICA-USO-ACEPTABLE.md",
    title: "Uso Aceptable y Retiro de Contenido",
    version: "v1.0-2026",
    lawRef: "Ley 65-00 \xB7 Ley 20-00 \xB7 Ley 53-07",
    description: "Conducta en foros/tareas y procedimiento de notificaci\xF3n y retiro."
  },
  {
    slug: "dpa",
    file: "ACUERDO-ENCARGADO-TRATAMIENTO.md",
    title: "Acuerdo de Encargado de Tratamiento (DPA)",
    version: "v1.0-2026",
    lawRef: "Ley 172-13 \xB7 Ley 126-02",
    description: "Anexo B2B de instrucciones, subencargados, seguridad y transferencias."
  },
  {
    slug: "auditoria",
    file: "INFORME-AUDITORIA.md",
    title: "Informe de Auditor\xEDa Legal-T\xE9cnica",
    version: "25-nov-2026",
    lawRef: "Auditor\xEDa interna",
    description: "Hallazgos, matriz de riesgos y puntos de revisi\xF3n profesional."
  }
];
var getLegalDocumentByFile = (file) => LEGAL_DOCUMENTS.find((doc2) => doc2.file.toLowerCase() === String(file || "").toLowerCase());

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.local"), override: true });
var supabaseAdminConfigured = isSupabaseAdminConfigured();
if (!supabaseAdminConfigured) {
  console.warn(
    "[server] Falta SUPABASE_URL o la clave de servicio (SUPABASE_SERVICE_KEY / SUPABASE_SECRET_KEY): las escrituras de administrador fallar\xE1n."
  );
}
var PORT = Number(process.env.PORT || 3e3);
var isProduction = process.env.NODE_ENV === "production";
var AUTHORIZED_ADMIN_EMAIL = "marinodavidr7@gmail.com";
var SERVER_IDLE_TIMEOUT_MS = 15 * 60 * 1e3;
var sessionActivity = /* @__PURE__ */ new Map();
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(identifier, maxRequests, windowMs) {
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
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
  for (const [uid, session] of sessionActivity.entries()) {
    if (now - session.lastSeen > 24 * 60 * 60 * 1e3) sessionActivity.delete(uid);
  }
}, 6e4);
var FIREBASE_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
function loadFirebaseConfig() {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, "firebase-applet-config.json"), "utf8");
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.projectId || process.env.FIREBASE_PROJECT_ID || "river-pipe-m6tvw",
      firestoreDatabaseId: parsed.firestoreDatabaseId || "(default)",
      apiKey: parsed.apiKey || ""
    };
  } catch {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || "river-pipe-m6tvw",
      firestoreDatabaseId: "(default)",
      apiKey: ""
    };
  }
}
var FIREBASE_APP_CONFIG = loadFirebaseConfig();
var FIREBASE_PROJECT_ID2 = FIREBASE_APP_CONFIG.projectId;
var cachedGoogleCerts = {
  certs: {},
  expiresAt: 0
};
async function getGooglePublicCerts(forceRefresh = false) {
  if (!forceRefresh && Date.now() < cachedGoogleCerts.expiresAt && Object.keys(cachedGoogleCerts.certs).length > 0) {
    return cachedGoogleCerts.certs;
  }
  const resp = await fetch(FIREBASE_CERT_URL);
  if (!resp.ok) {
    throw new Error("Unable to fetch Firebase public verification certificates");
  }
  const cacheControl = resp.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const certs = await resp.json();
  cachedGoogleCerts = {
    certs,
    expiresAt: Date.now() + Math.max(60, maxAgeSec) * 1e3
  };
  return certs;
}
var AuthValidationError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
async function verifyFirebaseAdminBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthValidationError(401, "Token de autenticaci\xF3n requerido.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AuthValidationError(401, "Formato de token inv\xE1lido.");
  }
  const [headerB64, payloadB64, sigB64] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    throw new AuthValidationError(401, "Token JWT malformado.");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new AuthValidationError(401, "Algoritmo o identificador de clave no v\xE1lido.");
  }
  let certs = await getGooglePublicCerts(false);
  let cert = certs[header.kid];
  if (!cert) {
    certs = await getGooglePublicCerts(true);
    cert = certs[header.kid];
  }
  if (!cert) {
    throw new AuthValidationError(401, "Certificado de firma no reconocido.");
  }
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const isSignatureValid = verifier.verify(cert, Buffer.from(sigB64, "base64url"));
  if (!isSignatureValid) {
    throw new AuthValidationError(401, "Firma del token de Firebase inv\xE1lida.");
  }
  const nowSec = Math.floor(Date.now() / 1e3);
  if (payload.aud !== FIREBASE_PROJECT_ID2 || payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID2}` || typeof payload.sub !== "string" || payload.sub.length === 0 || typeof payload.exp !== "number" || payload.exp <= nowSec || typeof payload.iat !== "number" || payload.iat > nowSec + 60) {
    throw new AuthValidationError(401, "Token expirado o emitido para otro proyecto.");
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (payload.email_verified !== true || email !== AUTHORIZED_ADMIN_EMAIL) {
    throw new AuthValidationError(
      403,
      "Permiso denegado: solo Marinodavidr7@gmail.com tiene permisos de escritura."
    );
  }
  return { uid: payload.sub, email };
}
async function verifyFirebaseTokenAny(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthValidationError(401, "Token de autenticaci\xF3n requerido.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) throw new AuthValidationError(401, "Formato de token inv\xE1lido.");
  const [headerB64, payloadB64, sigB64] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    throw new AuthValidationError(401, "Token JWT malformado.");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new AuthValidationError(401, "Algoritmo o identificador de clave no v\xE1lido.");
  }
  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) throw new AuthValidationError(401, "Certificado de firma no reconocido.");
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  if (!verifier.verify(certPem, Buffer.from(sigB64, "base64url"))) {
    throw new AuthValidationError(401, "Firma del token de Firebase inv\xE1lida.");
  }
  const nowSec = Math.floor(Date.now() / 1e3);
  if (payload.aud !== FIREBASE_PROJECT_ID2 || payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID2}` || typeof payload.sub !== "string" || payload.sub.length === 0 || typeof payload.exp !== "number" || payload.exp <= nowSec || typeof payload.iat !== "number" || payload.iat > nowSec + 60) {
    throw new AuthValidationError(401, "Token expirado o emitido para otro proyecto.");
  }
  const nowMs = Date.now();
  const tokenIat = payload.iat;
  const session = sessionActivity.get(payload.sub);
  if (!session || tokenIat > session.tokenIat) {
    sessionActivity.set(payload.sub, { tokenIat, lastSeen: nowMs });
  } else {
    if (nowMs - session.lastSeen > SERVER_IDLE_TIMEOUT_MS) {
      throw new AuthValidationError(401, "Sesi\xF3n expirada por inactividad. Inicia sesi\xF3n nuevamente.");
    }
    session.lastSeen = nowMs;
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
  return { uid: payload.sub, email, emailVerified: payload.email_verified === true };
}
async function requireAdmin(req, res) {
  try {
    const auth2 = await verifyFirebaseTokenAny(req.headers.authorization);
    if (auth2.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Admin access required" });
      return false;
    }
    return true;
  } catch (err) {
    const status = err instanceof AuthValidationError ? err.status : 401;
    res.status(status).json({ error: err instanceof Error ? err.message : "Invalid token" });
    return false;
  }
}
async function requireAuth(req, res) {
  try {
    const auth2 = await verifyFirebaseTokenAny(req.headers.authorization);
    return { uid: auth2.uid, email: auth2.email };
  } catch (err) {
    const status = err instanceof AuthValidationError ? err.status : 401;
    res.status(status).json({ error: err instanceof Error ? err.message : "Invalid token" });
    return null;
  }
}
var clients = /* @__PURE__ */ new Set();
var registeredKeys = /* @__PURE__ */ new Map();
var cloudBackups = /* @__PURE__ */ new Map();
var recentWebhooks = [];
function getUserDeviceCount(uid) {
  const uniqueDevices = /* @__PURE__ */ new Set();
  for (const client2 of clients) {
    if (client2.uid === uid && client2.ws.readyState === WebSocket.OPEN) {
      uniqueDevices.add(client2.deviceId);
    }
  }
  return uniqueDevices.size;
}
function broadcastPresence(uid) {
  const deviceCount = getUserDeviceCount(uid);
  const devices = [];
  const seen = /* @__PURE__ */ new Set();
  for (const client2 of clients) {
    if (client2.uid === uid && client2.ws.readyState === WebSocket.OPEN && !seen.has(client2.deviceId)) {
      seen.add(client2.deviceId);
      devices.push({
        deviceId: client2.deviceId,
        deviceLabel: client2.deviceLabel,
        connectedAt: client2.connectedAt
      });
    }
  }
  const payload = JSON.stringify({
    type: "PRESENCE_SYNC",
    uid,
    deviceCount,
    devices,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  for (const client2 of clients) {
    if (client2.uid === uid && client2.ws.readyState === WebSocket.OPEN) {
      client2.ws.send(payload);
    }
  }
}
function broadcastEvent(message, targetUid) {
  const encoded = JSON.stringify({
    ...message,
    serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  for (const client2 of clients) {
    if (client2.ws.readyState !== WebSocket.OPEN) continue;
    if (!targetUid || client2.uid === targetUid || message.scope === "global") {
      client2.ws.send(encoded);
    }
  }
}
async function dispatchWebhooks(ownerId, event, data) {
  for (const key of registeredKeys.values()) {
    if (key.ownerId === ownerId && key.webhookUrl) {
      const body = JSON.stringify({
        event,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data
      });
      const signature = crypto.createHmac("sha256", key.keyHash).update(body).digest("hex");
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e3);
        const resp = await fetch(key.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Catedra-Event": event,
            "X-Catedra-Signature": `sha256=${signature}`
          },
          body,
          signal: controller.signal
        });
        clearTimeout(timeout);
        recentWebhooks.unshift({
          id: crypto.randomUUID(),
          event,
          targetUrl: key.webhookUrl,
          status: resp.status,
          dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch {
        recentWebhooks.unshift({
          id: crypto.randomUUID(),
          event,
          targetUrl: key.webhookUrl,
          status: 0,
          dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (recentWebhooks.length > 25) recentWebhooks.pop();
    }
  }
}
var pendingLemonCheckouts = /* @__PURE__ */ new Map();
var verifiedLemonOrders = /* @__PURE__ */ new Map();
async function readFirestoreDoc(collectionName, docId, _bearerHeader) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(docId)) {
    return null;
  }
  const snap = await serverDb.collection(collectionName).doc(docId).get();
  return snap.exists() ? snap.data() : null;
}
function getLemonSqueezyConfig() {
  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || "").trim();
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || "").trim();
  const defaultVariantId = (process.env.LEMONSQUEEZY_DEFAULT_VARIANT_ID || "").trim();
  const webhookSecret = (process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "").trim();
  const testMode = process.env.LEMONSQUEEZY_TEST_MODE === "true";
  const storeCurrency = (process.env.LEMONSQUEEZY_STORE_CURRENCY || "USD").trim().toUpperCase();
  const dopPerUsd = Math.max(1, Number(process.env.LEMONSQUEEZY_DOP_PER_USD || 60));
  const mxnPerUsd = Math.max(1, Number(process.env.LEMONSQUEEZY_MXN_PER_USD || 18));
  let variantMap = {};
  const rawMap = (process.env.LEMONSQUEEZY_VARIANT_MAP || "").trim();
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string" || typeof v === "number") {
          variantMap[k] = String(v).trim();
        }
      }
    } catch {
    }
  }
  const missingKeys = [];
  if (!apiKey) missingKeys.push("LEMONSQUEEZY_API_KEY");
  if (!storeId) missingKeys.push("LEMONSQUEEZY_STORE_ID");
  if (!defaultVariantId && Object.keys(variantMap).length === 0) {
    missingKeys.push("LEMONSQUEEZY_DEFAULT_VARIANT_ID");
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
    missingKeys
  };
}
function resolveAppBaseUrl(req) {
  const configured = (process.env.APP_URL || "").trim();
  if (configured && configured !== "MY_APP_URL") {
    try {
      const u = new URL(configured);
      if (u.protocol === "https:" || u.protocol === "http:") {
        return u.origin;
      }
    } catch {
    }
  }
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = typeof protoHeader === "string" ? protoHeader.split(",")[0].trim() : req.protocol || "http";
  const host = req.get("host") || `localhost:${PORT}`;
  return `${proto === "https" ? "https" : "http"}://${host}`;
}
function convertCourseCentsToStoreCents(amountCents, courseCurrency, config) {
  if (amountCents <= 0) return 0;
  if (courseCurrency === config.storeCurrency) {
    return Math.max(50, Math.round(amountCents));
  }
  if (config.storeCurrency === "USD") {
    if (courseCurrency === "DOP") {
      return Math.max(50, Math.round(amountCents / config.dopPerUsd));
    }
    if (courseCurrency === "MXN") {
      return Math.max(50, Math.round(amountCents / config.mxnPerUsd));
    }
  }
  return Math.max(50, Math.round(amountCents));
}
function createApp() {
  const app3 = express();
  app3.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app3.get("/api/v1/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "catedra-lms-api",
      version: "1.0.0",
      connectedSockets: clients.size,
      // Booleano: permite a QA verificar la inyección de ENV sin exponer secretos.
      supabaseAdminConfigured,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app3.get("/api/v1/openapi.json", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({
      openapi: "3.0.3",
      info: {
        title: "C\xE1tedra Virtual Learning API",
        version: "1.0.0",
        description: "REST API for course sync, real-time progress webhooks, Lemon Squeezy & multi-gateway payment verification, and certificate validation."
      },
      servers: [{ url: `${baseUrl}/api/v1` }],
      paths: {
        "/health": { get: { summary: "API and WebSocket Gateway Health" } },
        "/payments/checkout": { post: { summary: "Authorize Lemon Squeezy, Stripe, Mercado Pago, or PayPal course purchase" } },
        "/payments/lemonsqueezy/status": { get: { summary: "Inspect Lemon Squeezy server configuration status" } },
        "/payments/lemonsqueezy/checkout": { post: { summary: "Create hosted Lemon Squeezy checkout session (app.lemonsqueezy.com)" } },
        "/payments/lemonsqueezy/webhook": { post: { summary: "Receive HMAC-SHA256 signed Lemon Squeezy order webhooks" } },
        "/payments/lemonsqueezy/verify": { get: { summary: "Verify Lemon Squeezy order completion for authenticated student" } },
        "/payments/stripe/status": { get: { summary: "Inspect Stripe server configuration status" } },
        "/payments/stripe/checkout": { post: { summary: "Create hosted Stripe Checkout session in DOP with Invoicing & Tax" } },
        "/payments/stripe/webhook": { post: { summary: "Receive signed Stripe Checkout webhooks" } },
        "/payments/stripe/verify": { get: { summary: "Verify Stripe Checkout session completion for authenticated student" } },
        "/webhooks/register": { post: { summary: "Register API key hash and webhook endpoint" } },
        "/webhooks/test": { post: { summary: "Dispatch signed HMAC-SHA256 webhook event" } },
        "/cloud-storage/sync": { post: { summary: "Upload client-encrypted E2EE backup manifest" } }
      }
    });
  });
  app3.get("/api/v1/payments/lemonsqueezy/status", (_req, res) => {
    const cfg = getLemonSqueezyConfig();
    res.json({
      configured: cfg.configured,
      webhookConfigured: cfg.webhookConfigured,
      testMode: cfg.testMode,
      providerUrl: "https://app.lemonsqueezy.com",
      storeCurrency: cfg.storeCurrency,
      missingKeys: cfg.missingKeys
    });
  });
  app3.post("/api/v1/payments/lemonsqueezy/checkout", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const { courseId, couponCode, giftCardCode, customerName } = req.body ?? {};
    const safeCourseId = typeof courseId === "string" ? courseId.trim() : "";
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(safeCourseId)) {
      res.status(400).json({ error: "Identificador de curso inv\xE1lido." });
      return;
    }
    try {
      const course = await readFirestoreDoc("courses", safeCourseId, req.headers.authorization);
      if (!course) {
        res.status(404).json({ error: "Curso no encontrado en Firestore." });
        return;
      }
      const courseTitle = String(course.title || "Curso DB Academy").slice(0, 140);
      const instructorId = String(course.instructorId || "");
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      const rawCurr = String(course.currency || "DOP");
      const currency = rawCurr === "EUR" || rawCurr === "MXN" || rawCurr === "USD" ? rawCurr : "DOP";
      let discountCents = 0;
      let discountSource = "none";
      let appliedCouponCode;
      let appliedGiftCardCode;
      const normalizedGiftCard = typeof giftCardCode === "string" && giftCardCode.trim() ? normalizeCode(giftCardCode) : "";
      const normalizedCoupon = typeof couponCode === "string" && couponCode.trim() ? normalizeCode(couponCode) : "";
      if (normalizedGiftCard && originalAmountCents > 0) {
        if (!/^[A-Z0-9_-]{6,64}$/.test(normalizedGiftCard)) {
          res.status(400).json({ error: "Formato de Gift Card inv\xE1lido." });
          return;
        }
        const card = await readFirestoreDoc("giftCards", normalizedGiftCard, req.headers.authorization);
        if (!card || card.active !== true || card.status !== "active") {
          res.status(400).json({ error: "La Gift Card no est\xE1 activa o no existe." });
          return;
        }
        if (card.courseId && String(card.courseId) !== safeCourseId) {
          res.status(400).json({ error: "Esta Gift Card no aplica a este curso." });
          return;
        }
        if (String(card.currency) !== currency) {
          res.status(400).json({ error: "La moneda de la Gift Card no coincide con el curso." });
          return;
        }
        const remaining = Math.max(0, Math.round(Number(card.remainingAmountCents ?? 0)));
        if (remaining <= 0) {
          res.status(400).json({ error: "La Gift Card no tiene saldo disponible." });
          return;
        }
        discountCents = Math.min(originalAmountCents, remaining);
        discountSource = "gift_card";
        appliedGiftCardCode = normalizedGiftCard;
      } else if (normalizedCoupon && originalAmountCents > 0) {
        if (!/^[A-Z0-9_-]{3,64}$/.test(normalizedCoupon)) {
          res.status(400).json({ error: "Formato de cup\xF3n inv\xE1lido." });
          return;
        }
        const couponDoc = await readFirestoreDoc("coupons", normalizedCoupon, req.headers.authorization);
        if (!couponDoc) {
          res.status(400).json({ error: "C\xF3digo de cup\xF3n no encontrado." });
          return;
        }
        const coupon = couponDoc;
        if (!isCouponActive(coupon)) {
          res.status(400).json({ error: "El cup\xF3n no est\xE1 activo, expir\xF3 o agot\xF3 sus usos." });
          return;
        }
        if (coupon.appliesTo === "courses" && !coupon.courseIds?.includes(safeCourseId)) {
          res.status(400).json({ error: "Este cup\xF3n no aplica a este curso." });
          return;
        }
        if (coupon.minPurchaseCents && originalAmountCents < coupon.minPurchaseCents) {
          res.status(400).json({ error: "El monto del curso no alcanza el m\xEDnimo requerido por el cup\xF3n." });
          return;
        }
        discountCents = calculateDiscount(coupon, originalAmountCents).discountCents;
        discountSource = "coupon";
        appliedCouponCode = normalizedCoupon;
      }
      const finalAmountCents = Math.max(0, originalAmountCents - discountCents);
      const paymentId = `pay_ls_${crypto.randomBytes(8).toString("hex")}`;
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
          giftCardCode: appliedGiftCardCode
        });
        return;
      }
      const lsConfig = getLemonSqueezyConfig();
      const resolvedVariantId = lsConfig.variantMap[safeCourseId] || lsConfig.defaultVariantId;
      if (!lsConfig.apiKey || !lsConfig.storeId || !resolvedVariantId) {
        res.status(503).json({
          code: "LEMONSQUEEZY_NOT_CONFIGURED",
          error: "Falta configurar las credenciales de Lemon Squeezy en Secrets del servidor (LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID y LEMONSQUEEZY_DEFAULT_VARIANT_ID).",
          missingKeys: lsConfig.missingKeys
        });
        return;
      }
      const appBaseUrl = resolveAppBaseUrl(req);
      const redirectUrl = `${appBaseUrl}/?ls_checkout=success&course_id=${encodeURIComponent(safeCourseId)}&payment_id=${encodeURIComponent(paymentId)}`;
      const chargedCents = convertCourseCentsToStoreCents(finalAmountCents, currency, lsConfig);
      const checkoutPayload = {
        data: {
          type: "checkouts",
          attributes: {
            custom_price: chargedCents,
            product_options: {
              name: courseTitle,
              description: `Acceso completo en DB Academy \xB7 ${currency} ${(finalAmountCents / 100).toFixed(2)}`,
              redirect_url: redirectUrl,
              receipt_button_text: "Volver al curso en DB Academy",
              receipt_link_url: redirectUrl
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true
            },
            checkout_data: {
              ...auth2.email ? { email: auth2.email } : {},
              ...typeof customerName === "string" && customerName.trim() ? { name: customerName.trim().slice(0, 100) } : {},
              custom: {
                payment_id: paymentId,
                course_id: safeCourseId,
                user_id: auth2.uid,
                coupon_code: appliedCouponCode || "",
                gift_card_code: appliedGiftCardCode || ""
              }
            },
            test_mode: lsConfig.testMode
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: lsConfig.storeId
              }
            },
            variant: {
              data: {
                type: "variants",
                id: resolvedVariantId
              }
            }
          }
        }
      };
      const lsResp = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lsConfig.apiKey}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify(checkoutPayload)
      });
      const lsBody = await lsResp.json().catch(() => ({}));
      const checkoutUrl = lsBody.data?.attributes?.url;
      const checkoutId = lsBody.data?.id;
      if (!lsResp.ok || !checkoutUrl || !checkoutId) {
        const detail = lsBody.errors?.map((e) => e.detail || e.title).filter(Boolean).join("; ") || `HTTP ${lsResp.status}`;
        res.status(502).json({
          error: `Lemon Squeezy rechaz\xF3 la creaci\xF3n del checkout: ${detail}`
        });
        return;
      }
      pendingLemonCheckouts.set(paymentId, {
        paymentId,
        checkoutId,
        courseId: safeCourseId,
        courseTitle,
        userId: auth2.uid,
        userEmail: auth2.email,
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
        createdAtMs: Date.now()
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
        testMode: lsConfig.testMode
      });
    } catch (err) {
      console.error("Lemon Squeezy checkout error:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Error creando el checkout en Lemon Squeezy."
      });
    }
  });
  app3.post("/api/v1/payments/lemonsqueezy/webhook", (req, res) => {
    const lsConfig = getLemonSqueezyConfig();
    if (!lsConfig.webhookSecret) {
      res.status(503).json({ error: "LEMONSQUEEZY_WEBHOOK_SECRET not configured" });
      return;
    }
    const signatureHeader = req.headers["x-signature"];
    const signatureHex = typeof signatureHeader === "string" ? signatureHeader.trim() : "";
    const rawBody = req.rawBody;
    if (!signatureHex || !rawBody || rawBody.length === 0) {
      res.status(401).json({ error: "Missing webhook signature or payload" });
      return;
    }
    const expectedHex = crypto.createHmac("sha256", lsConfig.webhookSecret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signatureHex, "utf8");
    const expBuf = Buffer.from(expectedHex, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      res.status(401).json({ error: "Invalid Lemon Squeezy webhook signature" });
      return;
    }
    const payload = req.body ?? {};
    const eventName = payload.meta?.event_name || "";
    const customData = payload.meta?.custom_data || {};
    const paymentId = typeof customData.payment_id === "string" ? customData.payment_id : "";
    const courseId = typeof customData.course_id === "string" ? customData.course_id : "";
    const userId = typeof customData.user_id === "string" ? customData.user_id : "";
    const orderId = String(payload.data?.id || "");
    const attrs = payload.data?.attributes || {};
    if (paymentId && (eventName === "order_created" || eventName === "order_refunded")) {
      const orderStatus = eventName === "order_refunded" || attrs.status === "refunded" ? "refunded" : "paid";
      if (orderStatus === "paid" && attrs.status && attrs.status !== "paid") {
        res.json({ received: true, ignoredStatus: attrs.status });
        return;
      }
      const verifiedRecord = {
        paymentId,
        orderId,
        orderNumber: String(attrs.order_number || orderId),
        identifier: String(attrs.identifier || orderId),
        courseId,
        userId,
        status: orderStatus,
        receiptUrl: attrs.urls?.receipt,
        totalCents: Number(attrs.total ?? 0),
        currency: String(attrs.currency || "USD"),
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      verifiedLemonOrders.set(paymentId, verifiedRecord);
      if (orderStatus === "paid" && userId) {
        const pending = pendingLemonCheckouts.get(paymentId);
        const eventPayload = {
          paymentId,
          courseId: courseId || pending?.courseId || "",
          courseTitle: pending?.courseTitle || "",
          studentId: userId,
          instructorId: pending?.instructorId || "",
          amountCents: pending?.amountCents ?? verifiedRecord.totalCents,
          currency: pending?.currency || verifiedRecord.currency,
          gateway: "lemonsqueezy",
          status: "succeeded",
          transactionRef: `LS-${verifiedRecord.orderNumber}`,
          authorizedAt: verifiedRecord.verifiedAt
        };
        broadcastEvent({ type: "PAYMENT_COMPLETED", scope: "user", ...eventPayload }, userId);
        if (pending?.instructorId) {
          broadcastEvent({ type: "INSTRUCTOR_SALE", scope: "user", ...eventPayload }, pending.instructorId);
          void dispatchWebhooks(pending.instructorId, "payment.succeeded", eventPayload);
        }
      }
    }
    res.json({ received: true });
  });
  app3.get("/api/v1/payments/lemonsqueezy/verify", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const paymentId = typeof req.query.paymentId === "string" ? req.query.paymentId.trim() : "";
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId.trim() : "";
    const orderIdQuery = typeof req.query.orderId === "string" ? req.query.orderId.trim() : "";
    if (!paymentId || !/^[a-zA-Z0-9_-]{4,128}$/.test(paymentId)) {
      res.status(400).json({ error: "paymentId inv\xE1lido." });
      return;
    }
    const pending = pendingLemonCheckouts.get(paymentId);
    if (pending && pending.userId !== auth2.uid) {
      res.status(403).json({ error: "Esta sesi\xF3n de pago pertenece a otro usuario." });
      return;
    }
    if (pending && courseId && pending.courseId !== courseId) {
      res.status(400).json({ error: "El curso no coincide con la sesi\xF3n de pago." });
      return;
    }
    let verified = verifiedLemonOrders.get(paymentId);
    if (verified && verified.userId && verified.userId !== auth2.uid) {
      res.status(403).json({ error: "La orden verificada pertenece a otro usuario." });
      return;
    }
    const lsConfig = getLemonSqueezyConfig();
    if (!verified && lsConfig.apiKey && lsConfig.storeId && (pending || orderIdQuery)) {
      try {
        if (orderIdQuery && /^[0-9]+$/.test(orderIdQuery)) {
          const orderResp = await fetch(`https://api.lemonsqueezy.com/v1/orders/${orderIdQuery}`, {
            headers: {
              Authorization: `Bearer ${lsConfig.apiKey}`,
              Accept: "application/vnd.api+json"
            }
          });
          if (orderResp.ok) {
            const orderJson = await orderResp.json();
            const attrs = orderJson.data?.attributes;
            const emailMatches = !auth2.email || !attrs?.user_email || attrs.user_email.trim().toLowerCase() === auth2.email.toLowerCase();
            if (orderJson.data?.id && attrs?.status === "paid" && emailMatches) {
              verified = {
                paymentId,
                orderId: String(orderJson.data.id),
                orderNumber: String(attrs.order_number || orderJson.data.id),
                identifier: String(attrs.identifier || orderJson.data.id),
                courseId: pending?.courseId || courseId,
                userId: auth2.uid,
                status: "paid",
                receiptUrl: attrs.urls?.receipt,
                totalCents: Number(attrs.total ?? 0),
                currency: String(attrs.currency || "USD"),
                verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
              };
              verifiedLemonOrders.set(paymentId, verified);
            }
          }
        } else if (pending && auth2.email) {
          const ordersUrl = new URL("https://api.lemonsqueezy.com/v1/orders");
          ordersUrl.searchParams.set("filter[store_id]", lsConfig.storeId);
          ordersUrl.searchParams.set("filter[user_email]", auth2.email);
          ordersUrl.searchParams.set("sort", "-createdAt");
          ordersUrl.searchParams.set("page[size]", "10");
          const ordersResp = await fetch(ordersUrl.toString(), {
            headers: {
              Authorization: `Bearer ${lsConfig.apiKey}`,
              Accept: "application/vnd.api+json"
            }
          });
          if (ordersResp.ok) {
            const ordersJson = await ordersResp.json();
            const matched = (ordersJson.data ?? []).find((ord) => {
              const a = ord.attributes;
              if (!a || a.status !== "paid") return false;
              const createdMs = a.created_at ? new Date(a.created_at).getTime() : 0;
              const afterCheckout = createdMs >= pending.createdAtMs - 6e4;
              const variantOk = !a.first_order_item?.variant_id || String(a.first_order_item.variant_id) === String(pending.variantId);
              return afterCheckout && variantOk;
            });
            if (matched?.id && matched.attributes) {
              verified = {
                paymentId,
                orderId: String(matched.id),
                orderNumber: String(matched.attributes.order_number || matched.id),
                identifier: String(matched.attributes.identifier || matched.id),
                courseId: pending.courseId,
                userId: auth2.uid,
                status: "paid",
                receiptUrl: matched.attributes.urls?.receipt,
                totalCents: Number(matched.attributes.total ?? 0),
                currency: String(matched.attributes.currency || "USD"),
                verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
              };
              verifiedLemonOrders.set(paymentId, verified);
            }
          }
        }
      } catch (err) {
        console.error("Lemon Squeezy verify lookup error:", err);
      }
    }
    if (!verified || verified.status !== "paid") {
      res.json({
        verified: false,
        status: verified?.status === "refunded" ? "refunded" : "pending",
        paymentId,
        courseId: pending?.courseId || courseId,
        message: verified?.status === "refunded" ? "Esta orden fue reembolsada en Lemon Squeezy." : "El pago a\xFAn aparece pendiente de confirmaci\xF3n en Lemon Squeezy."
      });
      return;
    }
    res.json({
      verified: true,
      status: "paid",
      paymentId,
      courseId: pending?.courseId || verified.courseId || courseId,
      courseTitle: pending?.courseTitle,
      instructorId: pending?.instructorId,
      transactionRef: `LS-${verified.orderNumber}`,
      amountCents: pending?.amountCents,
      originalAmountCents: pending?.originalAmountCents,
      discountCents: pending?.discountCents,
      discountSource: pending?.discountSource ?? "none",
      couponCode: pending?.couponCode,
      giftCardCode: pending?.giftCardCode,
      currency: pending?.currency,
      receiptUrl: verified.receiptUrl
    });
  });
  const getStripeClient = () => {
    const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!secretKey) {
      return { stripe: null, testMode: false, webhookConfigured: Boolean(webhookSecret) };
    }
    return {
      stripe: new Stripe(secretKey),
      testMode: secretKey.startsWith("sk_test_"),
      webhookConfigured: Boolean(webhookSecret),
      webhookSecret
    };
  };
  app3.get("/api/v1/payments/stripe/status", (_req, res) => {
    const { stripe, testMode, webhookConfigured } = getStripeClient();
    res.json({
      configured: Boolean(stripe),
      webhookConfigured,
      testMode,
      currency: "DOP"
    });
  });
  app3.post("/api/v1/payments/stripe/checkout", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const { stripe, testMode } = getStripeClient();
    if (!stripe) {
      res.status(503).json({
        error: "Stripe no est\xE1 configurado en el servidor (falta STRIPE_SECRET_KEY)."
      });
      return;
    }
    const { courseId, couponCode, giftCardCode } = req.body ?? {};
    const safeCourseId = typeof courseId === "string" ? courseId.trim() : "";
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(safeCourseId)) {
      res.status(400).json({ error: "Identificador de curso inv\xE1lido." });
      return;
    }
    try {
      const course = await readFirestoreDoc("courses", safeCourseId, req.headers.authorization);
      if (!course) {
        res.status(404).json({ error: "Curso no encontrado." });
        return;
      }
      const courseTitle = String(course.title || "Curso DB Academy").slice(0, 140);
      const courseSubtitle = String(course.subtitle || "Formaci\xF3n t\xE9cnico profesional en DB Academy").slice(0, 240);
      const instructorId = String(course.instructorId || "");
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      let discountCents = 0;
      let discountSource = "none";
      let appliedCouponCode;
      let appliedGiftCardCode;
      const normalizedGiftCard = typeof giftCardCode === "string" && giftCardCode.trim() ? normalizeCode(giftCardCode) : "";
      const normalizedCoupon = typeof couponCode === "string" && couponCode.trim() ? normalizeCode(couponCode) : "";
      if (normalizedGiftCard) {
        const cardSnap = await serverDb.collection("gift_cards").doc(normalizedGiftCard).get();
        const card = cardSnap.exists() ? cardSnap.data() : null;
        if (!card) {
          res.status(400).json({ error: "Tarjeta de regalo no encontrada." });
          return;
        }
        if (card.active !== true) {
          res.status(400).json({ error: "Esta tarjeta de regalo est\xE1 desactivada." });
          return;
        }
        if (card.expiresAt && new Date(String(card.expiresAt)).getTime() < Date.now()) {
          res.status(400).json({ error: "Esta tarjeta de regalo ha expirado." });
          return;
        }
        const remaining = Number(card.remainingUses ?? 0);
        if (remaining <= 0) {
          res.status(400).json({ error: "Esta tarjeta de regalo ya agot\xF3 sus usos." });
          return;
        }
        if (card.courseId && String(card.courseId) !== safeCourseId) {
          res.status(400).json({ error: "Esta tarjeta aplica para otro curso espec\xEDfico." });
          return;
        }
        const valueCents = Math.max(0, Math.round(Number(card.valueCents ?? originalAmountCents)));
        discountCents = Math.min(originalAmountCents, valueCents);
        discountSource = "gift_card";
        appliedGiftCardCode = normalizedGiftCard;
      } else if (normalizedCoupon) {
        const couponDoc = await readFirestoreDoc("coupons", normalizedCoupon, req.headers.authorization);
        if (!couponDoc) {
          res.status(400).json({ error: "Cup\xF3n no v\xE1lido." });
          return;
        }
        const c = couponDoc;
        if (!isCouponActive(c)) {
          res.status(400).json({ error: "El cup\xF3n no est\xE1 activo, expir\xF3 o agot\xF3 sus usos." });
          return;
        }
        if (c.appliesTo === "courses" && !c.courseIds?.includes(safeCourseId)) {
          res.status(400).json({ error: "Este cup\xF3n no aplica para el curso seleccionado." });
          return;
        }
        if (c.minPurchaseCents != null && originalAmountCents < c.minPurchaseCents) {
          res.status(400).json({ error: "El curso no alcanza el monto m\xEDnimo del cup\xF3n." });
          return;
        }
        discountCents = calculateDiscount(c, originalAmountCents).discountCents;
        discountSource = "coupon";
        appliedCouponCode = normalizedCoupon;
      }
      const finalAmountCents = Math.max(0, originalAmountCents - discountCents);
      const paymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
      if (finalAmountCents === 0) {
        res.json({
          freeBypass: true,
          paymentId,
          courseId: safeCourseId,
          amountCents: 0,
          originalAmountCents,
          discountCents,
          discountSource,
          currency: "DOP",
          testMode
        });
        return;
      }
      const protoHeader = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const hostHeader = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
      const appBaseUrl = process.env.APP_URL && !process.env.APP_URL.includes("MY_APP_URL") ? process.env.APP_URL.replace(/\/+$/, "") : `${protoHeader.split(",")[0].trim()}://${hostHeader.split(",")[0].trim()}`;
      const successUrl = `${appBaseUrl}/?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}&course_id=${encodeURIComponent(safeCourseId)}&payment_id=${encodeURIComponent(paymentId)}`;
      const cancelUrl = `${appBaseUrl}/?stripe_checkout=cancelled&course_id=${encodeURIComponent(safeCourseId)}`;
      const baseSessionParams = {
        mode: "payment",
        customer_email: auth2.email || void 0,
        line_items: [
          {
            price_data: {
              currency: "dop",
              unit_amount: finalAmountCents,
              product_data: {
                name: courseTitle,
                description: courseSubtitle
              }
            },
            quantity: 1
          }
        ],
        invoice_creation: {
          enabled: true
        },
        tax_id_collection: {
          enabled: true
        },
        automatic_tax: {
          enabled: true
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          paymentId,
          courseId: safeCourseId,
          courseTitle,
          studentId: auth2.uid,
          instructorId,
          couponCode: appliedCouponCode || "",
          giftCardCode: appliedGiftCardCode || "",
          discountSource,
          originalAmountCents: String(originalAmountCents),
          discountCents: String(discountCents)
        }
      };
      let session;
      let automaticTaxApplied = true;
      try {
        session = await stripe.checkout.sessions.create(baseSessionParams);
      } catch (taxErr) {
        const msg = taxErr instanceof Error ? taxErr.message : "";
        if (/automatic[_\s]tax|head office address|origin address|tax settings|settings\/tax/i.test(msg)) {
          console.warn("[stripe] Stripe Tax a\xFAn no configurado en Dashboard; reintentando sin automatic_tax:", msg);
          automaticTaxApplied = false;
          const { automatic_tax: _omitTax, ...fallbackParams } = baseSessionParams;
          session = await stripe.checkout.sessions.create(fallbackParams);
        } else {
          throw taxErr;
        }
      }
      res.json({
        freeBypass: false,
        checkoutUrl: session.url,
        sessionId: session.id,
        paymentId,
        courseId: safeCourseId,
        amountCents: finalAmountCents,
        originalAmountCents,
        discountCents,
        discountSource,
        currency: "DOP",
        testMode,
        automaticTaxApplied
      });
    } catch (err) {
      console.error("[stripe] Error creando Checkout Session:", err);
      res.status(502).json({
        error: err instanceof Error ? err.message : "No se pudo iniciar Stripe Checkout."
      });
    }
  });
  app3.get("/api/v1/payments/stripe/verify", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const { stripe } = getStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Stripe no est\xE1 configurado en el servidor." });
      return;
    }
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId.trim() : "";
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId.trim() : "";
    if (!sessionId) {
      res.status(400).json({ error: "Se requiere sessionId de Stripe." });
      return;
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent", "invoice"]
      });
      const meta = session.metadata || {};
      if (meta.studentId && meta.studentId !== auth2.uid) {
        res.status(403).json({ error: "Esta sesi\xF3n de pago pertenece a otro usuario." });
        return;
      }
      if (session.payment_status !== "paid") {
        res.json({
          verified: false,
          status: "pending",
          message: "El pago en Stripe a\xFAn est\xE1 en proceso o no se ha completado."
        });
        return;
      }
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || session.id;
      const invoiceObj = session.invoice && typeof session.invoice === "object" ? session.invoice : null;
      res.json({
        verified: true,
        status: "paid",
        paymentId: meta.paymentId || `pay_${session.id.slice(-12)}`,
        courseId: meta.courseId || courseId,
        courseTitle: meta.courseTitle,
        instructorId: meta.instructorId,
        transactionRef: paymentIntentId,
        invoiceUrl: invoiceObj?.hosted_invoice_url || void 0,
        invoicePdf: invoiceObj?.invoice_pdf || void 0,
        amountCents: session.amount_total ?? 0,
        originalAmountCents: meta.originalAmountCents ? Number(meta.originalAmountCents) : void 0,
        discountCents: meta.discountCents ? Number(meta.discountCents) : void 0,
        discountSource: meta.discountSource || "none",
        couponCode: meta.couponCode || void 0,
        giftCardCode: meta.giftCardCode || void 0,
        currency: (session.currency || "dop").toUpperCase()
      });
    } catch (err) {
      console.error("[stripe] Error verificando sesi\xF3n:", err);
      res.status(502).json({
        error: err instanceof Error ? err.message : "No se pudo verificar la sesi\xF3n en Stripe."
      });
    }
  });
  app3.post("/api/v1/payments/stripe/webhook", (req, res) => {
    const { stripe, webhookSecret } = getStripeClient();
    if (!stripe || !webhookSecret) {
      res.status(503).json({ error: "STRIPE_WEBHOOK_SECRET no configurado." });
      return;
    }
    const sig = req.headers["stripe-signature"];
    const rawBody = req.rawBody;
    if (!sig || !rawBody) {
      res.status(400).json({ error: "Falta firma stripe-signature o rawBody." });
      return;
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : "Firma de webhook Stripe inv\xE1lida."
      });
      return;
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata || {};
      const studentId = meta.studentId || "";
      const instructorId = meta.instructorId || "";
      const receipt = {
        paymentId: meta.paymentId || `pay_${session.id.slice(-12)}`,
        courseId: meta.courseId || "",
        courseTitle: meta.courseTitle || "",
        studentId,
        instructorId,
        amountCents: session.amount_total ?? 0,
        currency: (session.currency || "dop").toUpperCase(),
        gateway: "stripe",
        status: session.payment_status === "paid" ? "succeeded" : "pending",
        transactionRef: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
        authorizedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (studentId) {
        broadcastEvent({ type: "PAYMENT_COMPLETED", scope: "user", ...receipt }, studentId);
      }
      if (instructorId) {
        broadcastEvent({ type: "INSTRUCTOR_SALE", scope: "user", ...receipt }, instructorId);
        void dispatchWebhooks(instructorId, "payment.succeeded", receipt);
      }
    }
    res.json({ received: true, eventType: event.type });
  });
  app3.post("/api/v1/payments/checkout", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const { courseId, gateway, couponCode, referralWelcome, testMode } = req.body ?? {};
    const isTestModeAdmin = testMode === true && auth2.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    if (!courseId || !gateway) {
      res.status(400).json({ error: "Missing required payment fields" });
      return;
    }
    const allowedGateways = ["lemonsqueezy", "stripe", "mercadopago", "paypal"];
    if (!allowedGateways.includes(String(gateway))) {
      res.status(400).json({ error: "Unsupported payment gateway" });
      return;
    }
    try {
      const db2 = serverDb;
      const courseSnap = await db2.collection("courses").doc(String(courseId)).get();
      if (!courseSnap.exists()) {
        res.status(404).json({ error: "Curso no encontrado" });
        return;
      }
      const course = courseSnap.data();
      const originalAmountCents = Math.max(0, Math.round(Number(course.priceCents ?? 0)));
      const currency = course.currency === "EUR" || course.currency === "MXN" || course.currency === "USD" ? course.currency : "DOP";
      let discountCents = 0;
      let appliedCouponCode;
      let redemptionId;
      let discountSource = "none";
      let welcomeDiscountCents = 0;
      if (referralWelcome === true && originalAmountCents > 0) {
        const settingsSnap = await db2.collection("settings").doc("referrals").get();
        const settings = settingsSnap.exists() ? settingsSnap.data() : null;
        if (settings?.active) {
          const userSnap = await db2.collection("users").doc(auth2.uid).get();
          const userData = userSnap.exists() ? userSnap.data() : {};
          if (userData.referredBy && userData.referredBy !== auth2.uid) {
            const prevPayments = await db2.collection("payments").where("studentId", "==", auth2.uid).where("status", "==", "succeeded").limit(1).get();
            if (prevPayments.empty) {
              const pct = Math.min(100, Math.max(0, Number(settings.welcomeDiscountPercent ?? 10)));
              welcomeDiscountCents = Math.min(originalAmountCents, Math.round(originalAmountCents * pct / 100));
            }
          }
        }
      }
      let couponDiscountCents = 0;
      let couponToApply = null;
      const normalizedCoupon = typeof couponCode === "string" && couponCode.trim() ? normalizeCode(couponCode) : "";
      if (normalizedCoupon && originalAmountCents > 0) {
        const couponRef = db2.collection("coupons").doc(normalizedCoupon);
        const couponSnap = await couponRef.get();
        if (!couponSnap.exists()) {
          res.status(400).json({ error: "C\xF3digo de cup\xF3n no encontrado." });
          return;
        }
        couponToApply = couponSnap.data();
        if (!isCouponActive(couponToApply)) {
          res.status(400).json({ error: "El cup\xF3n no est\xE1 activo, expir\xF3 o agot\xF3 sus usos." });
          return;
        }
        if (couponToApply.appliesTo === "courses" && !couponToApply.courseIds?.includes(String(courseId))) {
          res.status(400).json({ error: "Este cup\xF3n no aplica a este curso." });
          return;
        }
        if (couponToApply.minPurchaseCents && originalAmountCents < couponToApply.minPurchaseCents) {
          res.status(400).json({ error: `Compra m\xEDnima requerida: ${couponToApply.minPurchaseCents / 100} ${couponToApply.currency}.` });
          return;
        }
        couponDiscountCents = calculateDiscount(couponToApply, originalAmountCents).discountCents;
      }
      if (couponDiscountCents >= welcomeDiscountCents && couponDiscountCents > 0) {
        discountCents = couponDiscountCents;
        discountSource = "coupon";
        appliedCouponCode = normalizedCoupon;
      } else if (welcomeDiscountCents > 0) {
        discountCents = welcomeDiscountCents;
        discountSource = "referral_welcome";
      }
      const finalAmountCents = Math.max(0, originalAmountCents - discountCents);
      if (discountSource === "coupon" && couponToApply && appliedCouponCode && !isTestModeAdmin) {
        const couponRef = db2.collection("coupons").doc(appliedCouponCode);
        redemptionId = `cr_${crypto.randomBytes(8).toString("hex")}`;
        const redemptionRef = db2.collection("couponRedemptions").doc(redemptionId);
        await db2.runTransaction(async (tx) => {
          const freshCouponSnap = await tx.get(couponRef);
          if (!freshCouponSnap.exists()) throw new Error("Cup\xF3n no encontrado.");
          const freshCoupon = freshCouponSnap.data();
          if (!isCouponActive(freshCoupon)) throw new Error("El cup\xF3n ya no est\xE1 disponible.");
          if (freshCoupon.appliesTo === "courses" && !freshCoupon.courseIds?.includes(String(courseId))) {
            throw new Error("Este cup\xF3n no aplica a este curso.");
          }
          if (freshCoupon.maxRedemptions !== void 0 && freshCoupon.redemptionCount >= freshCoupon.maxRedemptions) {
            throw new Error("El cup\xF3n ha agotado sus usos.");
          }
          const userRedemptionsSnap = await tx.get(
            db2.collection("couponRedemptions").where("couponCode", "==", appliedCouponCode).where("userId", "==", auth2.uid)
          );
          const usedByUser = userRedemptionsSnap.docs.filter((d) => {
            const st = d.data().status;
            return st === "pending" || st === "confirmed";
          }).length;
          if (usedByUser >= (freshCoupon.maxPerUser ?? 1)) {
            throw new Error("Ya has usado este cup\xF3n el m\xE1ximo de veces permitido.");
          }
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const redemption = {
            id: redemptionId,
            couponCode: appliedCouponCode,
            userId: auth2.uid,
            courseId: String(courseId),
            discountCents,
            status: "confirmed",
            // mock payment succeeded immediately
            createdAt: now
          };
          tx.set(redemptionRef, redemption);
          tx.update(couponRef, {
            redemptionCount: (freshCoupon.redemptionCount ?? 0) + 1,
            updatedAt: now
          });
        });
      }
      const isFree = finalAmountCents === 0;
      const prefix = isFree ? "free" : gateway === "lemonsqueezy" ? "ls" : gateway === "stripe" ? "pi" : gateway === "mercadopago" ? "mp" : "pp";
      const transactionRef = `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
      const paymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
      const receipt = {
        paymentId,
        courseId: String(courseId),
        courseTitle: String(course.title || ""),
        studentId: auth2.uid,
        instructorId: String(course.instructorId || ""),
        amountCents: finalAmountCents,
        originalAmountCents,
        discountCents,
        discountSource,
        couponCode: appliedCouponCode,
        redemptionId,
        currency,
        gateway: isFree ? "free" : String(gateway),
        status: "succeeded",
        transactionRef,
        authorizedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      broadcastEvent({ type: "PAYMENT_COMPLETED", scope: "user", ...receipt }, auth2.uid);
      if (course.instructorId) {
        broadcastEvent({ type: "INSTRUCTOR_SALE", scope: "user", ...receipt }, String(course.instructorId));
        void dispatchWebhooks(String(course.instructorId), "payment.succeeded", receipt);
      }
      res.json(receipt);
    } catch (err) {
      console.error("Checkout error:", err);
      const message = err instanceof Error ? err.message : "Error procesando el pago.";
      res.status(400).json({ error: message });
    }
  });
  function normalizeCode(code) {
    return String(code).trim().toUpperCase().replace(/\s+/g, "");
  }
  function isCouponActive(coupon) {
    const now = Date.now();
    if (!coupon.active) return false;
    if (coupon.startsAt && new Date(String(coupon.startsAt)).getTime() > now) return false;
    if (coupon.expiresAt && new Date(String(coupon.expiresAt)).getTime() < now) return false;
    if (coupon.maxRedemptions !== void 0 && coupon.redemptionCount >= coupon.maxRedemptions) return false;
    return true;
  }
  function calculateDiscount(coupon, priceCents) {
    if (coupon.type === "percent") {
      const discount2 = Math.round(priceCents * coupon.value / 100);
      return {
        discountCents: Math.min(discount2, priceCents),
        // nunca más que el precio
        finalPriceCents: Math.max(0, priceCents - Math.min(discount2, priceCents))
      };
    }
    const discount = Math.min(coupon.value, priceCents);
    return {
      discountCents: discount,
      finalPriceCents: Math.max(0, priceCents - discount)
    };
  }
  app3.post("/api/coupons/validate", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp, 30, 6e4)) {
      res.status(429).json({ error: "Demasiadas solicitudes. Intenta de nuevo m\xE1s tarde." });
      return;
    }
    const { code, courseId, priceCents } = req.body ?? {};
    if (!code || typeof courseId !== "string" || typeof priceCents !== "number" || priceCents < 0) {
      res.status(400).json({ error: "Par\xE1metros inv\xE1lidos: code, courseId y priceCents son requeridos." });
      return;
    }
    try {
      const db2 = serverDb;
      const normalizedCode = normalizeCode(code);
      const couponRef = db2.collection("coupons").doc(normalizedCode);
      const couponSnap = await couponRef.get();
      if (!couponSnap.exists()) {
        res.status(404).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: "USD",
          reason: "C\xF3digo de cup\xF3n no encontrado."
        });
        return;
      }
      const coupon = couponSnap.data();
      if (!isCouponActive(coupon)) {
        let reason = "El cup\xF3n no est\xE1 activo.";
        if (!coupon.active) reason = "El cup\xF3n ha sido desactivado.";
        else if (coupon.expiresAt && new Date(String(coupon.expiresAt)).getTime() < Date.now()) {
          reason = "El cup\xF3n ha expirado.";
        } else if (coupon.maxRedemptions !== void 0 && coupon.redemptionCount >= coupon.maxRedemptions) {
          reason = "El cup\xF3n ha agotado sus usos disponibles.";
        }
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason
        });
        return;
      }
      if (coupon.appliesTo === "courses" && (!coupon.courseIds || !coupon.courseIds.includes(courseId))) {
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason: "Este cup\xF3n no aplica a este curso."
        });
        return;
      }
      if (coupon.minPurchaseCents && priceCents < coupon.minPurchaseCents) {
        res.status(400).json({
          valid: false,
          originalPriceCents: priceCents,
          discountCents: 0,
          finalPriceCents: priceCents,
          currency: coupon.currency,
          reason: `Compra m\xEDnima requerida: ${coupon.minPurchaseCents / 100} ${coupon.currency}.`
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
          value: coupon.value
        }
      });
    } catch (err) {
      console.error("Coupon validation error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error validando cup\xF3n." });
    }
  });
  app3.get("/api/admin/courses", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection("courses").get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al listar cursos" });
    }
  });
  app3.put("/api/admin/courses/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Se requiere el id del curso." });
      return;
    }
    try {
      const docRef = serverDb.collection("courses").doc(id);
      const existing = await docRef.get();
      const merged = { ...existing.exists() ? existing.data() : {}, ...req.body, id };
      await docRef.set(merged);
      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al actualizar curso" });
    }
  });
  app3.post("/api/admin/courses", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const data = req.body;
    const id = data.id?.trim();
    if (!id) {
      res.status(400).json({ error: 'El cuerpo debe incluir un campo "id".' });
      return;
    }
    try {
      await serverDb.collection("courses").doc(id).set(data);
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al crear curso" });
    }
  });
  app3.delete("/api/admin/courses/:id", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const { id } = req.params;
    try {
      await serverDb.collection("courses").doc(id).delete();
      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al eliminar curso" });
    }
  });
  const ADMIN_PROXY_TABLES = /* @__PURE__ */ new Set([
    "gift_cards",
    "gift_card_redemptions",
    "enrollments",
    "payments",
    "certificates",
    "users_private"
  ]);
  const isAdminProxyTable = (table) => ADMIN_PROXY_TABLES.has(table);
  app3.get("/api/admin/:table", async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) {
      res.status(404).json({ error: "Tabla no disponible" });
      return;
    }
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection(req.params.table).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al listar" });
    }
  });
  app3.get("/api/admin/:table/:id", async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) {
      res.status(404).json({ error: "Tabla no disponible" });
      return;
    }
    if (!await requireAdmin(req, res)) return;
    try {
      const snap = await serverDb.collection(req.params.table).doc(req.params.id).get();
      if (!snap.exists()) {
        res.status(404).json({ error: "No encontrado" });
        return;
      }
      res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al leer" });
    }
  });
  app3.put("/api/admin/:table/:id", async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) {
      res.status(404).json({ error: "Tabla no disponible" });
      return;
    }
    if (!await requireAdmin(req, res)) return;
    try {
      const docRef = serverDb.collection(req.params.table).doc(req.params.id);
      const existing = await docRef.get();
      const merged = { ...existing.exists() ? existing.data() : {}, ...req.body, id: req.params.id };
      await docRef.set(merged);
      res.json({ ok: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al guardar" });
    }
  });
  app3.post("/api/admin/:table", async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) {
      res.status(404).json({ error: "Tabla no disponible" });
      return;
    }
    if (!await requireAdmin(req, res)) return;
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ error: 'Se requiere el campo "id".' });
      return;
    }
    try {
      await serverDb.collection(req.params.table).doc(id).set(req.body);
      res.status(201).json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al crear" });
    }
  });
  app3.delete("/api/admin/:table/:id", async (req, res) => {
    if (!isAdminProxyTable(req.params.table)) {
      res.status(404).json({ error: "Tabla no disponible" });
      return;
    }
    if (!await requireAdmin(req, res)) return;
    try {
      await serverDb.collection(req.params.table).doc(req.params.id).delete();
      res.json({ ok: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al eliminar" });
    }
  });
  app3.get("/api/gift-cards/:code", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    const code = String(req.params.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{6,64}$/.test(code)) {
      res.status(400).json({ error: "C\xF3digo inv\xE1lido" });
      return;
    }
    try {
      const snap = await serverDb.collection("gift_cards").doc(code).get();
      if (!snap.exists()) {
        res.status(404).json({ error: "Gift Card no encontrada" });
        return;
      }
      res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al verificar" });
    }
  });
  app3.get("/api/gift-card-redemptions", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    try {
      const snap = await serverDb.collection("gift_card_redemptions").where("studentId", "==", auth2.uid).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Error al listar canjes" });
    }
  });
  app3.get("/api/coupons", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const snap = await db2.collection("coupons").orderBy("createdAt", "desc").get();
      const coupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ coupons });
    } catch (err) {
      console.error("List coupons error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error listando cupones." });
    }
  });
  app3.post("/api/coupons", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const {
        code,
        description,
        type,
        value,
        currency,
        appliesTo,
        courseIds,
        startsAt,
        expiresAt,
        maxRedemptions,
        maxPerUser,
        minPurchaseCents
      } = req.body ?? {};
      if (!code || !description || !type || typeof value !== "number") {
        res.status(400).json({ error: "Faltan campos requeridos: code, description, type, value." });
        return;
      }
      const normalizedCode = normalizeCode(code);
      const couponId = normalizedCode;
      if (type === "percent" && (value < 1 || value > 100)) {
        res.status(400).json({ error: "El porcentaje debe estar entre 1 y 100." });
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const coupon = {
        id: couponId,
        code: normalizedCode,
        description: String(description).trim(),
        type,
        value,
        currency: currency || "USD",
        appliesTo: appliesTo || "all",
        courseIds: Array.isArray(courseIds) ? courseIds : [],
        startsAt: startsAt || void 0,
        expiresAt: expiresAt || void 0,
        maxRedemptions: typeof maxRedemptions === "number" ? maxRedemptions : void 0,
        maxPerUser: typeof maxPerUser === "number" && maxPerUser > 0 ? maxPerUser : 1,
        minPurchaseCents: typeof minPurchaseCents === "number" ? minPurchaseCents : void 0,
        redemptionCount: 0,
        active: true,
        createdBy: "admin",
        createdAt: now,
        updatedAt: now
      };
      await db2.collection("coupons").doc(couponId).set(coupon);
      res.status(201).json({ coupon });
    } catch (err) {
      console.error("Create coupon error:", err);
      if (err instanceof Error && err.message.includes("already-exists")) {
        res.status(409).json({ error: "Ya existe un cup\xF3n con ese c\xF3digo." });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : "Error creando cup\xF3n." });
    }
  });
  app3.put("/api/coupons/:code", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db2.collection("coupons").doc(normalizedCode);
      const snap = await couponRef.get();
      if (!snap.exists()) {
        res.status(404).json({ error: "Cup\xF3n no encontrado." });
        return;
      }
      const updates = { ...req.body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      delete updates.id;
      delete updates.code;
      await couponRef.update(updates);
      const updatedSnap = await couponRef.get();
      res.json({ coupon: { id: updatedSnap.id, ...updatedSnap.data() } });
    } catch (err) {
      console.error("Update coupon error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error actualizando cup\xF3n." });
    }
  });
  app3.delete("/api/coupons/:code", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const couponRef = db2.collection("coupons").doc(normalizedCode);
      const snap = await couponRef.get();
      if (!snap.exists()) {
        res.status(404).json({ error: "Cup\xF3n no encontrado." });
        return;
      }
      const coupon = snap.data();
      if (coupon.redemptionCount > 0) {
        res.status(400).json({ error: "No se puede eliminar un cup\xF3n con redenciones. Desact\xEDvalo en su lugar." });
        return;
      }
      await couponRef.delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Delete coupon error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error eliminando cup\xF3n." });
    }
  });
  app3.post("/api/coupons/:code/toggle", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const { active } = req.body ?? {};
      if (typeof active !== "boolean") {
        res.status(400).json({ error: "El campo active es requerido (boolean)." });
        return;
      }
      const couponRef = db2.collection("coupons").doc(normalizedCode);
      await couponRef.update({ active, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({ success: true, active });
    } catch (err) {
      console.error("Toggle coupon error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error cambiando estado del cup\xF3n." });
    }
  });
  app3.get("/api/coupons/:code/redemptions", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { code } = req.params;
      const normalizedCode = normalizeCode(code);
      const snap = await db2.collection("couponRedemptions").where("couponCode", "==", normalizedCode).orderBy("createdAt", "desc").get();
      const redemptions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const totalDiscount = redemptions.filter((r) => r.status === "confirmed").reduce((acc, r) => acc + r.discountCents, 0);
      res.json({ redemptions, totalDiscountCents: totalDiscount });
    } catch (err) {
      console.error("List redemptions error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error listando redenciones." });
    }
  });
  app3.get("/api/referrals/settings", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const snap = await db2.collection("settings").doc("referrals").get();
      if (!snap.exists()) {
        const defaults = {
          id: "default",
          welcomeDiscountPercent: 10,
          referrerRewardPercent: 10,
          retentionDays: 7,
          maxRewardsPerReferrerPerMonth: 10,
          active: true,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db2.collection("settings").doc("referrals").set(defaults);
        res.json({ settings: defaults });
        return;
      }
      res.json({ settings: snap.data() });
    } catch (err) {
      console.error("Get referral settings error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error obteniendo configuraci\xF3n de referidos." });
    }
  });
  app3.put("/api/referrals/settings", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { welcomeDiscountPercent, referrerRewardPercent, retentionDays, maxRewardsPerReferrerPerMonth, active } = req.body ?? {};
      const settingsRef = db2.collection("settings").doc("referrals");
      const updates = {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (typeof welcomeDiscountPercent === "number") updates.welcomeDiscountPercent = welcomeDiscountPercent;
      if (typeof referrerRewardPercent === "number") updates.referrerRewardPercent = referrerRewardPercent;
      if (typeof retentionDays === "number") updates.retentionDays = retentionDays;
      if (typeof maxRewardsPerReferrerPerMonth === "number") updates.maxRewardsPerReferrerPerMonth = maxRewardsPerReferrerPerMonth;
      if (typeof active === "boolean") updates.active = active;
      await settingsRef.update(updates);
      const updatedSnap = await settingsRef.get();
      res.json({ settings: updatedSnap.data() });
    } catch (err) {
      console.error("Update referral settings error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error actualizando configuraci\xF3n de referidos." });
    }
  });
  app3.get("/api/referrals", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const snap = await db2.collection("referrals").orderBy("createdAt", "desc").get();
      const referrals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ referrals });
    } catch (err) {
      console.error("List referrals error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error listando referidos." });
    }
  });
  app3.get("/api/referrals/my", async (req, res) => {
    const auth2 = await requireAuth(req, res);
    if (!auth2) return;
    try {
      const db2 = serverDb;
      const userId = auth2.uid;
      const userSnap = await db2.collection("users").doc(userId).get();
      const userData = userSnap.exists() ? userSnap.data() : {};
      const referralCode = userData.referralCode;
      const referralsSnap = await db2.collection("referrals").where("referrerId", "==", userId).orderBy("createdAt", "desc").get();
      const myReferrals = referralsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const totalRewards = myReferrals.filter((r) => r.status === "rewarded").reduce((acc, r) => acc + r.rewardValue, 0);
      const pendingRewards = myReferrals.filter((r) => r.status === "qualified").reduce((acc, r) => acc + r.rewardValue, 0);
      res.json({
        referralCode,
        referredBy: userData.referredBy,
        myReferrals,
        totalRewardsCents: totalRewards,
        pendingRewardsCents: pendingRewards
      });
    } catch (err) {
      console.error("Get my referrals error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error obteniendo referidos." });
    }
  });
  app3.post("/api/referrals/record", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const { referrerId, referredId, orderId, rewardValue } = req.body ?? {};
      if (!referrerId || !referredId || !orderId || typeof rewardValue !== "number") {
        res.status(400).json({ error: "Faltan campos requeridos." });
        return;
      }
      if (referrerId === referredId) {
        res.status(400).json({ error: "No se permite autorreferido." });
        return;
      }
      const existing = await db2.collection("referrals").where("referredId", "==", referredId).limit(1).get();
      if (!existing.empty) {
        res.status(400).json({ error: "El usuario ya tiene un referidor asignado." });
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const referral = {
        id: `ref_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        referrerId,
        referredId,
        orderId,
        status: "pending",
        rewardType: "referrer_credit",
        rewardValue,
        createdAt: now
      };
      await db2.collection("referrals").doc(referral.id).set(referral);
      res.status(201).json({ referral });
    } catch (err) {
      console.error("Record referral error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error registrando referido." });
    }
  });
  app3.post("/api/referrals/reconcile", async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const db2 = serverDb;
      const settingsSnap = await db2.collection("settings").doc("referrals").get();
      const settings = settingsSnap.exists() ? settingsSnap.data() : {
        retentionDays: 7,
        active: true
      };
      if (!settings.active) {
        res.json({ processed: 0 });
        return;
      }
      const retentionMs = (settings.retentionDays || 7) * 24 * 60 * 60 * 1e3;
      const cutoff = new Date(Date.now() - retentionMs).toISOString();
      const pendingSnap = await db2.collection("referrals").where("status", "==", "pending").get();
      const batch = db2.batch();
      let processed = 0;
      for (const docSnap of pendingSnap.docs) {
        const referral = docSnap.data();
        if (referral.createdAt && String(referral.createdAt) <= cutoff) {
          batch.update(docSnap.ref, { status: "qualified", qualifiedAt: (/* @__PURE__ */ new Date()).toISOString() });
          processed++;
        }
      }
      if (processed > 0) await batch.commit();
      res.json({ processed });
    } catch (err) {
      console.error("Reconcile referrals error:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Error reconociendo referidos." });
    }
  });
  app3.post("/api/v1/webhooks/register", (req, res) => {
    const { id, ownerId, keyHash, label, webhookUrl } = req.body ?? {};
    if (!id || !ownerId || !keyHash) {
      res.status(400).json({ error: "Missing id, ownerId, or keyHash" });
      return;
    }
    registeredKeys.set(String(id), {
      id: String(id),
      ownerId: String(ownerId),
      keyHash: String(keyHash),
      label: String(label || "Integration Key"),
      webhookUrl: webhookUrl ? String(webhookUrl) : void 0
    });
    res.json({ registered: true, id, activeKeys: registeredKeys.size });
  });
  app3.post("/api/v1/webhooks/test", async (req, res) => {
    const { ownerId, event, webhookUrl, samplePayload } = req.body ?? {};
    const eventName = String(event || "course.progress.updated");
    const payload = {
      event: eventName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: samplePayload || {
        courseId: "excel-basico-05",
        progressPercent: 100,
        certificateIssued: true
      }
    };
    const hmacSecret = crypto.createHash("sha256").update(String(ownerId || "catedra")).digest("hex");
    const signature = crypto.createHmac("sha256", hmacSecret).update(JSON.stringify(payload)).digest("hex");
    let deliveryStatus = 200;
    let deliveryNote = "Verified local HMAC-SHA256 payload signed";
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3e3);
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Catedra-Event": eventName,
            "X-Catedra-Signature": `sha256=${signature}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);
        deliveryStatus = resp.status;
        deliveryNote = `Delivered HTTP ${resp.status} to ${webhookUrl}`;
      } catch (err) {
        deliveryStatus = 502;
        deliveryNote = err instanceof Error ? err.message : "External endpoint unreachable";
      }
    }
    recentWebhooks.unshift({
      id: crypto.randomUUID(),
      event: eventName,
      targetUrl: String(webhookUrl || "local-sandbox"),
      status: deliveryStatus,
      dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (recentWebhooks.length > 25) recentWebhooks.pop();
    res.json({
      dispatched: true,
      signature: `sha256=${signature}`,
      deliveryStatus,
      deliveryNote,
      payload,
      recentDeliveries: recentWebhooks.slice(0, 8)
    });
  });
  app3.get("/api/v1/webhooks/logs", (_req, res) => {
    res.json({ deliveries: recentWebhooks });
  });
  app3.post("/api/v1/cloud-storage/sync", (req, res) => {
    const { ownerId, provider, folder, encryptedEnvelope } = req.body ?? {};
    if (!ownerId || !provider || !encryptedEnvelope || encryptedEnvelope.algorithm !== "AES-GCM-256") {
      res.status(400).json({ error: "Encrypted AES-GCM-256 envelope required for zero-knowledge cloud sync" });
      return;
    }
    const serialized = JSON.stringify(encryptedEnvelope);
    const checksumSha256 = crypto.createHash("sha256").update(serialized).digest("hex");
    const record = {
      ownerId: String(ownerId),
      provider: String(provider),
      folder: String(folder || "/Catedra-Backups"),
      checksumSha256,
      bytes: Buffer.byteLength(serialized, "utf8"),
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const existing = cloudBackups.get(String(ownerId)) ?? [];
    existing.unshift(record);
    cloudBackups.set(String(ownerId), existing.slice(0, 15));
    res.json({
      ok: true,
      ...record,
      history: existing.slice(0, 5)
    });
  });
  const generatedCoversDir = path.resolve(__dirname, "public", "generated-covers");
  try {
    fs.mkdirSync(generatedCoversDir, { recursive: true });
    app3.use("/generated-covers", express.static(generatedCoversDir));
  } catch {
  }
  app3.post("/api/v1/courses/generate-cover", async (req, res) => {
    try {
      await verifyFirebaseAdminBearerToken(req.headers.authorization);
    } catch (err) {
      if (err instanceof AuthValidationError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      res.status(401).json({ error: "No autorizado para generar portadas." });
      return;
    }
    const { title, category, level } = req.body ?? {};
    const safeTitle = String(title || "Nuevo Curso T\xE9cnico").trim().slice(0, 64);
    const safeCategory = String(category || "DB Academy").trim().slice(0, 32);
    const safeLevel = String(level || "intermediate").trim();
    const escapeXml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const palettes = {
      Productividad: { bg: "#0A1914", accent: "#10B981", secondary: "#064E3B" },
      Ingenier\u00EDa: { bg: "#090F1E", accent: "#3B82F6", secondary: "#1E3A8A" },
      Datos: { bg: "#0B1120", accent: "#0EA5E9", secondary: "#0C4A6E" },
      Dise\u00F1o: { bg: "#18141C", accent: "#F59E0B", secondary: "#78350F" },
      Seguridad: { bg: "#111318", accent: "#EF4444", secondary: "#7F1D1D" }
    };
    const palette = palettes[safeCategory] || { bg: "#0F172A", accent: "#2563EB", secondary: "#1E293B" };
    const slug = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "course";
    const fileName = `${slug}-${Date.now().toString(36)}.svg`;
    const filePath = path.join(generatedCoversDir, fileName);
    const words = safeTitle.split(/\s+/);
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
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
  <text x="88" y="132" fill="${palette.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" letter-spacing="2">DB ACADEMY \xB7 ${escapeXml(safeCategory.toUpperCase())}</text>
  <text x="88" y="310" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${escapeXml(line1)}</text>
  ${line2 ? `<text x="88" y="384" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${escapeXml(line2)}</text>` : ""}
  <text x="88" y="610" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="22">LEVEL: ${escapeXml(safeLevel.toUpperCase())} \xB7 FORMATIONAL TRACK</text>
</svg>`;
    fs.writeFileSync(filePath, svg, "utf8");
    res.json({
      coverImage: `/generated-covers/${fileName}`,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const legalDocsDir = path.resolve(__dirname, "public", "legal");
  app3.get(/^\/legal\/([A-Za-z0-9_-]+\.md)$/, (req, res, next) => {
    const fileName = String(req.params[0] || "");
    if (!getLegalDocumentByFile(fileName)) {
      next();
      return;
    }
    fs.readFile(path.join(legalDocsDir, fileName), (err, data) => {
      if (err) {
        next();
        return;
      }
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.end(data);
    });
  });
  return app3;
}
async function startServer() {
  const app3 = createApp();
  const server = http.createServer(app3);
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        ws: { server, path: "/vite-ws" },
        allowedHosts: true
      },
      appType: "spa"
    });
    app3.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app3.use(express.static(distPath));
    app3.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
  wss.on("connection", (ws) => {
    let currentClient = null;
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "IDENTIFY" && typeof msg.uid === "string" && typeof msg.deviceId === "string") {
          currentClient = {
            ws,
            uid: msg.uid,
            deviceId: msg.deviceId,
            deviceLabel: typeof msg.deviceLabel === "string" ? msg.deviceLabel : "Web Browser",
            role: typeof msg.role === "string" ? msg.role : "student",
            connectedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          clients.add(currentClient);
          broadcastPresence(currentClient.uid);
          return;
        }
        if (!currentClient) return;
        if (msg.type === "SYNC_PREFS" || msg.type === "TASK_UPDATED") {
          broadcastEvent(msg, currentClient.uid);
          return;
        }
        if (msg.type === "PROGRESS_UPDATED" || msg.type === "FORUM_POSTED" || msg.type === "CERTIFICATE_ISSUED" || msg.type === "CALENDAR_ALERT") {
          broadcastEvent({ ...msg, scope: "global", senderUid: currentClient.uid });
          if (msg.type === "PROGRESS_UPDATED" && typeof msg.instructorId === "string") {
            void dispatchWebhooks(msg.instructorId, "module.completed", msg);
          }
          if (msg.type === "CERTIFICATE_ISSUED" && typeof msg.instructorId === "string") {
            void dispatchWebhooks(msg.instructorId, "certificate.issued", msg);
          }
          return;
        }
        if (msg.type === "GIFT_CARD_REDEEMED") {
          const eventPayload = {
            type: "GIFT_CARD_REDEEMED",
            cardCode: typeof msg.cardCode === "string" ? msg.cardCode.slice(0, 64) : "",
            courseId: typeof msg.courseId === "string" ? msg.courseId.slice(0, 128) : "",
            courseTitle: typeof msg.courseTitle === "string" ? msg.courseTitle.slice(0, 140) : "",
            instructorId: typeof msg.instructorId === "string" ? msg.instructorId.slice(0, 128) : "",
            amountAppliedCents: typeof msg.amountAppliedCents === "number" ? msg.amountAppliedCents : 0,
            currency: typeof msg.currency === "string" ? msg.currency.slice(0, 8) : "DOP",
            senderUid: currentClient.uid
          };
          broadcastEvent({ ...eventPayload, scope: "user" }, currentClient.uid);
          if (eventPayload.instructorId && eventPayload.instructorId !== currentClient.uid) {
            broadcastEvent({ ...eventPayload, scope: "user" }, eventPayload.instructorId);
          }
          for (const client2 of clients) {
            if (client2.ws.readyState === WebSocket.OPEN && client2.role === "instructor" && client2.uid !== currentClient.uid && client2.uid !== eventPayload.instructorId) {
              client2.ws.send(JSON.stringify({ ...eventPayload, serverTimestamp: (/* @__PURE__ */ new Date()).toISOString() }));
            }
          }
          if (eventPayload.instructorId) {
            void dispatchWebhooks(eventPayload.instructorId, "gift_card.redeemed", eventPayload);
          }
        }
      } catch {
      }
    });
    ws.on("close", () => {
      if (currentClient) {
        const uid = currentClient.uid;
        clients.delete(currentClient);
        broadcastPresence(uid);
      }
    });
  });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`C\xE1tedra LMS server listening on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

// src/vercelApi.ts
var app2 = createApp();
var vercelApi_default = app2;
export {
  vercelApi_default as default
};
