/**
 * Registro único de documentos legales de DB Academy.
 * Se usa tanto en el servidor (MIME UTF-8 de los .md) como en la app (visor web),
 * para que slugs, archivos y metadatos nunca se desincronicen.
 */

export type LegalDocSlug =
  | 'terminos'
  | 'privacidad'
  | 'cookies'
  | 'reembolsos'
  | 'uso-aceptable'
  | 'dpa'
  | 'auditoria';

export interface LegalDocumentMeta {
  slug: LegalDocSlug;
  file: string;
  title: string;
  version: string;
  lawRef: string;
  description: string;
}

export const LEGAL_DOCUMENTS: readonly LegalDocumentMeta[] = [
  {
    slug: 'terminos',
    file: 'TERMINOS-Y-CONDICIONES.md',
    title: 'Términos y Condiciones de Uso',
    version: 'v1.2-2026',
    lawRef: 'Ley 358-05 · Ley 126-02 · Ley 172-13',
    description: 'Contrato de adhesión, pagos, propiedad intelectual y jurisdicción en RD.',
  },
  {
    slug: 'privacidad',
    file: 'POLITICA-DE-PRIVACIDAD.md',
    title: 'Política de Privacidad',
    version: 'v1.2-2026',
    lawRef: 'Constitución art. 44 · Ley 172-13',
    description: 'Datos tratados, finalidades, transferencias, conservación y derechos ARCO.',
  },
  {
    slug: 'cookies',
    file: 'POLITICA-DE-COOKIES.md',
    title: 'Política de Cookies',
    version: 'v1.1-2026',
    lawRef: 'Ley 172-13 · Ley 53-07 · Ley 310-14',
    description: 'Categorías de cookies, consentimiento previo, revocación y recursos de terceros.',
  },
  {
    slug: 'reembolsos',
    file: 'POLITICA-CANCELACION-REEMBOLSOS.md',
    title: 'Cancelación y Reembolsos',
    version: 'v1.1-2026',
    lawRef: 'Ley 358-05',
    description: 'Garantía de satisfacción, exclusiones y plazos de acreditación.',
  },
  {
    slug: 'uso-aceptable',
    file: 'POLITICA-USO-ACEPTABLE.md',
    title: 'Uso Aceptable y Retiro de Contenido',
    version: 'v1.0-2026',
    lawRef: 'Ley 65-00 · Ley 20-00 · Ley 53-07',
    description: 'Conducta en foros/tareas y procedimiento de notificación y retiro.',
  },
  {
    slug: 'dpa',
    file: 'ACUERDO-ENCARGADO-TRATAMIENTO.md',
    title: 'Acuerdo de Encargado de Tratamiento (DPA)',
    version: 'v1.0-2026',
    lawRef: 'Ley 172-13 · Ley 126-02',
    description: 'Anexo B2B de instrucciones, subencargados, seguridad y transferencias.',
  },
  {
    slug: 'auditoria',
    file: 'INFORME-AUDITORIA.md',
    title: 'Informe de Auditoría Legal-Técnica',
    version: '25-nov-2026',
    lawRef: 'Auditoría interna',
    description: 'Hallazgos, matriz de riesgos y puntos de revisión profesional.',
  },
];

export const getLegalDocumentBySlug = (slug?: string | null): LegalDocumentMeta | undefined =>
  LEGAL_DOCUMENTS.find((doc) => doc.slug === slug);

export const getLegalDocumentByFile = (file?: string | null): LegalDocumentMeta | undefined =>
  LEGAL_DOCUMENTS.find((doc) => doc.file.toLowerCase() === String(file || '').toLowerCase());

/** Ruta legible del visor: /legal/<slug> (acepta ?from=legal para volver al Centro Legal). */
export function legalDocumentPath(slug: LegalDocSlug, options: { from?: string } = {}): string {
  const base = `/legal/${slug}`;
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** Ruta del archivo Markdown sin procesar (usada por el visor y el botón Descargar .md). */
export const legalMarkdownPath = (file: string): string => `/legal/${encodeURIComponent(file)}`;

export const LEGAL_DOCUMENT_EVENT = 'dba_legal_document_change';

/** Detecta el documento solicitado por ruta limpia (/legal/slug) o query param (?legal=slug). */
export function getLegalDocSlugFromLocation(): LegalDocSlug | null {
  if (typeof window === 'undefined') return null;
  const querySlug = new URLSearchParams(window.location.search).get('legal');
  if (querySlug && getLegalDocumentBySlug(querySlug)) return querySlug as LegalDocSlug;
  const match = window.location.pathname.match(/^\/legal\/([a-z0-9-]+)\/?$/i);
  const pathSlug = match?.[1]?.toLowerCase();
  return pathSlug && getLegalDocumentBySlug(pathSlug) ? (pathSlug as LegalDocSlug) : null;
}

/** Navegación interna dentro del visor, conservando el origen cuando existe. */
export function navigateToLegalDocument(slug: LegalDocSlug | null): void {
  if (typeof window === 'undefined') return;
  const from = new URLSearchParams(window.location.search).get('from');
  const url = slug ? legalDocumentPath(slug, { from: from || undefined }) : from ? `/?view=${encodeURIComponent(from)}` : '/';
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event(LEGAL_DOCUMENT_EVENT));
  window.scrollTo({ top: 0, behavior: 'auto' });
}
