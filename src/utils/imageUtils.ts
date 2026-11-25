/**
 * Utilidades para normalización de URLs de imágenes.
 * Convierte enlaces compartidos de Google Drive a URLs directas renderizables en <img>.
 * También normaliza enlaces de Dropbox a raw=1.
 */

/** Extrae el ID de archivo de Google Drive desde variantes comunes de URL compartida. */
export function extraerGoogleDriveId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // /file/d/{id}/view|preview|edit...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch?.[1]) return fileDMatch[1];

  // ?id={id} o &id={id} (open?id=..., uc?id=..., thumbnail?id=...)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  // lh3.googleusercontent.com/d/{id}
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match?.[1]) return lh3Match[1];

  return null;
}

/** Verifica si la URL pertenece a Google Drive / CDN de Drive. */
export function esGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com\/d\//i.test(url);
}

/**
 * Normaliza una URL de imagen para que sea renderizable en <img>.
 * - Google Drive -> https://lh3.googleusercontent.com/d/<ID>
 * - Dropbox -> raw=1
 * - Otras URLs -> se devuelven sin cambios
 */
export function normalizarUrlImagen(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (esGoogleDriveUrl(trimmed)) {
    const driveId = extraerGoogleDriveId(trimmed);
    if (driveId) return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) return trimmed.replace('dl=0', 'raw=1');
    if (!trimmed.includes('raw=1')) {
      return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
    }
  }

  return trimmed;
}

/** Validador simple para inputs de imagen: normaliza URLs http(s) y acepta vacío. */
export function validateAndFormatImageUrl(
  input: string
): { valid: boolean; url: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true, url: '' };
  if (/^https?:\/\//i.test(trimmed)) {
    return { valid: true, url: normalizarUrlImagen(trimmed) };
  }
  return { valid: false, url: '', error: 'Ingresa una URL http(s) válida.' };
}
