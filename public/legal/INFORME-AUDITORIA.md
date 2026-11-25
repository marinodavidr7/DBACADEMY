# Informe de cumplimiento legal — DB Academy (Cátedra LMS) — 2026-11-25

> **Actualización de cierre del módulo legal (25-nov-2026):** los seis documentos en `legal/` pasan de borrador a versión oficial, se sincronizan en `public/legal/`, se registran con hash SHA-256 real, se auto-hospedan las fuentes y se completan los flujos de consentimiento, ARCO, cookies y takedown en la aplicación. Quedan como responsabilidad del titular la verificación de los datos societarios y la revisión final por abogado dominicano colegiado y contador.

> **Aviso:** Este informe es una auditoría técnica y no constituye asesoría legal. Los borradores y controles deben ser revisados por un abogado dominicano antes de publicarse o considerarse válidos.

## Resumen
- 🔴 6 críticos · 🟠 8 altos · 🟡 5 medios
- Estado general (25-nov-2026): **Riesgo medio, pendiente de validación formal**. Los textos legales y los flujos básicos de consentimiento, derechos ARCO, cookies y retiro de contenido ya están documentados e implementados; subsisten (i) la verificación de la identidad registral del operador, (ii) el espejo servidor de la evidencia de consentimiento y (iii) el visto bueno profesional y fiscal.

## Contexto asumido (completar)
- Operador (datos propuestos en los documentos, **pendientes de confirmación registral**): DB Academy, S.R.L. / David Batista, RNC 1-32-84920-1, Av. 27 de Febrero No. 492, Santo Domingo, Distrito Nacional. Correos: `contacto@`, `privacidad@`, `soporte@`, `legal@`, `pagos@` y `seguridad@dbacademy.edu.do`. Verificar RNC y domicilio ante DGII/Registro Mercantil antes de publicar.
- Jurisdicción objetivo: República Dominicana. `[VERIFICAR CON ABOGADO]` si hay usuarios/pagos desde otros países (UE/RGPD, EE.UU., etc.).
- Modelo: LMS SaaS (cursos, inscripciones, pagos, certificados, foros, calendario, tareas, notas E2EE, panel admin).
- Datos tratados: cuenta (nombre, email, foto, UID), perfil/preferencias, progreso, pagos, certificados, envíos de tareas, foros, eventos de calendario, notas cifradas E2EE, API keys/webhooks, gift cards/cupones.
- Terceros documentados: Google Cloud/Firebase (Auth, Firestore), Vercel (CDN/hosting), Lemon Squeezy, Stripe, Mercado Pago y PayPal (pagos), Gemini API opcional en backend (`GEMINI_API_KEY`), proveedor de correo transaccional. Las fuentes ya no se cargan desde Google: se sirven desde `/fonts/`. Pendiente: confirmar con el titular la lista real de proveedores y países antes de la publicación comercial.

## Hallazgos

| # | Severidad | Hallazgo | Dónde | Riesgo | Acción / estado |
|---|-----------|----------|-------|--------|-----------------|
| 1 | 🔴 | No hay Términos y Condiciones, Política de Privacidad ni Política de Cookies publicados/enlazados en la app. | `src/App.tsx`, `src/components/LandingPage.tsx`, sin rutas/vistas legales | Incumplimiento de deberes de información; mayor exposición ante reclamos (Ley 172-13, Ley 358-05). | Documentos finalizados en `legal/` y publicados en `public/legal/`; enlazados en landing, checkout y Centro Legal. Pendiente: validación por abogado dominicano y confirmación de datos del operador. |
| 2 | 🔴 | No existe aceptación de términos/privacidad con casilla no premarcada ni evidencia de consentimiento (versión, hash, fecha, IP, user-agent). | Flujo de login Google/Firebase (`src/context/PlatformContext.tsx`, `src/firebase.ts`) | Consentimiento no demostrable; difícil defensa ante reclamo. | Registro implementado con versión, hash SHA-256 real del documento, sello de tiempo ISO y user-agent (`legalConsentService.ts`); gate de aceptación en checkout y registro manual en el Centro Legal. Limitación: la dirección IP no se obtiene en el navegador; requiere captura servidor. La bitácora se guarda en `localStorage` del dispositivo. |
| 3 | 🔴 | No hay banner/gestión de cookies/tecnologías similares. Se usan `localStorage` y Google Fonts externos. | `index.html`, `src/App.tsx`, `src/context/PlatformContext.tsx` | Falta de información/consentimiento para tecnologías no esenciales; Google Fonts puede implicar transferencia a terceros. | Política v1.1-2026 publicada; banner con decisión granular y registro versionado; fuentes auto-hospedadas en `/fonts/`, sin solicitudes a Google antes del consentimiento. |
| 4 | 🔴 | No hay canal de derechos ARCO (acceso, rectificación, cancelación, oposición) ni flujo de exportar/borrar datos del titular. | App/UI; no hay vista/formulario/proceso | Riesgo por imposibilidad de ejercer derechos (Constitución art. 44, Ley 172-13). | Portal ARCO operativo con número de radicado, plazo real de 10 días laborables y exportación JSON de los datos locales; el expediente completo y la supresión se gestionan por `privacidad@dbacademy.edu.do`. |
| 5 | 🔴 | Promesas sensibles de privacidad/seguridad/certificación deben verificarse contra implementación real. | `index.html` meta "cifrado E2EE"; `LandingPage.tsx` menciona "100% privado", AES-GCM-256, SHA-256, certificados verificables; `CheckoutModal`/pagos | Publicidad potencialmente engañosa si no es totalmente cierta (Ley 358-05). | Meta del sitio matizada a «notas personales cifradas E2EE»; sin claims absolutos de privacidad total en la landing vigente. Mantener verificación técnica antes de campañas que citen AES-256 o certificados. |
| 6 | 🔴 | Acceso admin a datos de estudiantes/inscripciones/pagos sin bitácora de auditoría visible para acciones sensibles. | `InstructorDashboard.tsx`, `StudentManagement.tsx`, `PlatformContext.tsx`, reglas Firestore admin | Riesgo de acceso no autorizado/abuso interno; conflicto con expectativas de privacidad. | Principio de mínimo privilegio aplicado en reglas de acceso; pendiente de bitácora inmutable centralizada para accesos administrativos sensibles (fuera del alcance del módulo legal). |
| 7 | 🟠 | No se observa política/lista visible de terceros, países y transferencias internacionales. | Privacidad/UI inexistente; Firebase/Google Fonts/pasarelas/AI | Falta de transparencia y base para transferencia internacional (Ley 172-13). | Sección 5 de la privacidad y cláusulas 6 y 7 del DPA documentan proveedores y países; pendiente confirmar la lista real con el titular. |
| 8 | 🟠 | No hay gestión de consentimiento de marketing separado ni mecanismo de baja. No se observó módulo de newsletter, pero puede existir a futuro. | No hay UI/BD de preferencias marketing | Riesgo si se envían comunicaciones comerciales sin consentimiento/baja (Ley 310-14). | Opt-in comercial independiente implementado en el Centro Legal y en las preferencias de cookies; pendiente canal de baja masiva antes de iniciar campañas (Ley 310-14). |
| 9 | 🟠 | Pagos/suscripciones: falta información clara pre-pago sobre impuestos, renovación, cancelación, reembolsos, prueba gratuita. | `CheckoutModal.tsx`, flujo de pagos | Riesgo de reclamo por consumidor (Ley 358-05). | Política v1.1-2026 publicada; casilla de aceptación no premarcada en checkout y evidencia registrada al perfeccionarse la compra. |
| 10 | 🟠 | No hay política de retención/eliminación tras baja ni procedimiento de brechas. | No documentado | Riesgo operativo/legal ante incidentes o solicitudes. | Sección 10 de la privacidad y cláusula 9 del DPA documentan notificación y respuesta; pendiente protocolo operativo interno y prueba de restauración de respaldos. |
| 11 | 🟠 | Datos de "comensales/clientes finales" no aplican directamente como restaurante, pero sí hay datos de estudiantes/usuarios finales; falta definir roles responsable/encargado donde aplique (p. ej. empresas/clientes B2B). | Modelo de datos | Ambigüedad en responsabilidades de tratamiento. | Definir en Términos/Privacidad/DPA según modelo comercial real. |
| 12 | 🟠 | Falta política de uso aceptable y retiro de contenido para foros/tareas/contenidos subidos. | Foros, tareas, materiales | Riesgo por contenido ilícito/infractor. | Política v1.0-2026 con plazos y contranotificación; formulario de reporte operativo en el Centro Legal. |
| 13 | 🟠 | Verificación fiscal DGII e-CF no documentada en el producto/proceso. | Facturación/pagos | Riesgo fiscal/administrativo (Ley 32-23). | Marcar para contador. |
| 14 | 🟠 | Controles de seguridad visibles parcialmente: Firebase Auth/Rules, pero faltan evidencias de backups probados, 2FA, plan de brechas, bitácora inmutable. | `firestore.rules`, app | Riesgo ante incidente de seguridad. | Documentar controles existentes; implementar faltantes. |
| 15 | 🟡 | Google Fonts se carga desde terceros antes de cualquier consentimiento. | `index.html` | Transferencia de IP/datos técnicos a Google. | Resuelto: `public/fonts/` sirve las tipografías desde el propio dominio; se eliminaron los enlaces a Google Fonts. |
| 16 | 🟡 | Falta identificación visible del operador (razón social, RNC, domicilio, contacto). | Footer/landing/legal | Menor transparencia. | Datos del operador incluidos en todos los documentos y en el Centro Legal; pendiente confirmación registral por el titular. |
| 17 | 🟡 | Versionado de documentos legales y registro de aceptación no implementado. | N/A | Dificulta probar aceptación vigente. | Versiones, hashes SHA-256 reales y bitácora de consentimientos implementados; pendiente espejo en servidor para reforzar valor probatorio. |
| 18 | 🟡 | Falta política de licencias de recursos (imágenes, iconos, fuentes, contenido de cursos). | Assets/contenido | Riesgo de propiedad intelectual. | Revisar licencias y documentar. |
| 19 | 🟡 | Accesibilidad legal: textos deben ser claros en español; algunos flujos tienen textos duros/hardcoded. | UI/i18n | Riesgo menor de claridad. | Normalizar textos legales y lenguaje claro. |

## Cambios aplicados

- `legal/INFORME-AUDITORIA.md`: este informe.
- `legal/TERMINOS-Y-CONDICIONES.md`: términos y condiciones v1.2-2026 (contrato de adhesión, pagos, PI, jurisdicción).
- `legal/POLITICA-DE-PRIVACIDAD.md`: privacidad v1.2-2026 (bases legales, destinatarios, ARCO, brechas, conservación).
- `legal/POLITICA-DE-COOKIES.md`: cookies v1.1-2026 (categorías, consentimiento previo, revocación).
- `legal/ACUERDO-ENCARGADO-TRATAMIENTO.md`: DPA v1.0-2026 (instrucciones, subencargados, 48 h de brecha, exportación).
- `legal/POLITICA-CANCELACION-REEMBOLSOS.md`: cancelación y reembolsos v1.1-2026 (garantía de 7 días, plazos).
- `legal/POLITICA-USO-ACEPTABLE.md`: uso aceptable v1.0-2026 (takedown con plazos y contranotificación).
- `src/components/LegalCenterView.tsx`: Centro Legal con documentos, consentimiento, ARCO, cookies, takedown y bitácora (no sustituye la publicación legal revisada).
- `src/components/CookieBanner.tsx`: banner mínimo de cookies/almacenamiento local con registro versionado en `localStorage` (`dba_cookie_consent_v1`).
- `src/App.tsx`, `src/types.ts`: ruta/vista `legal` accesible desde la app; banner de cookies en landing y shell autenticado.
- `src/components/LandingPage.tsx`: enlaces a Términos, Privacidad y Cookies en footer.
- `public/legal/*.md`: copias públicas sincronizadas de los documentos finales.
- `public/fonts/`, `index.html`: fuentes auto-hospedadas, sin peticiones a terceros previas al consentimiento.
- `src/services/legalConsentService.ts`: hashes SHA-256 reales, plazo ARCO de 10 días laborables, categorías opcionales desactivadas por defecto, exportación de datos y eliminación de registros de muestra.
- `src/components/CookieBanner.tsx`, `src/components/LegalCenterView.tsx`, `src/components/CheckoutModal.tsx`: banner unificado, exportación ARCO y consentimiento registrado al perfeccionarse el pago.

## Decisiones del dueño

- [ ] **Confirmar** la identidad del operador (razón social/nombre, RNC, domicilio, correos) usada en los documentos: los valores actuales son propuesta del borrador y deben cotejarse con el Registro Mercantil y DGII.
- [x] Modelo cubierto: B2C (términos, consumidor) y B2B/institucional (DPA). Pendiente confirmar clientes fuera de RD para evaluar RGPD u otras jurisdicciones.
- [ ] Confirmar proveedores reales (hosting, Firebase proyecto, pagos, correo, analítica, AI, almacenamiento, mensajería).
- [x] Política de cancelación/reembolsos v1.1-2026 definida y enlazada en checkout.
- [ ] Definir retención de datos y procedimiento de brechas.
- [x] Fuentes auto-hospedadas y banner de consentimiento implementados.

## Para revisión de abogado dominicano

- [ ] Revisar y adaptar los seis documentos en `legal/` (ya no son borradores) antes de su publicación comercial definitiva.
- [ ] Validar base legal de consentimiento/contrato para cada tratamiento (Ley 172-13).
- [ ] Validar cláusulas de términos (limitación de responsabilidad, jurisdicción, cancelación, retracto/ventas a distancia si aplica, Ley 358-05).
- [ ] Validar transferencias internacionales y DPA con proveedores.
- [ ] Validar cumplimiento de Ley 310-14 antes de cualquier envío comercial.
- [ ] Validar propiedad intelectual/licencias de contenido y procedimiento de retiro (Ley 65-00/20-00, `[VERIFICAR CON ABOGADO]`).
- [ ] Validar validez de aceptación electrónica/firma digital según normativa aplicable `[VERIFICAR CON ABOGADO]`.

## Para revisión del contador

- [ ] Confirmar categoría DGII y obligación/calendario e-CF (Ley 32-23, aviso DGII; Pequeños/Micros/No Clasificados: 15-nov-2026 según matriz consultada).
- [ ] Confirmar tratamiento fiscal de ingresos por Stripe/Mercado Pago/PayPal/gift cards y cualquier Merchant of Record.
- [ ] Confirmar forma de mostrar precios/impuestos (ITBIS incluido o aclarado) en RD.

**Aviso final:** Este informe no constituye asesoría legal.