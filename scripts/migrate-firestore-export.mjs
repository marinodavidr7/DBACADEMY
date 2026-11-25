#!/usr/bin/env node
/**
 * migrate-firestore-export.mjs — Importa el export de Firestore a Supabase SIN borrar datos.
 *
 * Uso:
 *   node scripts/migrate-firestore-export.mjs            # dry-run (sólo cuenta)
 *   node scripts/migrate-firestore-export.mjs --apply    # escribe con UPSERT idempotente
 *   node scripts/migrate-firestore-export.mjs --backup=/ruta/backup.json --apply --only=users,users_private,giftCards,giftCardRedemptions
 *
 * Requisitos:
 *   1) secrets/firestore-export/*.json  (generado con scripts/export-firestore.mjs)
 *   2) SUPABASE_URL + SUPABASE_SERVICE_KEY o SUPABASE_SECRET_KEY en .env.local
 *
 * Seguridad: nunca imprime valores de tokens/códigos; sólo conteos por tabla.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });
dotenv.config({ path: path.join(ROOT, '.env') });

const APPLY = process.argv.includes('--apply');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim())) : null;
const backupArg = process.argv.find((arg) => arg.startsWith('--backup='));
const BACKUP_PATH = backupArg ? backupArg.slice('--backup='.length) : null;

/** Un backup de AI Studio viene en un único JSON con `collections`. */
let BACKUP = null;
if (BACKUP_PATH) {
  BACKUP = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
  console.log(
    `Backup: ${BACKUP.projectId || '?'} / ${BACKUP.firestoreDatabaseId || '?'} / ${BACKUP.exportedAt || '?'}`
  );
}

const MAPPINGS = [
  { file: 'users', table: 'users', pk: 'uid' },
  { file: 'users_private', table: 'users_private', pk: 'uid' },
  { file: 'giftCards', table: 'gift_cards', pk: 'id' },
  { file: 'giftCardRedemptions', table: 'gift_card_redemptions', pk: 'id' },
  { file: 'enrollments', table: 'enrollments', pk: 'id' },
  { file: 'payments', table: 'payments', pk: 'id' },
  { file: 'certificates', table: 'certificates', pk: 'id' },
  { file: 'coupons', table: 'coupons', pk: 'id' },
  { file: 'couponRedemptions', table: 'coupon_redemptions', pk: 'id' },
  { file: 'customExercises', table: 'custom_exercises', pk: 'id' },
  { file: 'assignmentSubmissions', table: 'assignment_submissions', pk: 'id' },
];

// Maneja siglas: photoURL -> photo_url, e2eeKeyFingerprint -> e2ee_key_fingerprint.
const toSnake = (key) =>
  String(key)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();

/** Convierte Timestamps de Firestore (JSON) a ISO 8601 y normaliza claves. */
function normalize(row, pk) {
  const out = {};
  for (const [key, raw] of Object.entries(row)) {
    let value = raw;
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      value = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && typeof value._seconds === 'number') {
      value = new Date(value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1e6)).toISOString();
    } else if (Array.isArray(value)) {
      value = value.map((item) =>
        item && typeof item === 'object' && typeof item._seconds === 'number'
          ? new Date(item._seconds * 1000).toISOString()
          : item
      );
    }
    out[toSnake(key)] = value;
  }
  // En Firestore el id del documento users/{uid} era `id`; en Postgres la PK es `uid`.
  if (pk !== 'id') {
    if (out.id && !out[pk]) out[pk] = out.id;
    delete out.id;
  }
  return out;
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Faltan credenciales de servidor (SUPABASE_URL + SUPABASE_SERVICE_KEY/SECRET_KEY).');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { autoRefreshToken: false } });

const exportDir = path.join(ROOT, 'secrets', 'firestore-export');
if (!BACKUP && !fs.existsSync(exportDir)) {
  console.error(`No existe ${exportDir}. Ejecuta primero: node scripts/export-firestore.mjs o usa --backup=<archivo.json>`);
  process.exit(1);
}

let failures = 0;

// En modo backup, las inscripciones/pagos pueden referenciar cursos que ya no están
// en el catálogo. Se crean como placeholders (nunca sobrescriben uno existente)
// para poder satisfacer las FK de enrollments/payments/certificates.
if (BACKUP) {
  const needed = new Map();
  for (const src of ['enrollments', 'payments', 'certificates']) {
    for (const row of BACKUP.collections?.[src] || []) {
      if (row.courseId && !needed.has(row.courseId)) {
        needed.set(row.courseId, row.courseTitle || row.courseId);
      }
    }
  }
  const ids = [...needed.keys()];
  if (ids.length) {
    const { data: existing } = await sb.from('courses').select('id').in('id', ids);
    const existingIds = new Set((existing || []).map((row) => row.id));
    const missing = [...needed]
      .filter(([id]) => !existingIds.has(id))
      .map(([id, title]) => ({ id, title, published: false }));
    if (missing.length) {
      if (!APPLY) {
        console.log(`[dry-run] courses: ${missing.length} placeholder(s) requerido(s) para FK`);
      } else {
        const { error } = await sb
          .from('courses')
          .upsert(missing, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.error(`courses placeholders: ${error.message}`);
          failures += 1;
        } else {
          console.log(`courses: ${missing.length} placeholder(s) creado(s) para FK`);
        }
      }
    }
  }
}

for (const { file, table, pk } of MAPPINGS) {
  if (ONLY && !ONLY.has(file) && !ONLY.has(table)) continue;
  // En modo backup se omite courses por defecto: Supabase ya tiene el curso semilla.
  if (BACKUP && !ONLY && table === 'courses') {
    console.log('courses -> courses: omitido por defecto (usa --only=courses para forzar)');
    continue;
  }
  let rawRows;
  if (BACKUP) {
    const backupKey = file === 'users_private' ? 'usersPrivate' : file;
    rawRows = BACKUP.collections?.[backupKey];
    if (!rawRows) {
      console.log(`${file} -> ${table}: sin datos en el backup, omitido`);
      continue;
    }
  } else {
    const filePath = path.join(exportDir, `${file}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`${file} -> ${table}: sin export, omitido`);
      continue;
    }
    rawRows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  const rows = rawRows.map((row) => normalize(row, pk)).filter((row) => row[pk]);
  if (!rows.length) {
    console.log(`${file} -> ${table}: 0 filas, omitido`);
    continue;
  }

  if (!APPLY) {
    console.log(`[dry-run] ${file} -> ${table}: ${rows.length} fila(s) listas para upsert (pk=${pk})`);
    continue;
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await sb.from(table).upsert(chunk, { onConflict: pk });
    if (error) {
      console.error(`${table}: error en upsert -> ${error.message}`);
      failures += 1;
      break;
    }
    written += chunk.length;
  }
  if (written) console.log(`${file} -> ${table}: ${written} fila(s) migradas (upsert, sin borrado)`);
}

if (failures) {
  console.error(`Migration terminó con ${failures} error(es).`);
  process.exit(1);
}
console.log(APPLY ? 'Migración finalizada.' : 'Dry-run terminado. Usa --apply para escribir.');
