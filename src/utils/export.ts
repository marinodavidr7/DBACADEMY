import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalendarEvent, Certificate } from '../types';
import { generateCertificateQrDataUrl } from './qr';
import { DAVID_SIGNER_NAME, DAVID_SIGNER_TITLE, loadDavidSignaturePngDataUrl } from './signature';

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

export async function exportCertificatePdf(cert: Certificate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Clean crisp light background + subtle outer hairline
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, w, h, 'F');

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.rect(18, 18, w - 36, h - 36);

  // Official DB Academy transparent logo centered at top
  const lightLogo = await loadLogoAsset(LOGO_LIGHT_PATH);
  let headerTitleY = 92;
  if (lightLogo) {
    const logoH = 76;
    const logoW = (lightLogo.width / lightLogo.height) * logoH;
    doc.addImage(lightLogo.dataUrl, 'PNG', (w - logoW) / 2, 34, logoW, logoH);
    headerTitleY = 134;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CERTIFICADO OFICIAL DE FINALIZACIÓN', w / 2, headerTitleY, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Se certifica que / This certifies that', w / 2, headerTitleY + 32, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(cert.studentName, w / 2, headerTitleY + 68, { align: 'center', maxWidth: w - 140 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'ha completado satisfactoriamente el 100% de los módulos, prácticas y evaluaciones del programa:',
    w / 2,
    headerTitleY + 98,
    { align: 'center', maxWidth: 460 }
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cert.courseTitle, w / 2, headerTitleY + 146, { align: 'center', maxWidth: w - 160 });

  // 2-Column Signature (David) & Issue Date row
  const lineY = 382;
  const leftX = w / 2 - 145;
  const rightX = w / 2 + 145;

  const davidSignaturePng = await loadDavidSignaturePngDataUrl();
  if (davidSignaturePng) {
    doc.addImage(davidSignaturePng, 'PNG', leftX - 48, lineY - 56, 96, 32);
  } else {
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'italic');
    doc.setFontSize(20);
    doc.text(DAVID_SIGNER_NAME, leftX, lineY - 26, { align: 'center' });
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(DAVID_SIGNER_NAME, leftX, lineY - 8, { align: 'center', maxWidth: 180 });
  doc.text(formatCertificateDate(cert.issuedAt), rightX, lineY - 8, { align: 'center', maxWidth: 180 });

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.9);
  doc.line(leftX - 95, lineY, leftX + 95, lineY);
  doc.line(rightX - 95, lineY, rightX + 95, lineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(DAVID_SIGNER_TITLE, leftX, lineY + 18, { align: 'center', maxWidth: 190 });
  doc.text('Fecha de Emisión', rightX, lineY + 18, { align: 'center', maxWidth: 180 });

  // Centered Verification Code + Scannable QR row
  const qrSize = 72;
  const qrY = 426;
  const textCenterX = w / 2 - 58;
  const qrX = w / 2 + 44;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Código de Verificación', textCenterX, qrY + 20, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.verificationCode, textCenterX, qrY + 38, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ESCANEA PARA VERIFICAR', textCenterX, qrY + 55, { align: 'center' });

  try {
    const qrDataUrl = await generateCertificateQrDataUrl(cert, 260);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, 'FD');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    // Continue generating PDF even if canvas QR fails
  }

  // Bottom centered SHA-256 signature
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`DB Academy Firma Digital SHA-256 ${cert.hashSignature}`, w / 2, h - 36, {
    align: 'center',
    maxWidth: w - 80,
  });

  doc.save(`Certificado_${cert.verificationCode}.pdf`);
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
