import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { CalendarEvent, Certificate } from '../types';
import { CertificateDocumentCard } from '../components/CertificatePreviewModal';

const LOGO_LIGHT_PATH = '/assets/aistudio/logo-db-academy-light.png';
const LOGO_DARK_PATH = '/assets/aistudio/logo-db-academy-dark.png';

interface LoadedLogoAsset {
  dataUrl: string;
  width: number;
  height: number;
}

const logoCache = new Map<string, LoadedLogoAsset>();

async function loadLogoAsset(src: string): Promise<LoadedLogoAsset | null> {
  const cached = logoCache.get(src);
  if (cached) return cached;
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png');
        const asset = { dataUrl, width: w, height: h };
        logoCache.set(src, asset);
        resolve(asset);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function formatCertificateDate(issuedAt?: unknown): string {
  const format = (date: Date) =>
    date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  if (!issuedAt) return format(new Date());

  if (issuedAt instanceof Date) {
    return Number.isNaN(issuedAt.getTime()) ? format(new Date()) : format(issuedAt);
  }

  if (typeof issuedAt === 'object' && issuedAt !== null) {
    const maybeTs = issuedAt as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTs.toDate === 'function') {
      const d = maybeTs.toDate();
      return Number.isNaN(d.getTime()) ? format(new Date()) : format(d);
    }
    if (typeof maybeTs.seconds === 'number') {
      return format(new Date(maybeTs.seconds * 1000));
    }
  }

  if (typeof issuedAt === 'string' || typeof issuedAt === 'number') {
    const parsed = new Date(issuedAt);
    if (!Number.isNaN(parsed.getTime())) return format(parsed);
    return String(issuedAt);
  }

  return format(new Date());
}

export function exportToCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvLines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
  const blob = new Blob(['\ufeff' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export async function exportTableToPdf(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFillColor(7, 14, 29);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 76, 'F');

  const darkLogo = await loadLogoAsset(LOGO_DARK_PATH);
  let textStartX = 40;
  if (darkLogo) {
    const logoH = 42;
    const logoW = (darkLogo.width / darkLogo.height) * logoH;
    doc.addImage(darkLogo.dataUrl, 'PNG', 36, 17, logoW, logoH);
    textStartX = 36 + logoW + 14;
  }

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('DB ACADEMY', textStartX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(title, textStartX, 56);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(subtitle, 40, 100);

  autoTable(doc, {
    startY: 114,
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [0, 82, 204], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
}

export async function exportCertificatePdf(cert: Certificate) {
  if (typeof document === 'undefined') return;

  // Wait for fonts used by the certificate
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch { /* continue */ }

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '846px';
  host.style.background = '#ffffff';
  host.style.zIndex = '-1';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    await new Promise<void>((resolve) => {
      root.render(React.createElement(CertificateDocumentCard, { certificate: cert }));
      // allow render + QR generation effect
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    // Wait for fonts and QR
    try {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      await fonts?.ready;
      await Promise.all([
        fonts?.load('600 16px "IBM Plex Sans"'),
        fonts?.load('700 16px "IBM Plex Sans"'),
        fonts?.load('400 16px "Inter"'),
        fonts?.load('600 16px "Inter"'),
        fonts?.load('500 16px "IBM Plex Mono"'),
      ]);
      await fonts?.ready;
    } catch {}
    // wait for QR to render
    for (let i = 0; i < 20; i++) {
      await waitForImages(host);
      const qr = host.querySelector('.qr img') as HTMLImageElement | null;
      if (qr && qr.src && qr.src.startsWith('data:image')) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch {}

    // print/PDF look: no outer border/radius, fill page
    const style = document.createElement('style');
    style.textContent = `.dba-cert-root .certificate{border:0 !important;border-radius:0 !important;}`;
    host.appendChild(style);

    const certEl = host.querySelector('.dba-cert-root') as HTMLElement | null;
    const target = certEl || host;
    const captureWidth = target.offsetWidth || 846;
    const cqwPx = captureWidth / 100;
    const canvas = await html2canvas(target, {
      scale: Math.min(3, (window.devicePixelRatio || 1) * 2),
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: captureWidth,
      height: target.offsetHeight,
      windowWidth: captureWidth,
      windowHeight: target.offsetHeight,
      onclone: (clonedDoc) => {
        const styles = Array.from(clonedDoc.querySelectorAll('style'));
        for (const s of styles) {
          if (s.textContent && s.textContent.includes('cqw')) {
            s.textContent = s.textContent.replace(/([\d.]+)cqw/g, (_m, n) => `${(parseFloat(n) * cqwPx).toFixed(3)}px`);
          }
        }
        // container-type inline-size may confuse html2canvas; keep layout stable
        const roots = Array.from(clonedDoc.querySelectorAll('.dba-cert-root')) as HTMLElement[];
        for (const r of roots) r.style.containerType = 'normal';
        const certs = Array.from(clonedDoc.querySelectorAll('.dba-cert-root .certificate')) as HTMLElement[];
        for (const c of certs) { c.style.containerType = 'normal'; c.style.width = `${captureWidth}px`; c.style.maxWidth = `${captureWidth}px`; }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    // @page in design: 210mm x 171.5mm
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 171.5] });
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 171.5, undefined, 'FAST');
    pdf.save(`Certificado_${cert.verificationCode}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}

export function exportEventsToIcs(events: CalendarEvent[]) {
  const formatIcsDate = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DB Academy//Calendar Sync//ES',
    ...events.flatMap((ev) => {
      const start = formatIcsDate(ev.dueAtIso);
      const end = formatIcsDate(new Date(new Date(ev.dueAtIso).getTime() + 60 * 60 * 1000).toISOString());
      return [
        'BEGIN:VEVENT',
        `UID:${ev.id}@catedra.campus`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${ev.title}`,
        `DESCRIPTION:${ev.courseTitle ? ev.courseTitle + ' - ' : ''}${ev.type.toUpperCase()} (${ev.priority})`,
        'END:VEVENT',
      ];
    }),
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  triggerDownload(blob, 'db-academy-calendario.ics');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
