# Auditoría de Seguridad (Ciberseguridad) — DBACADEMY

- **Fecha**: 2026-11-26
- **Tipo**: Auditoría técnica de seguridad de aplicación (revisión estática + verificación de configuración en repo)
- **Alcance**: Frontend Vite/React, servidor Express (`server.ts`), Supabase (migraciones/RLS), Firebase Auth/Rules, configuración de despliegue (`vercel.json`), dependencias npm.
- **Limitaciones**: No se realizó pentest activo contra producción, no se revisó consola de Supabase/Firebase/Vercel en vivo, no se auditaron secretos fuera del repo, ni se ejecutó SAST/DAST comercial. Hallazgos basados en evidencia del código/configuración presente.

> Este documento es un informe técnico, no una certificación de seguridad.

## Resumen ejecutivo

| Severidad | Cantidad | Estado |
|---|---:|---|
| Crítica | 0 | - |
| Alta | 4 | 1 corregida, 2 mitigadas parcialmente, 1 mitigada con rollout gradual |
| Media | 7 | Mitigar en siguiente ciclo |
| Baja | 4 | Mejora continua / hardening |

**Riesgo global estimado: Medio.** Las 4 altas recibieron mitigación/corrección técnica; quedan tareas residuales (RLS por arquitectura Firebase+anon, CSP enforce, upgrades breaking de dependencias).

## Hallazgos

### H1 — RLS pública permite lectura amplia de `users` (exposición de datos)
- **Severidad**: Alta
- **Evidencia**: `supabase/migrations/0003_dbacademy_rls.sql` definía `public_read` y `authenticated_read_own_or_public` en `users` con `USING (true)`.
- **Impacto**: Exposición potencial de datos de perfil/enumeración de cuentas vía anon key.
- **Mitigación aplicada**: `supabase/migrations/0006_security_hardening.sql` crea vista `user_public_profiles` (sin email; email permanece en `users_private`), elimina políticas redundantes/amplias y deja política explícita. **Limitación residual**: el cliente usa Firebase Auth + Supabase anon key (sin `auth.uid()` Supabase), por lo que se mantiene SELECT anon en `users` para no romper la app; migrar a vista/endpoints server-side para cierre completo.
- **Estado**: Mitigado parcialmente.

### H2 — Ausencia de headers de seguridad de aplicación (CSP/HSTS/etc.)
- **Severidad**: Alta
- **Evidencia**: `vercel.json` solo tenía COOP/cache; `server.ts` no enviaba headers de seguridad.
- **Impacto**: Mayor superficie ante XSS, clickjacking, MIME sniffing, fuga de referrer.
- **Mitigación aplicada**: `vercel.json` y `server.ts` ahora envían `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `HSTS` y `Content-Security-Policy-Report-Only`; `server.ts` desactiva `x-powered-by`.
- **Estado**: Mitigado (CSP en Report-Only, ajustar según telemetría antes de forzar).

### H3 — Vulnerabilidades en dependencias de producción
- **Severidad**: Alta
- **Evidencia**: `npm audit --omit=dev` (2026-11-26): 16 vulnerabilidades (4 high, 12 moderate), incluyendo `@grpc/grpc-js`.
- **Impacto**: Exposición a CVEs conocidas.
- **Mitigación aplicada**: se añadió `overrides["@grpc/grpc-js"]="^1.14.7"` en `package.json` y se reinstalaron dependencias. Resultado: **13 vulnerabilidades (2 low, 11 moderate, 0 high)**.
- **Pendiente**: 11 moderate/2 low restantes requieren upgrades con breaking changes (firebase-admin/google-gax chain, workbox-build/glob/minimatch); planificar actualización con pruebas.
- **Estado**: Mitigado parcialmente (altas eliminadas).

### H4 — `requireAdmin` no exige `email_verified`
- **Severidad**: Alta
- **Evidencia**: `requireAdmin` usaba `verifyFirebaseTokenAny` y solo comparaba email.
- **Impacto**: Brecha de defensa en profundidad en autorización admin.
- **Mitigación aplicada**: `server.ts` ahora exige `auth.emailVerified === true` además de email admin autorizado en `requireAdmin`.
- **Estado**: Corregido.

### Medias
- **M1**: Sin `trust proxy`; IP/rate limit poco confiables detrás de proxy.
- **M2**: Rate limiting incompleto.
- **M3**: `express.json` límite `20mb`.
- **M4**: Superficie XSS residual por HTML enriquecido/iframes (DOMPurify mitiga).
- **M5**: `POST /api/legal/consent` sin autenticación (spam de bitácora).
- **M6**: Admin proxy sin validación de esquema por tabla/campos.
- **M7**: Controles anti-abuso insuficientes en rutas sensibles.

### Bajas
- **L1**: `dangerouslySetInnerHTML` estático innecesario.
- **L2**: Admin email hardcodeado.
- **L3**: Políticas RLS con `auth.uid()` inertes bajo Firebase Auth.
- **L4**: Observabilidad de seguridad incompleta.

## Controles positivos observados
- Verificación JWT Firebase con JWKS (`aud/iss/exp/iat/alg/kid`).
- Webhooks firmados (LemonSqueezy HMAC+timingSafeEqual, Stripe constructEvent).
- DOMPurify con allowlist.
- RLS habilitado; tablas sensibles sin acceso público amplio.
- Rate limit básico en cupones/consentimiento.
