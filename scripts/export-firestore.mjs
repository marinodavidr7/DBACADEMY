#!/usr/bin/env node
/**
 * export-firestore.mjs — Volcado de colecciones de Firestore a JSON (para la migración a Supabase).
 *
 * Uso: node scripts/export-firestore.mjs
 * Requisito: secrets/firebase-service-account.json (genera en consola de Firebase:
 *   Proyecto → Settings → Service Accounts → Generate new private key)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SA_PATH = path.join(ROOT, 'secrets', 'firebase-service-account.json');
const OUT = path.join(ROOT, 'secrets', 'firestore-export');

if (!fs.existsSync(SA_PATH)) {
  console.error(`Falta service account en ${SA_PATH} (sage redactada, ver ejecución de consola de Firebase)`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8')
);
const projectId = serviceAccount.project_id || firebaseConfig.projectId;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId,
});

// El proyecto usa una base de Firestore con nombre (no la "(default)").
const { Firestore } = await import('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

fs.mkdirSync(OUT, { recursive: true });

async function exportCollection(name) {
  const [docs] = await db.collection(name).get().catch(() => [[]]);
  const data = docs.map((d) => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`export ${name}: ${data.length} doc(s)`);
}

const COLLECTIONS = [
  'courses', 'users', 'enrollments', 'payments', 'certificates',
  'forumThreads', 'calendarEvents', 'encryptedNotes', 'apiKeys', 'customExercises',
  'assignmentSubmissions', 'giftCards', 'giftCardRedemptions', 'coupons', 'couponRedemptions',
  'referrals', 'settings',
];
for (const c of COLLECTIONS) await exportCollection(c);

// forumReplies anidada: forumThreads/{id}/replies
let replies = [];
const [threads] = await db.collection('forumThreads').get().catch(() => [[]]);
for (const t of threads) {
  const [rSnap] = await t.ref.collection('replies').get().catch(() => [[]]);
  replies.push(...rSnap.map((d) => ({ id: d.id, thread_id: t.id, ...d.data() })));
}
fs.writeFileSync(path.join(OUT, 'forumReplies.json'), JSON.stringify(replies, null, 2));
console.log(`export forumReplies: ${replies.length} doc(s)`);

// users_private: users/{uid}/private/info
let privateInfo = [];
const [users] = await db.collection('users').get().catch(() => [[]]);
for (const u of users) {
  const [pSnap] = await u.ref.collection('private').doc('info').get().catch(() => [[null]]);
  if (pSnap) privateInfo.push({ id: pSnap.id || u.uid, uid: u.uid, ...pSnap.data() });
}
fs.writeFileSync(path.join(OUT, 'users_private.json'), JSON.stringify(privateInfo, null, 2));
console.log(`export users_private: ${privateInfo.length} doc(s)`);

console.log('DONE — archivos en secrets/firestore-export/');
process.exit(0);
