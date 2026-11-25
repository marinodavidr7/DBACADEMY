#!/usr/bin/env node
/**
 * generate-firestore-seed.mjs — Convierte exports de secrets/firestore-export/
 * en SQL INSERTs para supabase/migrations/0004_seed_from_firestore.sql.
 *
 * Uso: node scripts/generate-firestore-seed.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'secrets', 'firestore-export');
const SQL_OUT = path.join(ROOT, 'supabase', 'migrations', '0004_seed_from_firestore.sql');

function toSnake(key) {
  return String(key).replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`).replace(/^_/, '');
}

function conv(v) {
  if (v && typeof v === 'object' && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(conv);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = conv(v[k]);
    return out;
  }
  return v;
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v) || typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

const MAPPINGS = [
  ['courses', 'courses'], ['users', 'users'], ['users_private', 'users_private'],
  ['enrollments', 'enrollments'], ['payments', 'payments'], ['certificates', 'certificates'],
  ['forumThreads', 'forum_threads'], ['forumReplies', 'forum_replies'],
  ['calendarEvents', 'calendar_events'], ['encryptedNotes', 'encrypted_notes'],
  ['apiKeys', 'api_keys'], ['customExercises', 'custom_exercises'],
  ['assignmentSubmissions', 'assignment_submissions'], ['giftCards', 'gift_cards'],
  ['giftCardRedemptions', 'gift_card_redemptions'], ['coupons', 'coupons'],
  ['couponRedemptions', 'coupon_redemptions'], ['referrals', 'referrals'],
  ['settings', 'settings'],
];

const statements = [];
statements.push('-- DBACADEMY — Seed migrado desde Firestore (generado con scripts/export-firestore.mjs + generate-firestore-seed.mjs)');
statements.push('BEGIN;');
statements.push('');

for (const [file, table] of MAPPINGS) {
  const filePath = path.join(OUT, `${file}.json`);
  if (!fs.existsSync(filePath)) continue;
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8')).map((r) => conv(r));
  if (rows.length === 0) { console.log(`skip ${table} (0 docs)`); continue; }
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r).map(toSnake)))].filter((c) => c !== 'id' || table === 'courses' ? true : c);
  statements.push(`-- -- ${table} (${rows.length} doc(s)) --`);
  statements.push(`TRUNCATE TABLE ${table}`);
  for (const row of rows) {
    const colsUsed = Object.keys(row).map(toSnake).filter(Boolean);
    const vals = colsUsed.map((c) => esc(row[Object.keys(row).find((k) => toSnake(k) === c)]));
    statements.push(`INSERT INTO ${table} (${colsUsed.join(', ')}) VALUES (${vals.join(', ')});`);
  }
  statements.push('');
  console.log(`${table}: ${rows.length} doc(s)`);
}

statements.push('COMMIT;');
fs.writeFileSync(SQL_OUT, statements.join('\n') + '\n');
console.log('wrote', SQL_OUT);
