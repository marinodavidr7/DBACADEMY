import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Table2,
  Upload,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { isAuthorizedAdminEmail } from '../firebase';
import { EXCEL_BASICO_COURSE } from '../data/seedCourses';
import type { CustomExcelExercise } from '../types';
import {
  ALL_COLS,
  MAX_ROWS,
  evaluateExcelFormula,
  getSheetDimensions,
  isExcelError,
  type CellPrimitive,
  type SheetCells,
} from '../utils/excelEngine';

interface ExerciseCreatorModalProps {
  open: boolean;
  defaultLessonId?: string;
  onClose: () => void;
  onCreated?: (exercise: CustomExcelExercise) => void;
}

const STARTER_TEMPLATES: Array<{
  label: string;
  functionTag: string;
  title: string;
  prompt: string;
  hint: string;
  targetCell: string;
  solutionFormula: string;
  sheet: SheetCells;
}> = [
  {
    label: 'Plantilla =SI() Notas',
    functionTag: '=SI()',
    title: 'Evaluar calificación mínima',
    prompt:
      'En la celda C2 escribe una fórmula =SI() que devuelva "Aprobado" si la nota en B2 es mayor o igual a 60, y "Reprobado" en caso contrario.',
    hint: 'Usa =SI(B2>=60;"Aprobado";"Reprobado").',
    targetCell: 'C2',
    solutionFormula: '=SI(B2>=60;"Aprobado";"Reprobado")',
    sheet: {
      A1: 'Alumno',
      B1: 'Nota',
      C1: 'Estado',
      A2: 'Lucía',
      B2: 78,
      A3: 'Mateo',
      B3: 52,
      A4: 'Sofía',
      B4: 89,
    },
  },
  {
    label: 'Plantilla =SI() Bono',
    functionTag: '=SI() + Cálculo',
    title: 'Calcular comisión condicional',
    prompt:
      'En C2 calcula el bono del 10% sobre B2 (B2*0.1) si la venta supera 1000, de lo contrario devuelve 0.',
    hint: 'Usa =SI(B2>1000;B2*0.1;0).',
    targetCell: 'C2',
    solutionFormula: '=SI(B2>1000;B2*0.1;0)',
    sheet: {
      A1: 'Vendedor',
      B1: 'Ventas',
      C1: 'Bono',
      A2: 'Carlos',
      B2: 1500,
      A3: 'Elena',
      B3: 850,
    },
  },
  {
    label: 'Plantilla =CONTAR.SI()',
    functionTag: '=CONTAR.SI()',
    title: 'Contar pedidos entregados',
    prompt:
      'En D2 cuenta cuántos pedidos de B2:B5 tienen el estado "Entregado".',
    hint: 'Usa =CONTAR.SI(B2:B5;"Entregado").',
    targetCell: 'D2',
    solutionFormula: '=CONTAR.SI(B2:B5;"Entregado")',
    sheet: {
      A1: 'Pedido',
      B1: 'Estado',
      C1: 'Monto',
      D1: 'Resumen',
      A2: 'P-101',
      B2: 'Entregado',
      C2: 120,
      A3: 'P-102',
      B3: 'Pendiente',
      C3: 95,
      A4: 'P-103',
      B4: 'Entregado',
      C4: 240,
      A5: 'P-104',
      B5: 'Entregado',
      C5: 180,
    },
  },
];

function parseCsvMatrix(rawText: string): string[][] {
  const clean = rawText.replace(/^\uFEFF/, '');
  const firstNonEmpty = clean.split(/\r?\n/).find((l) => l.trim() !== '') || '';
  const delimiter = !firstNonEmpty.includes(',') && firstNonEmpty.includes(';') ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      if (inQuotes && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      row.push(cell.trim());
      cell = '';
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

export const ExerciseCreatorModal: React.FC<ExerciseCreatorModalProps> = ({
  open,
  defaultLessonId,
  onClose,
  onCreated,
}) => {
  const { user, isAdmin, createCustomExercise } = usePlatform();
  const canCreateExercise = Boolean(
    user?.emailVerified && isAdmin && isAuthorizedAdminEmail(user?.email)
  );

  const allLessons = useMemo(
    () =>
      EXCEL_BASICO_COURSE.modules.flatMap((m) =>
        m.lessons.map((l) => ({
          id: l.id,
          label: `${l.title} (${m.title})`,
        }))
      ),
    []
  );

  const [lessonId, setLessonId] = useState<string>(
    defaultLessonId || 'les-excel-1-13'
  );
  const [functionTag, setFunctionTag] = useState<string>('=SI()');
  const [title, setTitle] = useState<string>(STARTER_TEMPLATES[0].title);
  const [prompt, setPrompt] = useState<string>(STARTER_TEMPLATES[0].prompt);
  const [hint, setHint] = useState<string>(STARTER_TEMPLATES[0].hint);
  const [colCount, setColCount] = useState<number>(4);
  const [rowCount, setRowCount] = useState<number>(6);
  const [targetCell, setTargetCell] = useState<string>(STARTER_TEMPLATES[0].targetCell);
  const [solutionFormula, setSolutionFormula] = useState<string>(
    STARTER_TEMPLATES[0].solutionFormula
  );
  const [sheet, setSheet] = useState<SheetCells>({ ...STARTER_TEMPLATES[0].sheet });
  const [published, setPublished] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const visibleCols = useMemo(() => ALL_COLS.slice(0, colCount), [colCount]);
  const visibleRows = useMemo(
    () => Array.from({ length: rowCount }, (_, i) => i + 1),
    [rowCount]
  );
  const allCellAddresses = useMemo(
    () => visibleRows.flatMap((r) => visibleCols.map((c) => `${c}${r}`)),
    [visibleRows, visibleCols]
  );

  // Sync defaultLessonId when modal opens
  React.useEffect(() => {
    if (open && defaultLessonId) {
      setLessonId(defaultLessonId);
    }
  }, [open, defaultLessonId]);

  const previewResult = useMemo(() => {
    const cleanSheet: SheetCells = {
      ...sheet,
      [targetCell]: solutionFormula.trim(),
    };
    const evaluated = evaluateExcelFormula(solutionFormula.trim(), cleanSheet);
    return evaluated;
  }, [sheet, targetCell, solutionFormula]);

  const isPreviewValid =
    solutionFormula.trim().startsWith('=') &&
    previewResult !== '' &&
    !isExcelError(previewResult);

  if (!open || !canCreateExercise) return null;

  const applyTemplate = (tpl: (typeof STARTER_TEMPLATES)[number]) => {
    const dims = getSheetDimensions(tpl.sheet, tpl.targetCell);
    setColCount(dims.cols.length);
    setRowCount(dims.rows.length);
    setFunctionTag(tpl.functionTag);
    setTitle(tpl.title);
    setPrompt(tpl.prompt);
    setHint(tpl.hint);
    setTargetCell(tpl.targetCell);
    setSolutionFormula(tpl.solutionFormula);
    setSheet({ ...tpl.sheet });
    setError('');
  };

  const handleAddRow = () => {
    setRowCount((prev) => Math.min(MAX_ROWS, prev + 1));
  };

  const handleRemoveRow = () => {
    if (rowCount <= 2) return;
    const nextRows = rowCount - 1;
    setRowCount(nextRows);
    setSheet((prev) => {
      const next: SheetCells = {};
      for (const [k, v] of Object.entries(prev)) {
        const match = k.match(/^([A-L])(\d+)$/i);
        if (match && Number(match[2]) <= nextRows) {
          next[k] = v;
        }
      }
      return next;
    });
    const tMatch = targetCell.match(/^([A-L])(\d+)$/i);
    if (tMatch && Number(tMatch[2]) > nextRows) {
      setTargetCell(`${tMatch[1].toUpperCase()}${nextRows}`);
    }
  };

  const handleAddCol = () => {
    setColCount((prev) => Math.min(ALL_COLS.length, prev + 1));
  };

  const handleRemoveCol = () => {
    if (colCount <= 2) return;
    const nextColsCount = colCount - 1;
    const allowedCols = new Set<string>(ALL_COLS.slice(0, nextColsCount));
    setColCount(nextColsCount);
    setSheet((prev) => {
      const next: SheetCells = {};
      for (const [k, v] of Object.entries(prev)) {
        const match = k.match(/^([A-L])(\d+)$/i);
        if (match && allowedCols.has(match[1].toUpperCase())) {
          next[k] = v;
        }
      }
      return next;
    });
    const tMatch = targetCell.match(/^([A-L])(\d+)$/i);
    if (tMatch && !allowedCols.has(tMatch[1].toUpperCase())) {
      setTargetCell(`${ALL_COLS[nextColsCount - 1]}${tMatch[2]}`);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const matrix = parseCsvMatrix(text);

      // Find the header row (first row with >= 2 non-empty cells)
      let headerIdx = matrix.findIndex((r) => r.filter((c) => c !== '').length >= 2);
      if (headerIdx < 0) {
        setError('No se detectó una tabla con encabezados válidos en el CSV.');
        return;
      }

      // Extract optional preamble instructions before the table
      const preambleLines = matrix
        .slice(0, headerIdx)
        .map((r) => r.filter((c) => c !== '').join(' ').trim())
        .filter(Boolean);

      let detectedTitle = file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim();
      let detectedFormula = '';
      const promptParts: string[] = [];

      for (const line of preambleLines) {
        const cleaned = line.replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF\s]+/u, '').trim();
        if (!cleaned) continue;
        if (cleaned.startsWith('=')) {
          detectedFormula = cleaned;
        } else if (/^(EJ\s*\d+|📋)/i.test(line)) {
          detectedTitle = cleaned.slice(0, 140);
        } else if (!/^INSTRUCCIONES:?$/i.test(cleaned)) {
          promptParts.push(cleaned);
        }
      }

      const tableRows = matrix
        .slice(headerIdx)
        .filter((r) => r.some((c) => c !== ''))
        .slice(0, MAX_ROWS);

      if (tableRows.length < 2) {
        setError('El CSV debe incluir al menos una fila de encabezados y una fila de datos.');
        return;
      }

      const maxColsFound = Math.min(
        ALL_COLS.length,
        Math.max(2, ...tableRows.map((r) => r.length))
      );

      const importedSheet: SheetCells = {};
      tableRows.forEach((r, rowOffset) => {
        const rowNum = rowOffset + 1;
        for (let cIdx = 0; cIdx < maxColsFound; cIdx++) {
          const val = (r[cIdx] ?? '').trim();
          if (val === '') continue;
          const addr = `${ALL_COLS[cIdx]}${rowNum}`;
          importedSheet[addr] =
            !val.startsWith('=') && /^-?\d+(\.\d+)?$/.test(val) ? Number(val) : val;
        }
      });

      // Detect first empty cell in row 2 as targetCell (or fallback to last col, row 2)
      let nextTarget = `${ALL_COLS[maxColsFound - 1]}2`;
      for (let cIdx = 0; cIdx < maxColsFound; cIdx++) {
        const addr = `${ALL_COLS[cIdx]}2`;
        if (importedSheet[addr] === undefined || importedSheet[addr] === '') {
          nextTarget = addr;
          break;
        }
      }

      // Shift row numbers in detectedFormula if preamble came from an offset Excel sheet
      if (detectedFormula && headerIdx > 0) {
        const origDataRow = headerIdx + 2; // 1-indexed first data row in original CSV
        const delta = 2 - origDataRow;
        if (delta !== 0) {
          detectedFormula = detectedFormula.replace(
            /(\$?[A-L])(\d+)/gi,
            (full, colPart: string, rowNumStr: string) => {
              const shifted = Number(rowNumStr) + delta;
              return shifted >= 1 && shifted <= MAX_ROWS ? `${colPart.toUpperCase()}${shifted}` : full;
            }
          );
        }
      }

      setColCount(maxColsFound);
      setRowCount(Math.max(2, Math.min(MAX_ROWS, tableRows.length)));
      setSheet(importedSheet);
      setTargetCell(nextTarget);
      if (detectedTitle.length >= 2) setTitle(detectedTitle.slice(0, 140));
      if (promptParts.length > 0) {
        setPrompt(promptParts.join(' · ').slice(0, 600));
      }
      if (detectedFormula) {
        setSolutionFormula(detectedFormula.slice(0, 240));
        setHint(`Aplica la fórmula en ${nextTarget}: ${detectedFormula}`.slice(0, 400));
      }
      setError('');
    } catch {
      setError('No se pudo leer el archivo CSV. Verifica que tenga codificación UTF-8.');
    }
  };

  const handleCellChange = (addr: string, raw: string) => {
    const trimmed = raw.trim();
    const parsed: CellPrimitive =
      trimmed !== '' && !trimmed.startsWith('=') && /^-?\d+(\.\d+)?$/.test(trimmed)
        ? Number(trimmed)
        : raw;
    setSheet((prev) => {
      const next = { ...prev };
      if (raw === '') {
        delete next[addr];
      } else {
        next[addr] = parsed;
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canCreateExercise) {
      setError(
        'Acceso denegado: solo el correo verificado Marinodavidr7@gmail.com puede crear o editar ejercicios.'
      );
      return;
    }

    if (title.trim().length < 2) {
      setError('El título debe tener al menos 2 caracteres.');
      return;
    }
    if (prompt.trim().length < 5) {
      setError('Escribe un enunciado claro de al menos 5 caracteres.');
      return;
    }
    if (!solutionFormula.trim().startsWith('=')) {
      setError('La fórmula solución debe comenzar con el signo igual (=).');
      return;
    }
    if (!isPreviewValid) {
      setError(
        `La fórmula solución devolvió "${String(previewResult || 'vacío')}". Verifica las celdas y argumentos antes de guardar.`
      );
      return;
    }

    // Remove targetCell value from initialSheet so the student fills it in
    const cleanInitialSheet: SheetCells = { ...sheet };
    delete cleanInitialSheet[targetCell];

    setSaving(true);
    try {
      const created = await createCustomExercise({
        lessonId,
        functionTag: functionTag.trim() || '=SI()',
        title: title.trim(),
        prompt: prompt.trim(),
        hint: hint.trim(),
        targetCell,
        solutionFormula: solutionFormula.trim(),
        expectedResult: String(previewResult),
        initialSheet: cleanInitialSheet,
        published,
      });
      onCreated?.(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ejercicio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-[#107C41] text-white font-serif italic font-bold text-xs">
              fx
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Crear Ejercicio Interactivo de Excel
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Diseña la tabla de datos, define la celda meta y prueba tu fórmula en vivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar creador"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Quick Templates */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Plantillas rápidas:
            </span>
            {STARTER_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-[#107C41] hover:text-[#107C41] transition-colors"
              >
                {tpl.label}
              </button>
            ))}
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleImportCsv(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>Importar .CSV</span>
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Metadata fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Lección destino
              </label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {allLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Etiqueta de función
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={functionTag}
                onChange={(e) => setFunctionTag(e.target.value)}
                placeholder="Ej: =SI() o =SI(Y(...))"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Título del ejercicio
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Clasificar ventas por meta"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Instrucciones para el estudiante
            </label>
            <textarea
              rows={2}
              required
              minLength={5}
              maxLength={600}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe qué debe calcular en la celda meta..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Editable Dynamic Sheet Grid */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Table2 className="w-3.5 h-3.5 text-[#107C41]" />
                Datos iniciales de la hoja (A1:{visibleCols[visibleCols.length - 1]}{rowCount})
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleRemoveRow}
                    disabled={rowCount <= 2}
                    title="Quitar última fila"
                    className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 py-1 font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {rowCount} filas
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={rowCount >= MAX_ROWS}
                    title="Insertar nueva fila"
                    className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40 border-l border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Fila</span>
                  </button>
                </div>

                <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleRemoveCol}
                    disabled={colCount <= 2}
                    title="Quitar última columna"
                    className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-40"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 py-1 font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {colCount} cols
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCol}
                    disabled={colCount >= ALL_COLS.length}
                    title="Insertar nueva columna"
                    className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40 border-l border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Columna</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSheet({})}
                  className="text-slate-500 hover:text-red-600 underline ml-1"
                >
                  Limpiar hoja
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    <th className="w-8 border border-slate-200 dark:border-slate-800 py-1 text-center" />
                    {visibleCols.map((c) => (
                      <th
                        key={c}
                        className="border border-slate-200 dark:border-slate-800 py-1 px-2 text-center font-semibold min-w-[96px]"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r}>
                      <td className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center text-[11px] text-slate-500 font-semibold">
                        {r}
                      </td>
                      {visibleCols.map((c) => {
                        const addr = `${c}${r}`;
                        const isTarget = addr === targetCell;
                        return (
                          <td
                            key={addr}
                            className={`border border-slate-200 dark:border-slate-800 p-0.5 ${
                              isTarget ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={isTarget ? '' : String(sheet[addr] ?? '')}
                              disabled={isTarget}
                              placeholder={isTarget ? `Meta (${addr})` : ''}
                              onChange={(e) => handleCellChange(addr, e.target.value)}
                              className="w-full bg-transparent px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-emerald-50/50 dark:focus:bg-emerald-950/30 disabled:italic disabled:text-blue-600"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Target cell, Solution formula & Live Test Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Celda Meta
              </label>
              <select
                value={targetCell}
                onChange={(e) => setTargetCell(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              >
                {allCellAddresses.map((addr) => (
                  <option key={addr} value={addr}>
                    {addr}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-9">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Fórmula Solución (empieza con =)
              </label>
              <input
                type="text"
                required
                maxLength={240}
                value={solutionFormula}
                onChange={(e) => setSolutionFormula(e.target.value)}
                placeholder='=SI(B2>=60;"Aprobado";"Reprobado")'
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-emerald-700 dark:text-emerald-400"
              />
            </div>
          </div>

          {/* Live Evaluation Preview Strip */}
          <div
            className={`rounded-lg border px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs ${
              isPreviewValid
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isPreviewValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span>
                Vista previa en celda <strong className="font-mono">{targetCell}</strong>:
              </span>
            </div>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              {String(previewResult || '—')}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Pista opcional
            </label>
            <input
              type="text"
              maxLength={400}
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Ej: Recuerda separar los argumentos con punto y coma (;)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded accent-[#107C41] w-4 h-4"
            />
            <span>Publicar ejercicio para todos los alumnos de esta lección</span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !isPreviewValid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#107C41] hover:bg-[#0d6535] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors min-h-[38px]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Guardar ejercicio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
