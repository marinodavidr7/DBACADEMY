<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a72dae13-bd70-4e6d-ac84-49c7c4803e6b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Server environment (admin writes)

El backend (`server.ts`) necesita `SUPABASE_URL` y una clave de servicio:
`SUPABASE_SECRET_KEY` (formato nuevo `sb_secret_...`) o `SUPABASE_SERVICE_KEY`
(legacy `service_role`). Se usan para escrituras de administrador (guardar cursos,
cupones, etc.). En local se leen desde `.env.local` (o `.env`); en producción deben
inyectarse como secretos del hosting y reiniciar el servicio. **Nunca** usar el
prefijo `VITE_` ni exponer la clave de servicio al frontend.

El navegador usa `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (nuevo) o
`VITE_SUPABASE_ANON_KEY` (legacy). `SUPABASE_JWKS_URL` no es necesaria: la
autenticación de la app verifica tokens de Firebase con los certificados de Google.

Para comprobar la configuración sin revelar secretos:

```bash
curl http://localhost:3000/api/v1/health
# "supabaseAdminConfigured": true
```

Las variables del navegador (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) son
independientes y no habilitan escrituras admin por RLS.
