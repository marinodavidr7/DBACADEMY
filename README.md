# DB Academy

Plataforma web de formación técnica/profesional (LMS) con catálogo de cursos, aprendizaje en tiempo real, pagos por PayPal, gift cards, certificados verificables y notas cifradas E2E.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion
- **Backend:** Node/Express (`server.ts`) + API Vercel (`api/index.mjs` generado en build)
- **Auth/Datos:** Firebase Auth + capa Firestore adaptada a Supabase (`src/lib/supabase/firestoreAdapter.ts`)
- **Base de datos/servicios:** Supabase (Postgres/Storage), Firebase Admin en servidor
- **Pagos:** PayPal (checkout y verificación server-side), gift cards
- **Certificados:** QR/verificación pública `/verificar/{codigo}`, PDF, hash SHA-256

## Requisitos

- Node.js 22+ recomendado
- npm
- Proyecto Firebase configurado
- Proyecto Supabase configurado
- Credenciales PayPal (sandbox/live según entorno)

## Desarrollo local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear `.env.local` (no se commitea; está ignorado por `.gitignore`).
3. Iniciar app en desarrollo:
   ```bash
   npm run dev
   ```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo (`tsx server.ts`) |
| `npm run build` | Build frontend + bundle API Vercel (`api/index.mjs`) |
| `npm run preview` | Preview de build Vite |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run test` | Vitest en modo watch |
| `npm run test:run` | Vitest una sola ejecución |
| `npm run clean` | Limpia artefactos de build |

## Variables de entorno

### Frontend (Vite, exponer solo `VITE_*` seguras)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (nuevo) o `VITE_SUPABASE_ANON_KEY` (legacy)
- `VITE_PAYPAL_CLIENT_ID`
- `VITE_DOP_TO_USD_RATE` (opcional, conversión DOP→USD para PayPal)
- `VITE_*` adicionales según integraciones habilitadas

### Backend (server/Vercel, **nunca** `VITE_`)

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (`sb_secret_...`) o `SUPABASE_SERVICE_KEY` (legacy service role)
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` (`sandbox` | `live`)
- `DOP_TO_USD_RATE` (opcional)
- Variables Firebase Admin / email / otros servicios según configuración de despliegue

> No exponer claves de servicio al frontend. `.env.local` debe permanecer fuera de git.

## Verificación de salud

```bash
curl http://localhost:3000/api/v1/health
# esperar: "supabaseAdminConfigured": true
```

## Rutas públicas relevantes

- `/` — landing/catálogo
- `/para-instructores` — página para instructores/academias
- `/verificar/{codigo}` — verificación pública de certificados
- `/legal/*` — documentos legales

## Arquitectura (resumen)

- `src/App.tsx`: shell de app, rutas públicas/vistas.
- `src/context/PlatformContext.tsx`: estado global, auth, cursos, pagos, inscripciones, certificados.
- `server.ts`: API Express, verificación PayPal, gift cards, webhooks/admin.
- `src/lib/supabase/firestoreAdapter.ts`: adaptador Firestore→Supabase.
- `src/components/`: vistas y UI por dominio.

## Riesgos técnicos conocidos

- `PlatformContext.tsx` y `server.ts` son monolitos; modularizar por dominio incrementalmente.
- Cobertura de tests limitada; priorizar flujos críticos: pagos verificados, gift cards, certificados, rutas públicas.
- Hay dependencias pesadas; auditar uso real antes de remover.
- Existen dos superficies de gift cards: `GiftCardStoreView` (app autenticada) y `GiftCardStoreSection` (landing pública). Mantener coherencia funcional/comercial.

## Despliegue

- Build: `npm run build`
- Vercel usa `vercel.json` (rewrites SPA/API, headers). Configurar env vars en Vercel y redeploy tras cambios.
