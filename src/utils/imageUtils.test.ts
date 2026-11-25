import { describe, it, expect } from 'vitest';
import {
  extraerGoogleDriveId,
  esGoogleDriveUrl,
  normalizarUrlImagen,
  validateAndFormatImageUrl,
} from './imageUtils';

describe('Normalización de imágenes de Google Drive', () => {
  it('extrae ID desde /file/d/<ID>/view', () => {
    const id = extraerGoogleDriveId(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/view?usp=sharing'
    );
    expect(id).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
  });

  it('extrae ID desde open?id=<ID>', () => {
    const id = extraerGoogleDriveId(
      'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
    );
    expect(id).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
  });

  it('extrae ID desde lh3.googleusercontent.com/d/<ID>', () => {
    const id = extraerGoogleDriveId(
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
    );
    expect(id).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890');
  });

  it('detecta URLs de Drive y no falsas positivas', () => {
    expect(esGoogleDriveUrl('https://drive.google.com/file/d/abc123/view')).toBe(true);
    expect(esGoogleDriveUrl('https://lh3.googleusercontent.com/d/abc123')).toBe(true);
    expect(esGoogleDriveUrl('https://images.unsplash.com/photo-123?w=600')).toBe(false);
  });

  it('convierte enlace compartido a CDN directo', () => {
    const result = normalizarUrlImagen(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/view?usp=sharing'
    );
    expect(result).toBe(
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
    );
  });

  it('es idempotente', () => {
    const direct = 'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890';
    expect(normalizarUrlImagen(direct)).toBe(direct);
  });

  it('no modifica URLs externas', () => {
    const unsplash =
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
    expect(normalizarUrlImagen(unsplash)).toBe(unsplash);
  });

  it('maneja entradas vacías/nulas', () => {
    expect(normalizarUrlImagen(null)).toBe('');
    expect(normalizarUrlImagen(undefined)).toBe('');
    expect(normalizarUrlImagen('')).toBe('');
  });

  it('validateAndFormatImageUrl normaliza Drive', () => {
    const result = validateAndFormatImageUrl(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/view'
    );
    expect(result.valid).toBe(true);
    expect(result.url).toBe(
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'
    );
  });

  it('normaliza Dropbox a raw=1', () => {
    expect(normalizarUrlImagen('https://www.dropbox.com/s/abc/file.png?dl=0')).toBe(
      'https://www.dropbox.com/s/abc/file.png?raw=1'
    );
  });
});
