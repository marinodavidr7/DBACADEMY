#!/usr/bin/env node
/**
 * apply-migrations.mjs — Aplica supabase/migrations/*.sql a Postgres (via pg) usando SUPABASE_URL + SUPABASE_SERVICE_KEY de .env.local.
 *
 * Uso: node scripts/apply-migrations.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(ROOT, 'supabase', 'migrations');

let pg;
try {
  pg = (await import('pg')).Client;
} catch (e) {
  console.error('Falta dependencia pg. Instala: npm install pg');
  process.exit(1);
}

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
if (!url || !serviceKey) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local.');
  process.exit(1);
}

// Mapeo: SUPABASE_URL https://<ref>.supabase.co -> postgres://postgres:<key>@db.<ref>.supabase.co:5432/postgres
const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
if (!m) throw new Error('SUPABASE_URL no tiene formato esperado (https://<ref>.supabase.co)');
const connStr = `postgres://postgres:${encodeURIComponent(serviceKey)}@db.${m[1]}.supabase.co:5432/postgres`;

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg({ connectionString: connStr, ssl: true });
await client.connect();
console.log('Conectado a Postgres. Aplicando migraciones:', files.join(', '));

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  const t0 = Date.now();
  await client.query(sql);
  console.log(`OK  ${file}  (${Date.now() - t0} ms)`);
}

const [tables] = await client.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users','courses','enrollments','payments','certificates','forum_threads','forum_replies','calendar_events','encrypted_notes','api_keys','custom_exercises','assignment_submissions','gift_cards','gift_card_redemptions','coupons','coupon_redemptions','referrals','referral_settings','settings','users_private')`);
const [courses] = await client.query('SELECT count(*)::int AS n FROM courses');
const [rls] = await client.query('SELECT count(*)::int AS n FROM pg_tables t JOIN pg_class c ON t.relid = c.oid WHERE c.relrowsecurity IS NOT NULL AND c.relrowsecurity = true AND schemaname = current_schema()');
console.log('Migraciones aplicadas ✅');
console.log(`Tablas verificadas en public: ${tables.rows[0].n} / 20`);
console.log(`Cursos en tabla courses: ${courses.rows[0].n}`);
console.log(`Tablas con RLS habilitada: ${rls.rows[0].n}`);

await client.end();
process.exit(0);
