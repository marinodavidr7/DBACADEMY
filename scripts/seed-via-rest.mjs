#!/usr/bin/env node
/**
 * seed-via-rest.mjs — Alternativa a 0002 (no SQL manual): pobla tablas (users, courses, ...)
 * usando PostgREST via supabase-js con SUPABASE_URL + SUPABASE_SERVICE_KEY de .env.local.
 *
 * Sources: supabase/migrations/0002_seed_courses.sql (dump hervedo en supabase/seed/*.json)
 * Uso: node scripts/seed-via-rest.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = (await import('@supabase/supabase-js')).createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'supabase', 'seed', 'courses.json'), 'utf8'));

const { error, data } = await client.from('courses').insert(courses).select('id');
if (error) throw new Error('seed courses failed: ' + error.message);
console.log('seeded courses:', data?.length);
process.exit(0);
