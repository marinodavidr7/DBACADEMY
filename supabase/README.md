# DBACADEMY — Migración a Supabase

Migración planificada de la base de datos del proyecto **DBACADEMY** (actualmente Firestore) a **Supabase (Postgres)**.

## Status

- ✅ `migrations/0001_dbacademy_schema.sql` — schema completo (20 tablas).
- ✅ `migrations/0002_seed_courses.sql` — seed de la colección Firestore `courses` (generado desde `src/data/seedCourses.ts` con `tsx`).
- ✅ `migrations/0003_dbacademy_rls.sql` — RLS + policies (`public` anon/authenticated read, `service_role` all) + índices.

## Env var requerida más adelante (server.ts)

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — segundo ejemplo: `SUPABASE_SERVICE_KEY` (no impreso: echo "$SUPABASE_SERVICE_KEY").

## Cómo aplicar

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia o ejecuta los archivos de `migrations/` (por ejemplo, con `supabase db push` si configuras el CLI, o pegando en el editor de SQL del dashboard).
3. Opcional: actualiza `created_at`/`updated_at` con `UPDATE courses SET created_at = now() WHERE created_at IS NULL;`.

## Migrar datos reales de Firestore (gift cards, alumnos, etc.)

Los datos de producción siguen en Firestore; el deploy de código no los mueve.
Para traerlos a Supabase **sin borrar lo que ya existe**:

1. En Firebase Console → *Project Settings → Service Accounts → Generate new private key*.
   Guarda el JSON como `secrets/firebase-service-account.json` (carpeta ignorada por git).
2. Exporta Firestore:
   ```bash
   node scripts/export-firestore.mjs
   ```
3. Revisa el dry-run y aplica el upsert:
   ```bash
   node scripts/migrate-firestore-export.mjs
   node scripts/migrate-firestore-export.mjs --apply
   ```
   Para migrar sólo alumnos y gift cards:
   ```bash
   node scripts/migrate-firestore-export.mjs --apply --only=users,users_private,giftCards,giftCardRedemptions
   ```
4. Verifica en el dashboard de Supabase que `users` y `gift_cards` ya tengan filas.

> El script usa **UPSERT por PK** (`uid` para users, `id` para el resto): es idempotente
> y **no ejecuta TRUNCATE**, a diferencia de `0002_seed_courses.sql`.

Si ya tienes un backup en un único JSON (formato `collections`), se puede importar directamente:

```bash
node scripts/migrate-firestore-export.mjs --backup=/ruta/backup.json --only=users,users_private,giftCards,giftCardRedemptions,enrollments,payments,certificates --apply
```

Cuando un registro referencia un curso que ya no está en el catálogo, el script crea un
placeholder con `published=false` (usando `ignoreDuplicates`) para no romper las FK,
sin sobrescribir el curso real.

## Lectura de gift cards desde el frontend

`gift_cards` y `gift_card_redemptions` tienen RLS **sólo para `service_role`**. El
adaptador (`src/lib/supabase/firestoreAdapter.ts`) enruta esas lecturas/escrituras
por el backend (`/api/admin/gift_cards`, `/api/gift-cards/:code`,
`/api/gift-card-redemptions`), que usa el cliente de servicio. **No se añadió una
política `SELECT` pública**: eso expondría los códigos a cualquier visitante.
Tras cambiar `server.ts` es necesario **redesplegar el servidor** para que el
frontend de producción vea las tarjetas.

## Wiring la app (progreso — paso 2 hecho, falta paso 3)

### 2. Cliente de datos → Supabase ✅ (hasta aquí)
- `src/lib/supabase/client.ts`: `getSupabaseClient()` (lazy; lanza si faltan vars en primera consulta).
- `src/lib/supabase/firestoreAdapter.ts`: adaptador Firestore→Supabase. Soporta `collection/doc/query/where/getDocs/getDoc/setDoc/updateDoc/deleteDoc/serverTimestamp/writeBatch/onSnapshot`; `toSnake` en writes (camelCase de Firestore → snake_case de Postgres), `snakeToCamel` en reads; `onSnapshot` por polling 1.5 s (v1).
- Imports cambiados a Supabase en `src/context/PlatformContext.tsx`, `src/components/ForumView.tsx`, `src/components/StudentManagement.tsx`, `src/components/CertificatesView.tsx`.
- Vars de cliente en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (consistentes con el resto del stack) — aceptados por `src/lib/supabase/client.ts` (también se leen `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` si están definidos).

### 3. Migración de datos Firestore → Supabase (opcional, pendiente)
Fue pedida, pero decidido quedarse con Firestore por datos — por si luego se quiere poner en paz:

- `scripts/export-firestore.mjs` — exporta colecciones de Firestore a JSON (requiere service account).
- `scripts/generate-firestore-seed.mjs` — genera `supabase/migrations/0004_seed_from_firestore.sql`.

Para ejecutarlos necesitas generar una clave de servicio en consola de Firebase (Service Accounts → Generate new private key).

### 4. Extender qué cubre el adaptador (pendiente)
- `server.ts`: reemplazar `firebase-admin` por cliente Supabase server-side (`SUPABASE_URL` + `SUPABASE_SERVICE_KEY`).
- Migrar datos existentes de Firestore → Supabase (exportar colecciones y bulk-insert).
- RLS + policies (migration 003).

### Notas operativas
- Mientras no se ponen las vars: el adaptador lanza `Falta configurar VITE_SUPABASE_URL...` en la primera consulta (la app sigue arrancando).
- Realtime (`onSnapshot` real con PostgREST streaming) — cambiar `window.setInterval` por `supabaseClient.channel('changes').on('postgres_changes', ...)` en v2.

## Puntos fuertes de la migración v1

- Modelado en tablas reales; arrays/objetos anidados como `JSONB` (migra al futuro a relaciones).
- `CHECK`s y índices para las tablas más críticas (enrollments, payments, certificates).
- `courses.modules` conserva la estructura original de Firestore (array de `CourseModule`).
- Wiring futuro del `server.ts` simple: la colección `settings` → tabla `settings` (ya incluida en 0001).

## Próximos pasos (para conectar la app)

1. Wire `src/firebase.ts` → cliente Supabase (`@supabase/supabase-js`), env: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
2. Rewrite `src/context/PlatformContext.tsx` contra Supabase (enrollments, progress, usuarios, etc.).
3. `server.ts`: reemplazar `firebase-admin` por `SUPABASE_SERVICE_KEY` (coupons, referral settings).
4. Exportar datos existentes de Firestore (ejemplo: `npx firestore-get-all --project dbacademy --collection courses > out.json`) y poblar las tablas vacías.
5. Migration 003: RLS + policies, migrate-timestamps.

## Resumen del mapeo de colecciones → tablas

| Firestore | Supabase |
|---|---|
| users | users |
| users/{uid}/private/info | users_private (FK uid, email único) |
| courses | courses |
| enrollments | enrollments (FK student_id, UNIQUE course_id+student_id) |
| payments | payments |
| certificates | certificates (FK courses, UNIQUE verification_code) |
| forumThreads | forum_threads |
| forumReplies | forum_replies |
| calendarEvents | calendar_events |
| encryptedNotes | encrypted_notes |
| apiKeys | api_keys |
| customExercises | custom_exercises |
| assignmentSubmissions | assignment_submissions |
| giftCards | gift_cards |
| giftCardRedemptions | gift_card_redemptions |
| coupons | coupons |
| couponRedemptions | coupon_redemptions |
| referrals | referrals |
| settings.referrals | referral_settings (singleton id='referrals') |
| test | (carpeta de pruebas, n/a) |
