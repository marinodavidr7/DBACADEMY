# Acuerdo de Encargado de Tratamiento y Confidencialidad (DPA) — DB Academy

> **MARCO REGULATORIO APLICABLE:** Ley No. 172-13 sobre la Protección Integral de Datos Personales (normas sobre responsabilidad, seguridad, derechos de los titulares y transferencias internacionales), Constitución de la República Dominicana (art. 44) y Ley No. 126-02 (valor probatorio de los soportes electrónicos).
> **Versión oficial:** `v1.0-2026` · **Última actualización:** 25 de noviembre de 2026.
> *Nota de rigor:* Anexo B2B/institucional que se incorpora al contrato de servicio. Debe ser revisado por abogado dominicano colegiado y sus datos societarios confirmados por el titular antes de su suscripción.

---

**RESPONSABLE DEL TRATAMIENTO (el «Cliente»):** Institución, empresa o persona natural titular de los datos de estudiantes, instructores o usuarios finales cargados en la plataforma, según se identifique en el contrato de servicio que suscribe con DB Academy.

**ENCARGADO DEL TRATAMIENTO (el «Proveedor»):** **DB Academy, S.R.L. / David Batista**, RNC **1-32-84920-1**, con domicilio en Av. 27 de Febrero No. 492, Santo Domingo, Distrito Nacional, República Dominicana. Correo para asuntos de protección de datos: `privacidad@dbacademy.edu.do`.

## 1. Objeto
El Proveedor trata datos personales por cuenta y bajo las instrucciones documentadas del Cliente con el único fin de prestar el Servicio DB Academy / Cátedra LMS (cursos, inscripciones, evaluaciones, certificados, foros, tareas, pagos y soporte), sin determinar fines propios distintos de los contratados.

## 2. Instrucciones y límites
1. El Proveedor tratará los datos **solo** según las instrucciones documentadas del Cliente, en la medida necesaria para prestar el Servicio y cumplir obligaciones legales.
2. No los venderá, cederá, usará con fines publicitarios propios ni los combinará con datasets ajenos al Servicio.
3. Si considera que una instrucción infringe la Ley No. 172-13 u otra norma aplicable, lo notificará al Cliente antes de ejecutarla y podrá suspender la operación controvertida.

## 3. Confidencialidad
El Proveedor y su personal autorizado guardan confidencialidad de los datos y de la documentación del Cliente incluso después de terminada la relación. El acceso se limita por rol y por necesidad de conocimiento (*need-to-know*), con credenciales personales e intransferibles.

## 4. Acceso a datos del Cliente y bitácora
El Proveedor no accede a datos académicos, transaccionales o de contenido del Cliente salvo: (i) solicitud de soporte del Cliente; (ii) requerimiento legal; o (iii) necesidad de seguridad o mantenimiento. Todo acceso administrativo sensible se deja constancia en bitácora con identificador del operador, fecha y motivo, conservada conforme a la política de retención y puesta a disposición del Cliente cuando lo solicite. Los accesos a producción se limitan a personal designado y se revisan periódicamente (principio de mínimo privilegio).

## 5. Medidas de seguridad
El Proveedor aplica medidas técnicas y organizativas apropiadas al riesgo: cifrado TLS en tránsito, control de acceso por roles en Firebase/Firestore y Supabase, autenticación reforzada de cuentas administrativas, cifrado en el navegador de las notas personales del estudiante (E2EE), copias de seguridad cifradas con procedimiento de restauración probado, registro de eventos y revisión periódica de dependencias y configuraciones. Estas medidas se documentan y actualizan conforme al state técnico del servicio.

## 6. Subencargados autorizados
El Cliente autoriza expresamente, al aceptar este anexo, la intervención de los siguientes subencargados:

| Subencargado | Finalidad | País / región |
|---|---|---|
| Google Cloud Platform / Firebase (Google LLC) | Alojamiento, base de datos y autenticación | Estados Unidos |
| Vercel Inc. | Entrega de la aplicación y CDN | Estados Unidos |
| Lemon Squeezy / Stripe / PayPal / Mercado Pago | Procesamiento de pagos (según pasarela contratada) | Estados Unidos / Unión Europea / Latinoamérica |
| Google Gemini API (opcional) | Asistencia pedagógica automatizada, sin datos de identidad asociados | Estados Unidos |
| Proveedor de correo electrónico transaccional configurado para la cuenta | Notificaciones del servicio | Según proveedor |

El Proveedor notificará al Cliente con al menos **quince (15) días calendario** de anticipación la incorporación o sustitución de subencargados relevantes. El Cliente podrá objetar por causa justificada dentro de ese plazo; de no existir una alternativa razonable, cualquiera de las partes podrá resolver la prestación afectada sin penalidad. El Proveedor impondrá a los subencargados obligaciones de confidencialidad y seguridad equivalentes a las de este acuerdo.

## 7. Transferencias internacionales
Los datos podrán transferirse a los países indicados en la tabla anterior cuando sea necesario para prestar el Servicio, con fundamento en las instrucciones del Cliente, en el consentimiento informado del titular cuando aplique y en las garantías contractuales y de seguridad descritas en la Política de Privacidad (sección 5). El Proveedor exigirá a sus subencargados compromisos de protección acordes con la Ley No. 172-13 y reportará al Cliente cualquier cambio relevante en el marco jurídico aplicable a la transferencia.

## 8. Derechos de los titulares (ARCO)
El Proveedor asistirá al Cliente, con diligencia y sin costo adicional, en la atención de solicitudes de acceso, rectificación, cancelación y oposición. Las solicitudes que reciba directamente las reenviará al Cliente dentro de los **tres (3) días hábiles** y se abstendrá de resolverlas por su cuenta salvo instrucción o requerimiento legal. El Portal ARCO del Centro Legal y el correo `privacidad@dbacademy.edu.do` constituyen canales de recepción.

## 9. Incidentes de seguridad
El Proveedor notificará al Cliente **sin demora injustificada y, como objetivo, dentro de las cuarenta y ocho (48) horas** posteriores a la confirmación de un incidente que pueda afectar datos del Cliente, comunicando naturaleza del hecho, categorías y número aproximado de registros afectados, impacto estimado, medidas adoptadas y puntos de contacto. Colaborará en la investigación y en las notificaciones que el Cliente deba realizar a las autoridades o a los titulares. No se realizarán comunicaciones públicas en nombre del Cliente sin su autorización, salvo obligación legal.

## 10. Devolución y eliminación
Al término del contrato, el Cliente podrá exportar sus datos en formato estructurado durante **treinta (30) días calendario**. Vencido ese plazo, el Proveedor eliminará o anonimizará los datos de manera irreversible, salvo la conservación mínima exigida por normas fiscales, contables o judiciales. A solicitud del Cliente emitirá confirmación escrita de la eliminación.

## 11. Auditorías y vigencia
El Proveedor facilitará, previa notificación con diez (10) días laborables de anticipación y sin interrumpir el servicio, la información razonable necesaria para verificar el cumplimiento de este anexo, respetando la confidencialidad de terceros. El acuerdo vigora mientras dure la prestación del Servicio y subsista cualquier obligación de confidencialidad, seguridad o retención legal.

## 12. Aceptación
La aceptación se registra electrónicamente en la bitácora de consentimientos del Centro Legal, con versión del documento (`v1.0-2026`), sello de tiempo, agente de usuario y, cuando esté disponible, identificación del aceptante, de conformidad con la Ley No. 126-02. Se recomienda además la suscripción de un ejemplar firmado para operaciones B2B o institucionales.

---
**Por el Cliente:** ____________________________ · RNC/Cédula: ____________________ · Fecha: __________

**Por DB Academy:** __________________________ · RNC: 1-32-84920-1 · Fecha: __________
