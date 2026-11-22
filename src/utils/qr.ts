import QRCode from 'qrcode';
import type { Certificate } from '../types';

const SAMPLE_CERT_IDS = new Set([
  'cert_admin_preview',
  'cert_preview_admin',
  'DB-EXCEL-PREVIEW01',
]);

export function isSampleCertificateId(idOrCode?: string | null): boolean {
  if (!idOrCode) return false;
  return SAMPLE_CERT_IDS.has(idOrCode.trim());
}

export function getCertificateVerificationUrl(cert: Pick<Certificate, 'id' | 'verificationCode'>): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://dbacademy.vercel.app';
  const token = cert.id || cert.verificationCode;
  return `${origin}/?verify=${encodeURIComponent(token)}`;
}

const qrCache = new Map<string, string>();

export async function generateCertificateQrDataUrl(
  cert: Pick<Certificate, 'id' | 'verificationCode'>,
  sizePx = 240
): Promise<string> {
  const url = getCertificateVerificationUrl(cert);
  const cacheKey = `${url}|${sizePx}`;
  const cached = qrCache.get(cacheKey);
  if (cached) return cached;

  const dataUrl = await QRCode.toDataURL(url, {
    width: sizePx,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
  qrCache.set(cacheKey, dataUrl);
  return dataUrl;
}
