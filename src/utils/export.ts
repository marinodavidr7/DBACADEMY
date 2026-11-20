import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalendarEvent, Certificate } from '../types';

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

export function exportTableToPdf(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 72, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DB ACADEMY', 40, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(title, 40, 54);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(subtitle, 40, 96);

  autoTable(doc, {
    startY: 112,
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function exportCertificatePdf(cert: Certificate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Deep slate frame
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, w, h, 'F');

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(4);
  doc.rect(28, 28, w - 56, h - 56);

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.5);
  doc.rect(38, 38, w - 76, h - 76);

  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DB ACADEMY · CERTIFICADO DE FINALIZACIÓN', w / 2, 92, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text('Se certifica que / This certifies that', w / 2, 150, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.text(cert.studentName, w / 2, 205, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'ha completado satisfactoriamente el 100% de los módulos y evaluaciones del programa:',
    w / 2,
    252,
    { align: 'center' }
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(cert.courseTitle, w / 2, 300, { align: 'center', maxWidth: w - 160 });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(90, 395, 310, 395);
  doc.line(w - 310, 395, w - 90, 395);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(cert.instructorName, 200, 415, { align: 'center' });
  doc.text(cert.verificationCode, w - 200, 415, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Instructor Titular', 200, 432, { align: 'center' });
  doc.text('Código de Verificación', w - 200, 432, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.text(`SHA-256: ${cert.hashSignature}`, w / 2, h - 68, { align: 'center' });

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
