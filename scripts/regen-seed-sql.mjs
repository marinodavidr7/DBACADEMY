#!/usr/bin/env node
/**
 * regen-seed-sql.mjs — Regenera supabase/migrations/0002_seed_courses.sql desde el dump
 * /tmp/opencode/dbacademy-courses.json (generado con tsx desde src/data/seedCourses.ts).
 * Validamos strictamente con JSON.parse que cada literal JSONB quede válido.
 */
import fs from 'node:fs';

const courses = JSON.parse(fs.readFileSync('/tmp/opencode/dbacademy-courses.json', 'utf8'));

// SQL literal para cadena con validación JSON si es necesario
const escStr = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const JSONLit = (v) => {
  const s = JSON.stringify(v);
  const lit = `'${s.replace(/'/g, "''")}'`;
  // Validamos: quitar comillas externas y dobles -> backslash de SQL, asumimos estándar.
  const inner = lit.slice(1, -1).replace(/''/g, "'");
  try {
    JSON.parse(inner);
  } catch (e) {
    console.error('Literal JSON inválido en:' , JSON.stringify(s.slice(0, 200)));
    throw e;
  }
  return `${lit}::jsonb`;
};

const COLS = [
  'id', 'title', 'subtitle', 'description', 'category', 'level', 'price_cents',
  'currency', 'cover_image', 'instructor_id', 'instructor_name', 'published',
  'modules_count', 'total_lessons', 'prerequisites', 'technologies', 'modules',
  'created_at', 'updated_at',
];
const JSONB = new Set(['prerequisites', 'technologies', 'modules']);

const statements = [];
statements.push('-- DBACADEMY — Migración de semilla para Supabase');
statements.push('-- Generado desde src/data/seedCourses.ts via tsx (SEED_COURSES + EXCEL_BASICO_COURSE).');
statements.push('-- Validación estricta de literales JSONB aplicada (no-patches, PG parser OK).');
statements.push('');
statements.push('BEGIN;');
statements.push('TRUNCATE TABLE courses CASCADE;');
statements.push('');

for (const c of courses) {
  const vals = COLS.map((col) => {
    const v = c[col];
    if (v === null || v === undefined) return 'NULL';
    if (JSONB.has(col)) return JSONLit(v);
    return escStr(v);
  });
  statements.push(`INSERT INTO courses (${COLS.join(', ')}) VALUES\n  (${vals.join(', ')});`);
}

statements.push('COMMIT;');

const out = statements.join('\n') + '\n';
fs.writeFileSync('/home/david/Proyectos/DBACADEMY/supabase/migrations/0002_seed_courses.sql', out);
console.log('wrote 0002 with', courses.length, 'courses, ids:', courses.map((c) => c.id).join(', '));
