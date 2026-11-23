/**
 * Generador OOXML (.xlsx) puro en TypeScript sin dependencias externas.
 * Produce libros reales multi-hoja compatibles con Microsoft Excel,
 * LibreOffice Calc y Google Sheets, incluyendo estilos, bordes,
 * formatos numéricos/moneda/porcentaje, anchos de columna y celdas meta.
 */

export type XlsxCellStyle =
  | 'normal'
  | 'banner'
  | 'subtitle'
  | 'header'
  | 'number'
  | 'currency'
  | 'percent'
  | 'target'
  | 'label'
  | 'hint';

export interface XlsxCellSpec {
  ref: string; // e.g. 'A1', 'D2'
  value: string | number | boolean;
  style?: XlsxCellStyle;
}

export interface XlsxSheetSpec {
  name: string;
  colWidths?: number[];
  freezeRow?: number;
  cells: XlsxCellSpec[];
}

export interface DownloadableExcelPractice {
  id: string;
  number: number; // 11..15
  sheetName: string;
  title: string;
  functionTag: string;
  prompt: string;
  hint: string;
  targetCell: string;
  expectedResult: string;
  colWidths: number[];
  cells: XlsxCellSpec[];
}

const STYLE_INDEX: Record<XlsxCellStyle, number> = {
  normal: 0,
  banner: 1,
  subtitle: 2,
  header: 3,
  number: 4,
  currency: 5,
  percent: 6,
  target: 7,
  label: 8,
  hint: 9,
};

const encoder = new TextEncoder();

function sanitizeXmlText(input: string): string {
  // Remove XML 1.0 disallowed control chars
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function escapeXml(input: string): string {
  return sanitizeXmlText(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let clean = name.replace(/[\[\]:*?\/\\]/g, ' ').trim();
  if (!clean) clean = 'Hoja';
  if (clean.length > 31) clean = clean.slice(0, 31).trim();
  let candidate = clean;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = `_${n}`;
    candidate = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function parseCellRef(ref: string): { col: number; row: number; refUpper: string } {
  const m = ref.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return { col: 1, row: 1, refUpper: 'A1' };
  const letters = m[1];
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { col, row: Number(m[2]), refUpper: `${letters}${m[2]}` };
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="#,##0.##"/>
    <numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/>
    <numFmt numFmtId="166" formatCode="0.00%"/>
  </numFmts>
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF92400E"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF107C41"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="medium"><color rgb="FFD97706"/></left>
      <right style="medium"><color rgb="FFD97706"/></right>
      <top style="medium"><color rgb="FFD97706"/></top>
      <bottom style="medium"><color rgb="FFD97706"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="2" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="6" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;
}

// CRC-32 table for ZIP generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function createZipUint8Array(entries: ZipEntry[]): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression: STORE (0)
    lv.setUint16(10, 0, true); // Mod time
    lv.setUint16(12, 0x5421, true); // Mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // STORE
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralChunks.reduce((acc, c) => acc + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);
  return output;
}

export function buildWorkbookBytes(sheets: XlsxSheetSpec[]): Uint8Array {
  const sharedStrings: string[] = [];
  const sharedMap = new Map<string, number>();

  const getStringIdx = (str: string): number => {
    const clean = sanitizeXmlText(str);
    const existing = sharedMap.get(clean);
    if (existing !== undefined) return existing;
    const idx = sharedStrings.length;
    sharedStrings.push(clean);
    sharedMap.set(clean, idx);
    return idx;
  };

  const usedNames = new Set<string>();
  const normalizedSheets = sheets.map((s) => ({
    ...s,
    safeName: sanitizeSheetName(s.name, usedNames),
  }));

  const sheetXmls = normalizedSheets.map((sheet) => {
    const rowMap = new Map<number, Array<{ col: number; ref: string; cell: XlsxCellSpec }>>();

    for (const cell of sheet.cells) {
      const parsed = parseCellRef(cell.ref);
      const list = rowMap.get(parsed.row) ?? [];
      // deduplicate same ref keeping latest
      const filtered = list.filter((item) => item.ref !== parsed.refUpper);
      filtered.push({ col: parsed.col, ref: parsed.refUpper, cell });
      rowMap.set(parsed.row, filtered);
    }

    const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);
    const rowsXml = sortedRows
      .map((rowNum) => {
        const items = (rowMap.get(rowNum) ?? []).sort((a, b) => a.col - b.col);
        const hasBanner = items.some((it) => it.cell.style === 'banner');
        const hasSubtitle = items.some((it) => it.cell.style === 'subtitle' || it.cell.style === 'hint');
        const htAttr = hasBanner ? ' ht="28" customHeight="1"' : hasSubtitle ? ' ht="34" customHeight="1"' : ' ht="21" customHeight="1"';

        const cellsXml = items
          .map(({ ref, cell }) => {
            const styleIdx = STYLE_INDEX[cell.style ?? 'normal'] ?? 0;
            if (typeof cell.value === 'number' && Number.isFinite(cell.value)) {
              return `<c r="${ref}" s="${styleIdx}"><v>${cell.value}</v></c>`;
            }
            if (typeof cell.value === 'boolean') {
              return `<c r="${ref}" t="b" s="${styleIdx}"><v>${cell.value ? 1 : 0}</v></c>`;
            }
            const sIdx = getStringIdx(String(cell.value));
            return `<c r="${ref}" t="s" s="${styleIdx}"><v>${sIdx}</v></c>`;
          })
          .join('');
        return `<row r="${rowNum}"${htAttr}>${cellsXml}</row>`;
      })
      .join('');

    const colsXml =
      sheet.colWidths && sheet.colWidths.length > 0
        ? `<cols>${sheet.colWidths
            .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
            .join('')}</cols>`
        : '';

    const sheetViewsXml = sheet.freezeRow
      ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freezeRow}" topLeftCell="A${sheet.freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${sheetViewsXml}
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
  });

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
  ${sharedStrings
    .map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`)
    .join('')}
</sst>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${normalizedSheets
      .map(
        (s, idx) =>
          `<sheet name="${escapeXml(s.safeName)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
      )
      .join('')}
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${normalizedSheets
    .map(
      (_, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join('')}
  <Relationship Id="rId${normalizedSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId${normalizedSheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${normalizedSheets
    .map(
      (_, idx) =>
        `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: encoder.encode(rootRelsXml) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encoder.encode(buildStylesXml()) },
    { name: 'xl/sharedStrings.xml', data: encoder.encode(sharedStringsXml) },
    ...sheetXmls.map((xml, idx) => ({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      data: encoder.encode(xml),
    })),
  ];

  return createZipUint8Array(entries);
}

export function buildLessonWorkbookSpecs(
  lessonTitle: string,
  practices: DownloadableExcelPractice[]
): XlsxSheetSpec[] {
  const indexCells: XlsxCellSpec[] = [
    { ref: 'A1', value: `CÁTEDRA EXCEL · ${lessonTitle}`, style: 'banner' },
    { ref: 'B1', value: '', style: 'banner' },
    { ref: 'C1', value: '', style: 'banner' },
    { ref: 'D1', value: '', style: 'banner' },
    { ref: 'E1', value: '', style: 'banner' },
    {
      ref: 'A2',
      value:
        'Instrucciones: Resuelve las 5 prácticas en las pestañas P11 a P15 escribiendo tu fórmula en la celda resaltada en ámbar. Luego marca tus prácticas completadas en la plataforma.',
      style: 'subtitle',
    },
    { ref: 'A4', value: 'N.º', style: 'header' },
    { ref: 'B4', value: 'Pestaña', style: 'header' },
    { ref: 'C4', value: 'Práctica', style: 'header' },
    { ref: 'D4', value: 'Tema / Función', style: 'header' },
    { ref: 'E4', value: 'Celda Meta', style: 'header' },
  ];

  practices.forEach((p, idx) => {
    const r = 5 + idx;
    indexCells.push(
      { ref: `A${r}`, value: p.number, style: 'number' },
      { ref: `B${r}`, value: p.sheetName, style: 'label' },
      { ref: `C${r}`, value: p.title, style: 'normal' },
      { ref: `D${r}`, value: p.functionTag, style: 'normal' },
      { ref: `E${r}`, value: p.targetCell, style: 'target' }
    );
  });

  const indexSheet: XlsxSheetSpec = {
    name: 'Instrucciones',
    colWidths: [8, 22, 42, 22, 14],
    freezeRow: 4,
    cells: indexCells,
  };

  const practiceSheets: XlsxSheetSpec[] = practices.map((p) => ({
    name: p.sheetName,
    colWidths: p.colWidths,
    freezeRow: 4,
    cells: [
      { ref: 'A1', value: `Práctica ${p.number}: ${p.title} (${p.functionTag})`, style: 'banner' },
      { ref: 'B1', value: '', style: 'banner' },
      { ref: 'C1', value: '', style: 'banner' },
      { ref: 'D1', value: '', style: 'banner' },
      { ref: 'E1', value: '', style: 'banner' },
      { ref: 'A2', value: p.prompt, style: 'subtitle' },
      {
        ref: 'A3',
        value: `Celda objetivo: ${p.targetCell} · Pista: ${p.hint}`,
        style: 'hint',
      },
      ...p.cells,
    ],
  }));

  return [indexSheet, ...practiceSheets];
}

export function buildLessonWorkbookBlob(
  lessonTitle: string,
  practices: DownloadableExcelPractice[]
): Blob {
  const specs = buildLessonWorkbookSpecs(lessonTitle, practices);
  const bytes = buildWorkbookBytes(specs);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadWorkbook(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
