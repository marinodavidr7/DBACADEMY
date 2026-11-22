import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Filter,
  HelpCircle,
  Lightbulb,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Grid state machine types
// idle           → no cell selected (initial state)
// selected       → a cell is active, arrow keys move focus, typing starts edit
// editing        → inline <input> open in the active cell; F2 or any char triggers
// formula-select → subset of editing where formula starts with '='; clicking
//                  another cell inserts its address instead of selecting it
// ---------------------------------------------------------------------------
type GridMode = 'idle' | 'selected' | 'editing' | 'formula-select';
import { usePlatform } from '../context/PlatformContext';
import { isAuthorizedAdminEmail } from '../firebase';
import {
  EXCEL_CURRICULUM,
  type ExcelExercise,
  type ExcelLessonCurriculum,
  type ExcelPracticalExample,
} from '../data/excelCurriculum';
import {
  evaluateExcelFormula,
  getSheetDimensions,
  isExcelError,
  toNumeric,
  type CellPrimitive,
  type SheetCells,
} from '../utils/excelEngine';
import { ExerciseCreatorModal } from './ExerciseCreatorModal';

export { evaluateExcelFormula };

type LabExercise = ExcelExercise & { isCustom?: boolean; ownerId?: string };

interface InteractiveExcelLabProps {
  lessonId: string;
  lessonTitle: string;
  mode: 'guide' | 'practice' | 'lab' | 'syntax';
  requestedExampleId?: string | null;
  onRequestExamplePractice?: (exampleId: string) => void;
  onGoToPractice?: () => void;
  onSolved?: () => void;
}

const SOLVED_STORAGE_PREFIX = 'dbacademy_excel_solved_v1_';

function loadSolvedSet(lessonId: string): string[] {
  try {
    const raw = localStorage.getItem(`${SOLVED_STORAGE_PREFIX}${lessonId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveSolvedSet(lessonId: string, ids: string[]) {
  try {
    localStorage.setItem(`${SOLVED_STORAGE_PREFIX}${lessonId}`, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

function splitSyntaxLines(syntax: string): string[] {
  return syntax
    .split(/\n|\s*[·|]\s*/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Cycles a cell reference through the four absolute/relative states Excel uses
 * when pressing F4:  B3 → $B$3 → B$3 → $B3 → B3
 */
function cycleReference(ref: string): string {
  const m = ref.match(/^(\$?)([A-L])(\$?)(\d+)$/i);
  if (!m) return ref;
  const [, colPin, col, rowPin, row] = m;
  if (!colPin && !rowPin) return `$${col}$${row}`;      // relative → both absolute
  if (colPin && rowPin) return `${col}$${row}`;          // both absolute → col relative
  if (!colPin && rowPin) return `$${col}${row}`;         // row absolute → col absolute
  return `${col}${row}`;                                  // col absolute → both relative
}

export const InteractiveExcelLab: React.FC<InteractiveExcelLabProps> = ({
  lessonId,
  lessonTitle,
  mode,
  requestedExampleId,
  onRequestExamplePractice,
  onGoToPractice,
  onSolved,
}) => {
  const { user, isAdmin, customExercises, deleteCustomExercise } = usePlatform();
  const canAdminManage = Boolean(
    user?.emailVerified && isAdmin && isAuthorizedAdminEmail(user?.email)
  );

  const curriculum: ExcelLessonCurriculum = useMemo(
    () => EXCEL_CURRICULUM[lessonId] || EXCEL_CURRICULUM['les-excel-0-1'],
    [lessonId]
  );

  const allExercises: LabExercise[] = useMemo(() => {
    const baseCount = curriculum.exercises.length;
    const mappedCustom: LabExercise[] = customExercises
      .filter((ce) => ce.lessonId === lessonId)
      .map((ce, idx) => ({
        id: ce.id,
        number: baseCount + idx + 1,
        functionTag: ce.functionTag,
        title: ce.title,
        prompt: ce.prompt,
        hint: ce.hint || `Aplica la fórmula esperada en la celda ${ce.targetCell}.`,
        targetCell: ce.targetCell,
        solutionFormula: ce.solutionFormula,
        initialSheet: ce.initialSheet,
        isCustom: true,
        ownerId: ce.ownerId,
        validate: (formulaRaw: string, computedValue: CellPrimitive) => {
          const f = formulaRaw.trim();
          if (!f.startsWith('=')) {
            return {
              ok: false,
              feedback: 'Recuerda iniciar toda fórmula con el signo igual (=).',
            };
          }
          if (isExcelError(computedValue)) {
            return {
              ok: false,
              feedback: `La fórmula devolvió el error ${String(computedValue)}. Revisa la sintaxis.`,
            };
          }
          const expectedNum = Number(ce.expectedResult.replace(',', '.'));
          const actualNum = toNumeric(computedValue);
          if (Number.isFinite(expectedNum) && ce.expectedResult.trim() !== '' && actualNum !== null) {
            if (Math.abs(actualNum - expectedNum) <= 0.02) {
              return { ok: true, feedback: `¡Excelente! Resultado correcto: ${String(computedValue)}.` };
            }
          } else if (
            String(computedValue).trim().toLowerCase() === ce.expectedResult.trim().toLowerCase()
          ) {
            return { ok: true, feedback: `¡Excelente! Resultado correcto: ${String(computedValue)}.` };
          }
          return {
            ok: false,
            feedback: `Se esperaba "${ce.expectedResult}" en ${ce.targetCell} (Actual: ${String(computedValue || 'vacío')}).`,
          };
        },
      }));
    return [...curriculum.exercises, ...mappedCustom];
  }, [curriculum.exercises, customExercises, lessonId]);

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>(() => loadSolvedSet(lessonId));
  const [loadedExampleId, setLoadedExampleId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const safeIdx = Math.min(exerciseIdx, Math.max(0, allExercises.length - 1));
  const activeExercise: LabExercise = allExercises[safeIdx] ?? allExercises[0];

  const activeExample: ExcelPracticalExample | null = useMemo(
    () =>
      loadedExampleId
        ? curriculum.examples.find((ex) => ex.id === loadedExampleId) ?? null
        : null,
    [curriculum.examples, loadedExampleId]
  );

  // Active workspace context (either an example loaded for inspection or the current exercise)
  const activeContext = useMemo(() => {
    if (activeExample) {
      return {
        targetCell: activeExample.targetCell,
        initialSheet: activeExample.sheet,
        secondarySheet: activeExample.secondarySheet,
        supportsFilter: activeExample.supportsFilter,
        filterColumn: activeExample.filterColumn,
        filterValue: activeExample.filterValue,
        solutionFormula: activeExample.formula,
      };
    }
    return {
      targetCell: activeExercise.targetCell,
      initialSheet: activeExercise.initialSheet,
      secondarySheet: activeExercise.secondarySheet,
      supportsFilter: activeExercise.supportsFilter,
      filterColumn: activeExercise.filterColumn,
      filterValue: activeExercise.filterValue,
      solutionFormula: activeExercise.solutionFormula,
    };
  }, [activeExample, activeExercise]);

  const [sheet, setSheet] = useState<SheetCells>(() => ({ ...activeExercise.initialSheet }));
  const [activeSheetTab, setActiveSheetTab] = useState<'primary' | 'secondary'>('primary');
  const [selectedCell, setSelectedCell] = useState<string>(activeExercise.targetCell);
  const [formulaDraft, setFormulaDraft] = useState<string>(
    String(activeExercise.initialSheet[activeExercise.targetCell] ?? '')
  );
  const [filterOnlyValue, setFilterOnlyValue] = useState(false);
  const [recalcTick, setRecalcTick] = useState(0);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; feedback: string } | null>(null);

  // ── Grid state machine ────────────────────────────────────────────────────
  // gridMode drives how keyboard events and cell-clicks are interpreted.
  const [gridMode, setGridMode] = useState<GridMode>('idle');
  // inlineDraft: the string the user is typing inside the cell input.
  // Kept in sync with formulaDraft (formula bar). formulaDraft is the
  // shared source-of-truth; inlineDraft just shadows it for the inline <input>.
  const [inlineDraft, setInlineDraft] = useState('');
  // Value that was in the cell before entering edit mode (used for Escape/cancel).
  const prevCellValue = useRef('');

  // Refs for keyboard-focus management
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineCellInputRef = useRef<HTMLInputElement | null>(null);
  const formulaBarInputRef = useRef<HTMLInputElement | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);

  // Reset state cleanly when changing lesson
  useEffect(() => {
    setExerciseIdx(0);
    setSolvedIds(loadSolvedSet(lessonId));
    setLoadedExampleId(requestedExampleId ?? null);
    setShowHint(false);
  }, [lessonId, requestedExampleId]);

  // Sync spreadsheet whenever active exercise or loaded example changes
  useEffect(() => {
    const baseSheet = { ...activeContext.initialSheet };
    if (activeExample) {
      baseSheet[activeExample.targetCell] = activeExample.formula;
    }
    setSheet(baseSheet);
    setActiveSheetTab('primary');
    setSelectedCell(activeContext.targetCell);
    setFormulaDraft(String(baseSheet[activeContext.targetCell] ?? ''));
    setFilterOnlyValue(false);
    setCheckResult(null);
    setShowHint(false);
  }, [activeContext, activeExample]);

  const { cols: activeCols, rows: activeRows } = useMemo(
    () =>
      getSheetDimensions(
        sheet,
        activeContext.targetCell,
        4,
        6,
        activeContext.secondarySheet?.cells
      ),
    [sheet, activeContext.targetCell, activeContext.secondarySheet]
  );

  const visibleRows = useMemo(() => {
    const set = new Set<number>();
    const col = activeContext.filterColumn || 'A';
    const expected = (activeContext.filterValue || 'norte').toLowerCase();
    const lastRow = activeRows[activeRows.length - 1] ?? 6;
    activeRows.forEach((r) => {
      if (r === 1 || r === lastRow) {
        set.add(r);
        return;
      }
      if (!filterOnlyValue || !activeContext.supportsFilter) {
        set.add(r);
        return;
      }
      if (String(sheet[`${col}${r}`] ?? '').toLowerCase() === expected) {
        set.add(r);
      }
    });
    return set;
  }, [filterOnlyValue, activeContext, sheet, activeRows]);

  const computedGrid = useMemo(() => {
    void recalcTick;
    const out: Record<string, CellPrimitive> = {};
    const activeCells =
      activeSheetTab === 'secondary' && activeContext.secondarySheet
        ? activeContext.secondarySheet.cells
        : sheet;
    for (const r of activeRows) {
      for (const c of activeCols) {
        const addr = `${c}${r}`;
        const raw = activeCells[addr] ?? '';
        out[addr] = evaluateExcelFormula(raw, sheet, activeContext.secondarySheet, visibleRows);
      }
    }
    return out;
  }, [sheet, activeSheetTab, activeContext.secondarySheet, visibleRows, recalcTick, activeRows, activeCols]);

  const handleSelectCell = useCallback(
    (addr: string) => {
      setSelectedCell(addr);
      setGridMode('selected');
      setInlineDraft('');
      const source =
        activeSheetTab === 'secondary' && activeContext.secondarySheet
          ? activeContext.secondarySheet.cells
          : sheet;
      setFormulaDraft(String(source[addr] ?? ''));
    },
    [activeSheetTab, activeContext.secondarySheet, sheet]
  );

  const commitFormula = useCallback(
    (rawValue: string, forCell?: string) => {
      if (activeSheetTab === 'secondary') return;
      const cell = forCell ?? selectedCell;
      const trimmed = rawValue.trim();
      const parsed: CellPrimitive =
        trimmed !== '' && !trimmed.startsWith('=') && /^-?\d+(\.\d+)?$/.test(trimmed)
          ? Number(trimmed)
          : rawValue;
      setSheet((prev) => ({ ...prev, [cell]: parsed }));
      setCheckResult(null);
    },
    [activeSheetTab, selectedCell]
  );

  // ── Grid state-machine helpers ────────────────────────────────────────────

  /** Derive col/row from an address like "B3" */
  const parseAddr = (addr: string): { col: string; row: number } | null => {
    const m = addr.match(/^([A-L])(\d+)$/i);
    if (!m) return null;
    return { col: m[1].toUpperCase(), row: Number(m[2]) };
  };

  /** Move the active cell by one step in a direction */
  const moveActiveCell = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const p = parseAddr(selectedCell);
      if (!p) return;
      const colIdx = activeCols.indexOf(p.col);
      let newCol = p.col;
      let newRow = p.row;
      if (dir === 'up') newRow = Math.max(activeCols.length ? activeRows[0] : 1, p.row - 1);
      if (dir === 'down') newRow = Math.min(activeRows[activeRows.length - 1] ?? p.row, p.row + 1);
      if (dir === 'left') newCol = activeCols[Math.max(0, colIdx - 1)];
      if (dir === 'right') newCol = activeCols[Math.min(activeCols.length - 1, colIdx + 1)];
      const next = `${newCol}${newRow}`;
      if (next !== selectedCell) handleSelectCell(next);
    },
    [selectedCell, activeCols, activeRows, handleSelectCell]
  );

  /** Enter edit mode for the active cell, optionally with an initial character */
  const enterEditMode = useCallback(
    (initialChar?: string) => {
      if (activeSheetTab === 'secondary') return;
      const rawVal = String(sheet[selectedCell] ?? '');
      prevCellValue.current = rawVal;
      const draft = initialChar !== undefined ? initialChar : rawVal;
      setInlineDraft(draft);
      setFormulaDraft(draft);
      const mode: GridMode = draft.startsWith('=') ? 'formula-select' : 'editing';
      setGridMode(mode);
      // Focus the inline input on next frame
      requestAnimationFrame(() => inlineCellInputRef.current?.focus());
    },
    [activeSheetTab, selectedCell, sheet]
  );

  /** Commit current edit and optionally move focus */
  const commitEdit = useCallback(
    (moveDir?: 'up' | 'down' | 'left' | 'right') => {
      commitFormula(inlineDraft, selectedCell);
      setGridMode('selected');
      setInlineDraft('');
      if (moveDir) {
        // Move after committing — do it on next tick so sheet state has settled
        setTimeout(() => moveActiveCell(moveDir), 0);
      } else {
        requestAnimationFrame(() => gridContainerRef.current?.focus());
      }
    },
    [commitFormula, inlineDraft, selectedCell, moveActiveCell]
  );

  /** Cancel edit, restoring the previous value */
  const cancelEdit = useCallback(() => {
    setFormulaDraft(prevCellValue.current);
    setInlineDraft('');
    setGridMode('selected');
    requestAnimationFrame(() => gridContainerRef.current?.focus());
  }, []);

  /** Handle a click on a cell while in formula mode — inserts the cell address at cursor */
  const insertCellRef = useCallback(
    (addr: string) => {
      // Try to get cursor position from whichever input is active
      const input = inlineCellInputRef.current ?? formulaBarInputRef.current;
      const cursorPos = input?.selectionStart ?? inlineDraft.length;
      const selEnd = input?.selectionEnd ?? cursorPos;

      const before = inlineDraft.slice(0, cursorPos);
      const after = inlineDraft.slice(selEnd);

      // Strip any trailing partial cell reference so we replace it cleanly.
      // Examples handled:
      //   "="         → clean="" + "A1"  → "=A1"
      //   "=A"        → clean="=" + "A1" → "=A1"
      //   "=SUMA("    → clean="=SUMA(" + "A1" → "=SUMA(A1"
      //   "=SUMA(A1," → clean="=SUMA(A1," + "B2" → "=SUMA(A1,B2"
      //   "=A1+B"     → clean="=A1+" + "C3" → "=A1+C3"
      const cleaned = before.replace(/\$?[A-L]?\$?\d*$/i, '');

      const newDraft = cleaned + addr + after;
      setInlineDraft(newDraft);
      setFormulaDraft(newDraft);
      setGridMode('formula-select');

      // Re-focus the inline input and place cursor right after the inserted ref
      requestAnimationFrame(() => {
        const inp = inlineCellInputRef.current;
        if (inp) {
          const pos = cleaned.length + addr.length;
          inp.setSelectionRange(pos, pos);
          inp.focus();
        }
      });
    },
    [inlineDraft]
  );

  /** Handle a cell click depending on current grid mode */
  const handleCellClick = useCallback(
    (addr: string) => {
      // Insert a cell reference when in formula mode (starts with '=') OR
      // when in editing mode and the current draft starts with '=' — covers
      // the case where the user just typed '=' and the state hasn't yet
      // transitioned from 'editing' to 'formula-select'.
      const isInFormula =
        (gridMode === 'formula-select' || gridMode === 'editing') &&
        inlineDraft.startsWith('=') &&
        addr !== selectedCell;

      if (isInFormula) {
        insertCellRef(addr);
        return;
      }
      handleSelectCell(addr);
    },
    [gridMode, inlineDraft, selectedCell, insertCellRef, handleSelectCell]
  );

  /** Handle inline draft change — keep formula bar in sync and update mode */
  const handleInlineDraftChange = useCallback((val: string) => {
    setInlineDraft(val);
    setFormulaDraft(val);
    setGridMode(val.startsWith('=') ? 'formula-select' : 'editing');
  }, []);

  /** Handle formula bar change while in selected/editing mode */
  const handleFormulaBarChange = useCallback((val: string) => {
    setFormulaDraft(val);
    setInlineDraft(val);
    if (gridMode === 'selected') {
      // Automatically enter edit mode when user types in formula bar
      prevCellValue.current = String(sheet[selectedCell] ?? '');
      setGridMode(val.startsWith('=') ? 'formula-select' : 'editing');
    } else {
      setGridMode(val.startsWith('=') ? 'formula-select' : 'editing');
    }
  }, [gridMode, sheet, selectedCell]);

  /** Keyboard handler for the grid container (when NOT in an input) */
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (gridMode === 'editing' || gridMode === 'formula-select') return; // let the inline input handle it

      const dir =
        e.key === 'ArrowUp' ? 'up'
        : e.key === 'ArrowDown' ? 'down'
        : e.key === 'ArrowLeft' ? 'left'
        : e.key === 'ArrowRight' ? 'right'
        : null;

      if (dir) {
        e.preventDefault();
        moveActiveCell(dir);
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        enterEditMode();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (activeSheetTab === 'secondary') return;
        setSheet((prev) => ({ ...prev, [selectedCell]: '' }));
        setFormulaDraft('');
        setCheckResult(null);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        enterEditMode();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        moveActiveCell(e.shiftKey ? 'left' : 'right');
        return;
      }

      // Printable character → enter edit mode with that character as initial value
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        enterEditMode(e.key);
      }
    },
    [gridMode, moveActiveCell, enterEditMode, activeSheetTab, selectedCell]
  );

  /** Keyboard handler for the inline cell input */
  const handleInlineInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit('down');
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit(e.shiftKey ? 'left' : 'right');
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
        return;
      }
      // Arrow keys exit edit mode (only when NOT in formula mode)
      if (gridMode !== 'formula-select') {
        if (e.key === 'ArrowUp') { e.preventDefault(); commitEdit('up'); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); commitEdit('down'); return; }
      }
      // F4: cycle reference type (absolute/relative) on the token at cursor
      if (e.key === 'F4') {
        e.preventDefault();
        const inp = e.currentTarget;
        const pos = inp.selectionStart ?? inlineDraft.length;
        const before = inlineDraft.slice(0, pos);
        const after = inlineDraft.slice(pos);
        const refMatch = before.match(/(\$?[A-L]\$?\d+)$/i);
        if (refMatch) {
          const ref = refMatch[1];
          const cycled = cycleReference(ref);
          const newVal = before.slice(0, before.length - ref.length) + cycled + after;
          handleInlineDraftChange(newVal);
          requestAnimationFrame(() => {
            const newPos = pos - ref.length + cycled.length;
            inp.setSelectionRange(newPos, newPos);
          });
        }
      }
    },
    [gridMode, commitEdit, cancelEdit, inlineDraft, handleInlineDraftChange]
  );

  /** Keyboard handler for the formula bar input */
  const handleFormulaBarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
        return;
      }
    },
    [commitEdit, cancelEdit]
  );

  // Reset grid mode when exercise/example changes
  useEffect(() => {
    setGridMode('idle');
    setInlineDraft('');
  }, [activeContext]);

  const shiftFormulaRows = (formula: string, delta: number): string => {
    let inQuotes = false;
    let out = '';
    let i = 0;
    while (i < formula.length) {
      const ch = formula[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        out += ch;
        i++;
        continue;
      }
      if (!inQuotes) {
        const match = formula.slice(i).match(/^(\$?[A-L])(\$?)(\d+)(?![A-Za-z0-9_])/i);
        if (match) {
          const [full, colPart, rowPin, rowStr] = match;
          if (rowPin === '$') {
            out += full;
          } else {
            const nextRow = Math.max(1, Number(rowStr) + delta);
            out += `${colPart}${nextRow}`;
          }
          i += full.length;
          continue;
        }
      }
      out += ch;
      i++;
    }
    return out;
  };

  const handleFillDown = useCallback(() => {
    if (activeSheetTab === 'secondary') return;
    const match = selectedCell.match(/^([A-L])(\d+)$/i);
    if (!match) return;
    const selCol = match[1].toUpperCase();
    const startRow = Number(match[2]);
    const baseRaw = formulaDraft.trim() || String(sheet[selectedCell] ?? '').trim();
    if (!baseRaw.startsWith('=')) return;

    let lastDataRow = startRow;
    for (const r of activeRows) {
      if (r <= startRow) continue;
      const hasAdjacentData = activeCols.some(
        (c) => c !== selCol && String(sheet[`${c}${r}`] ?? '').trim() !== ''
      );
      if (hasAdjacentData) lastDataRow = r;
    }
    if (lastDataRow <= startRow) return;

    setSheet((prev) => {
      const next: SheetCells = { ...prev, [selectedCell]: baseRaw };
      for (let r = startRow + 1; r <= lastDataRow; r++) {
        next[`${selCol}${r}`] = shiftFormulaRows(baseRaw, r - startRow);
      }
      return next;
    });
    setFormulaDraft(baseRaw);
    setRecalcTick((t) => t + 1);
  }, [activeSheetTab, selectedCell, formulaDraft, sheet, activeRows, activeCols]);

  const markExerciseSolved = useCallback(
    (exId: string) => {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(18);
        } catch {
          // Ignore vibrate errors on restricted browsers
        }
      }
      setSolvedIds((prev) => {
        if (prev.includes(exId)) return prev;
        const next = [...prev, exId];
        saveSolvedSet(lessonId, next);
        if (next.length >= allExercises.length) {
          onSolved?.();
        }
        return next;
      });
    },
    [lessonId, allExercises.length, onSolved]
  );

  const handleVerifyChallenge = () => {
    if (activeExample) {
      setLoadedExampleId(null);
      return;
    }
    const targetRaw = String(sheet[activeExercise.targetCell] ?? '');
    const targetVal = evaluateExcelFormula(
      targetRaw,
      sheet,
      activeExercise.secondarySheet,
      visibleRows
    );
    const res = activeExercise.validate(targetRaw, targetVal);
    setCheckResult(res);
    if (res.ok) {
      markExerciseSolved(activeExercise.id);
    }
  };

  const handleApplySolution = () => {
    if (activeExample) {
      setLoadedExampleId(null);
    }
    setActiveSheetTab('primary');
    setSelectedCell(activeExercise.targetCell);
    setFormulaDraft(activeExercise.solutionFormula);
    const nextSheet = {
      ...activeExercise.initialSheet,
      [activeExercise.targetCell]: activeExercise.solutionFormula,
    };
    setSheet(nextSheet);
    const val = evaluateExcelFormula(
      activeExercise.solutionFormula,
      nextSheet,
      activeExercise.secondarySheet,
      visibleRows
    );
    const res = activeExercise.validate(activeExercise.solutionFormula, val);
    setCheckResult(res);
    if (res.ok) {
      markExerciseSolved(activeExercise.id);
    }
  };

  const handleLoadExample = (example: ExcelPracticalExample) => {
    setLoadedExampleId(example.id);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const solvedCount = useMemo(
    () => allExercises.filter((ex) => solvedIds.includes(ex.id)).length,
    [allExercises, solvedIds]
  );

  // Mode 2: Tab "Sintaxis & Troubleshooting"
  if (mode === 'syntax') {
    return (
      <div className="lesson-content space-y-4 text-xs min-w-0">
        {curriculum.functions.map((fn) => {
          const syntaxLines = splitSyntaxLines(fn.syntax);
          return (
            <div
              key={fn.name}
              className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-3 font-mono min-w-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300 border-b border-slate-800 pb-2.5">
                <span className="flex items-center gap-2 font-sans font-semibold text-xs text-emerald-400 min-w-0">
                  <Terminal className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 break-words">{fn.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSolved?.()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#107C41] hover:bg-[#0d6535] text-white font-sans font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>Practicar en laboratorio</span>
                </button>
              </div>

              <div className="space-y-3 text-slate-200 min-w-0">
                <p className="text-slate-300">// Sintaxis oficial:</p>
                <pre className="rounded-lg bg-slate-950/90 border border-slate-800 px-3 py-2.5 text-emerald-300 font-mono text-xs font-bold whitespace-pre-wrap break-words max-w-full overflow-x-hidden">
                  <code>{syntaxLines.join('\n')}</code>
                </pre>
                <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">{fn.summary}</p>
                <div className="divide-y divide-slate-800 border-t border-b border-slate-800 font-sans">
                  {fn.arguments.map((arg) => (
                    <div key={arg.name} className="py-2.5 space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-cyan-300 text-xs break-words">
                          {arg.name}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                            arg.required
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {arg.required ? 'Obligatorio' : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{arg.description}</p>
                    </div>
                  ))}
                </div>
                <div className="border-l-2 border-amber-400 bg-amber-950/30 pl-3 pr-2.5 py-2 text-amber-100 font-sans">
                  <span className="font-semibold block text-amber-200">Error frecuente a evitar:</span>
                  <span className="text-xs text-amber-100/90">{fn.pitfall}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const showGuide = mode === 'guide' || mode === 'lab';
  const showPractice = mode === 'practice' || mode === 'lab';

  return (
    <div className="space-y-5 min-w-0">
      {/* 1–3: Guía de Teoría, Sintaxis y Ejemplos con jerarquía plana (1 solo nivel de tarjeta) */}
      {showGuide && (
      <div className="lesson-content divide-y divide-slate-200 dark:divide-slate-800 min-w-0">
        {/* 1. INTRODUCCIÓN A LAS FUNCIONES */}
        <section className="py-4 first:pt-1 space-y-3 min-w-0">
          <div className="flex items-start gap-2.5 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-cyan-300 min-w-0">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="min-w-0 leading-snug">
              1. Introducción a las funciones · {lessonTitle}
            </span>
          </div>
          <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed">
            {curriculum.introduction}
          </p>
          <ul className="divide-y divide-slate-200/80 dark:divide-slate-800/80 border-t border-b border-slate-200 dark:border-slate-800">
            {curriculum.keyTakeaways.map((tip) => (
              <li
                key={tip}
                className="py-2.5 flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 min-w-0"
              >
                <CheckCircle2 className="w-4 h-4 text-[#107C41] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="min-w-0 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. EXPLICACIÓN DETALLADA DE CADA FUNCIÓN */}
        <section className="py-4 space-y-4 min-w-0">
          <div className="flex items-start gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 min-w-0">
            <Terminal className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="min-w-0 leading-snug">2. Explicación detallada de las funciones</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {curriculum.functions.map((fn) => {
              const syntaxLines = splitSyntaxLines(fn.syntax);
              return (
                <article key={fn.name} className="py-4 first:pt-1 last:pb-1 space-y-3 min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">
                    {fn.name}
                  </h4>

                  <pre className="rounded-lg bg-slate-900 dark:bg-[#090D16] border border-slate-800 px-3 py-2.5 text-emerald-300 font-mono text-xs font-semibold whitespace-pre-wrap break-words max-w-full overflow-x-hidden">
                    <code>{syntaxLines.join('\n')}</code>
                  </pre>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {fn.summary}
                  </p>

                  {/* Argumentos en filas limpias con separador fino */}
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80 border-t border-b border-slate-200 dark:border-slate-800">
                    {fn.arguments.map((arg) => (
                      <div key={arg.name} className="py-2.5 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-700 dark:text-cyan-300 break-words">
                            {arg.name}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                              arg.required
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {arg.required ? 'Obligatorio' : 'Opcional'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {arg.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Advertencia sin borde doble anidado */}
                  <div className="border-l-2 border-amber-500 bg-amber-50/70 dark:bg-amber-950/25 pl-3 pr-2.5 py-2 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-100 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold">Cuidado: </span>
                      <span>{fn.pitfall}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3. EJEMPLOS PRÁCTICOS */}
        <section className="py-4 space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-2.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 min-w-0">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="min-w-0 leading-snug">3. Ejemplos prácticos</span>
            </div>
            {activeExample && (
              <button
                type="button"
                onClick={() => setLoadedExampleId(null)}
                className="min-h-[36px] text-xs font-semibold text-blue-700 dark:text-cyan-300 hover:underline"
              >
                Volver al ejercicio activo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
            {curriculum.examples.map((ex) => {
              const isLoaded = loadedExampleId === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border p-3.5 sm:p-4 space-y-2.5 transition-colors min-w-0 ${
                    isLoaded
                      ? 'border-[#107C41] bg-emerald-50/50 dark:bg-emerald-950/25'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/45'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                      {ex.functionTag}
                    </span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      Resultado: <strong className="text-slate-900 dark:text-white">{ex.expectedResult}</strong>
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-50">{ex.title}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ex.scenario}
                  </p>

                  <div className="rounded-lg bg-slate-900 dark:bg-[#090D16] border border-slate-800 px-3 py-2 font-mono text-xs text-emerald-300 flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <code className="min-w-0 flex-1 whitespace-pre-wrap break-words">{ex.formula}</code>
                    <span className="text-[11px] text-slate-300 shrink-0">Celda {ex.targetCell}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (mode === 'guide' && onRequestExamplePractice) {
                        onRequestExamplePractice(ex.id);
                      } else {
                        handleLoadExample(ex);
                      }
                    }}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors min-h-[44px] ${
                      isLoaded
                        ? 'bg-[#107C41] text-white'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-[#107C41] hover:text-[#107C41] dark:hover:text-emerald-300'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {mode === 'guide' && onRequestExamplePractice
                        ? 'Probar este ejemplo en el laboratorio'
                        : isLoaded
                          ? 'Ejemplo cargado en la hoja'
                          : 'Probar ejemplo en la hoja'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {mode === 'guide' && onGoToPractice && (
          <div className="pt-4 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                ¿Listo para practicar en la hoja de cálculo?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tienes {allExercises.length} ejercicios interactivos listos ({solvedCount} resueltos).
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToPractice}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-4 py-2.5 text-xs font-semibold text-white transition-colors min-h-[44px] shrink-0"
            >
              <span>Ir a los ejercicios en Excel</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
      )}

      {/* 4. MÍNIMO 10 EJERCICIOS INTERACTIVOS EN EXCEL */}
      {showPractice && (
      <>
      <section
        ref={gridRef}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 overflow-hidden min-w-0"
      >
        {/* Header + Exercise Progress */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-7 h-6 rounded bg-[#107C41] text-white font-serif italic font-bold text-xs shrink-0">
                fx
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 min-w-0">
                <ClipboardList className="w-4 h-4 text-[#107C41] shrink-0" />
                <span className="min-w-0">4. Ejercicios prácticos en Excel ({allExercises.length} retos)</span>
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {canAdminManage && (
                <button
                  type="button"
                  onClick={() => setCreatorOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-3 py-2 text-xs font-semibold text-white transition-colors shadow-xs min-h-[44px]"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Crear ejercicio</span>
                </button>
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                Resueltos: {solvedCount}/{allExercises.length}
              </span>
              <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#107C41] transition-all duration-300"
                  style={{
                    width: `${Math.round((solvedCount / (allExercises.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Numbered Exercise Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
            {allExercises.map((ex, idx) => {
              const isSolved = solvedIds.includes(ex.id);
              const isActive = !activeExample && safeIdx === idx;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    setLoadedExampleId(null);
                    setExerciseIdx(idx);
                  }}
                  title={`${ex.number}. ${ex.title} (${ex.functionTag})`}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[44px] min-w-[58px] shrink-0 ${
                    isActive
                      ? 'bg-[#107C41] border-[#107C41] text-white shadow-xs'
                      : isSolved
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : ex.isCustom
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isSolved && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>Ej. {ex.number}</span>
                </button>
              );
            })}
          </div>

          {/* Active Prompt / Loaded Example Banner */}
          {activeExample ? (
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-800 dark:text-indigo-200 block">
                  Modo Ejemplo en vivo: {activeExample.title}
                </span>
                <span className="text-indigo-700 dark:text-indigo-300">
                  Modifica cualquier celda para experimentar o vuelve al ejercicio #{activeExercise.number}.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLoadedExampleId(null)}
                className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                Ir al Ejercicio {activeExercise.number}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#107C41] text-white font-bold text-[11px]">
                    Ejercicio {activeExercise.number} de {allExercises.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono font-semibold text-emerald-700 dark:text-emerald-300 text-[11px]">
                    {activeExercise.functionTag}
                  </span>
                  {activeExercise.isCustom && (
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                      Personalizado
                    </span>
                  )}
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {activeExercise.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {activeExercise.isCustom && canAdminManage && (
                      <button
                        type="button"
                        onClick={() => {
                          void deleteCustomExercise(activeExercise.id)
                            .then(() => {
                              setExerciseIdx(0);
                              setCheckResult(null);
                            })
                            .catch((err: unknown) => {
                              setCheckResult({
                                ok: false,
                                feedback:
                                  err instanceof Error
                                    ? err.message
                                    : 'Solo Marinodavidr7@gmail.com puede eliminar ejercicios.',
                              });
                            });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-300 hover:bg-red-100"
                        title="Eliminar ejercicio personalizado"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  {activeContext.supportsFilter && (
                    <button
                      type="button"
                      onClick={() => setFilterOnlyValue((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                        filterOnlyValue
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>
                        {filterOnlyValue
                          ? `Filtro: Solo ${activeContext.filterValue || 'Norte'}`
                          : `Filtrar ${activeContext.filterValue || 'Norte'}`}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRecalcTick((t) => t + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    title="Recalcular hoja (F9)"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Recalcular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheet({ ...activeExercise.initialSheet });
                      setSelectedCell(activeExercise.targetCell);
                      setFormulaDraft(String(activeExercise.initialSheet[activeExercise.targetCell] ?? ''));
                      setFilterOnlyValue(false);
                      setCheckResult(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reiniciar</span>
                  </button>
                </div>
              </div>

              <p className="text-emerald-950 dark:text-emerald-100 font-medium text-xs sm:text-sm leading-snug">
                {activeExercise.prompt}
              </p>

              {showHint && (
                <div className="rounded-md bg-white/90 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <span>{activeExercise.hint}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-blue-700 dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 min-h-[44px]"
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>{showHint ? 'Ocultar pista' : 'Ver pista'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySolution}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 min-h-[44px]"
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Ver solución</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyChallenge}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-3.5 py-2 text-xs font-semibold text-white transition-colors min-h-[44px]"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Verificar reto</span>
                  </button>
                </div>

                {safeIdx < allExercises.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setExerciseIdx((i) => Math.min(allExercises.length - 1, i + 1))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
                  >
                    <span>Siguiente ejercicio</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}

          {checkResult && (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 border ${
                checkResult.ok
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                  : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="min-w-0">{checkResult.feedback}</span>
              </div>
              {checkResult.ok && safeIdx < allExercises.length - 1 && (
                <button
                  type="button"
                  onClick={() => setExerciseIdx((i) => i + 1)}
                  className="shrink-0 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 text-xs font-semibold min-h-[40px]"
                >
                  Ir al Ej. {safeIdx + 2}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Formula Bar ─────────────────────────────────────────────────── */}
        <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 min-w-0">
          {/* Cell address indicator */}
          <span className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[48px] min-h-[38px] flex items-center justify-center shrink-0">
            {selectedCell}
          </span>
          <span className="text-xs font-serif italic font-bold text-[#107C41] dark:text-emerald-400 shrink-0">
            fx
          </span>
          <input
            ref={formulaBarInputRef}
            type="text"
            value={formulaDraft}
            disabled={activeSheetTab === 'secondary'}
            onChange={(e) => handleFormulaBarChange(e.target.value)}
            onKeyDown={handleFormulaBarKeyDown}
            onBlur={() => {
              // Only commit on blur when we were actually editing
              if (gridMode === 'editing' || gridMode === 'formula-select') {
                commitEdit();
              }
            }}
            onFocus={() => {
              // Entering formula bar counts as entering edit mode
              if (gridMode === 'idle' || gridMode === 'selected') {
                prevCellValue.current = String(sheet[selectedCell] ?? '');
                const mode: GridMode = formulaDraft.startsWith('=') ? 'formula-select' : 'editing';
                setGridMode(mode);
                setInlineDraft(formulaDraft);
              }
            }}
            placeholder={`Escribe un valor o fórmula en ${selectedCell} (inicia con =)`}
            className={`flex-1 min-w-0 w-full sm:w-auto rounded-lg border px-3 py-2 text-base sm:text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#107C41] disabled:opacity-60 min-h-[44px] transition-colors ${
              gridMode === 'formula-select'
                ? 'border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
            }`}
          />
          {/* Fill-down button (only for multi-row sheets) */}
          {activeRows.length > 6 && (
            <button
              type="button"
              disabled={
                activeSheetTab === 'secondary' ||
                !(formulaDraft.trim() || String(sheet[selectedCell] ?? '').trim()).startsWith('=')
              }
              onClick={handleFillDown}
              title="Copiar fórmula hacia las filas inferiores con referencias relativas"
              className="inline-flex items-center gap-1 rounded-lg border border-[#107C41]/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-[#107C41] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-40 min-h-[44px] shrink-0"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" />
              <span>Rellenar abajo</span>
            </button>
          )}
          {/* Mode indicator badge */}
          {(gridMode === 'editing' || gridMode === 'formula-select') && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0 ${
                gridMode === 'formula-select'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {gridMode === 'formula-select' ? 'Selección de rango' : 'Editando'}
            </span>
          )}
        </div>

        {/* ── Spreadsheet Grid ─────────────────────────────────────────────── */}
        {/*
          The grid container is a focusable div so it can receive keyboard events
          when no inline input is open. tabIndex=0 enables keyboard focus.
        */}
        <div
          ref={gridContainerRef}
          tabIndex={0}
          onKeyDown={handleGridKeyDown}
          className="overflow-auto max-h-[460px] bg-white dark:bg-[#0D1320] focus:outline-none"
          aria-label="Hoja de cálculo interactiva"
        >
          <table className="w-full border-collapse text-xs font-mono">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                <th className="w-9 border border-slate-200 dark:border-slate-800 py-1.5 text-center font-semibold" />
                {activeCols.map((c) => (
                  <th
                    key={c}
                    className={`border py-1.5 px-3 text-center font-semibold min-w-[110px] transition-colors ${
                      selectedCell.startsWith(c)
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-[#107C41] dark:text-emerald-300 border-slate-200 dark:border-slate-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((r) => {
                const hiddenByFilter = !visibleRows.has(r);
                if (hiddenByFilter) return null;
                return (
                  <tr key={r}>
                    {/* Row header */}
                    <td
                      className={`border border-slate-200 dark:border-slate-800 text-center text-[11px] font-semibold py-1.5 transition-colors ${
                        selectedCell.endsWith(String(r))
                          ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-[#107C41] dark:text-emerald-300'
                          : 'bg-slate-100/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {r}
                    </td>
                    {activeCols.map((c) => {
                      const addr = `${c}${r}`;
                      const isActive = selectedCell === addr;
                      const isEditing = isActive && (gridMode === 'editing' || gridMode === 'formula-select');
                      const isTarget =
                        addr === activeContext.targetCell && activeSheetTab === 'primary';
                      // Detect if this cell is referenced in the active formula
                      const isFormulaRef =
                        (gridMode === 'formula-select') &&
                        inlineDraft.toUpperCase().includes(addr.toUpperCase()) &&
                        !isActive;
                      const rawSource =
                        activeSheetTab === 'secondary' && activeContext.secondarySheet
                          ? activeContext.secondarySheet.cells[addr]
                          : sheet[addr];
                      const hasFormula =
                        typeof rawSource === 'string' && rawSource.startsWith('=');
                      const val = computedGrid[addr] ?? '';
                      const isErr = isExcelError(val);

                      return (
                        <td
                          key={addr}
                          onMouseDown={(e) => {
                            // KEY FIX: when in formula mode, clicking another cell must NOT
                            // steal focus from the inline input (which would trigger onBlur → commitEdit).
                            // preventDefault() on mousedown keeps the input focused, then onClick
                            // fires normally and inserts the cell reference.
                            if (
                              (gridMode === 'formula-select' || gridMode === 'editing') &&
                              !isActive
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onClick={() => handleCellClick(addr)}
                          onDoubleClick={() => {
                            handleSelectCell(addr);
                            setTimeout(() => enterEditMode(), 0);
                          }}
                          className={`border transition-colors relative p-0 ${
                            isActive
                              ? 'border-[#107C41] ring-2 ring-inset ring-[#107C41] bg-emerald-50/40 dark:bg-emerald-950/20'
                              : isFormulaRef
                                ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                                : isTarget
                                  ? 'border-blue-400 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                          } ${r === 1 ? 'font-sans font-bold bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200' : ''}`}
                        >
                          {isEditing ? (
                            /* ── Inline Cell Input (Excel-style editing) ── */
                            <input
                              ref={inlineCellInputRef}
                              type="text"
                              value={inlineDraft}
                              onChange={(e) => handleInlineDraftChange(e.target.value)}
                              onKeyDown={handleInlineInputKeyDown}
                              onBlur={() => {
                                // Only commit on blur if focus moved OUTSIDE the grid entirely
                                // (not to formula bar, not to another cell via formula point-and-click).
                                // The setTimeout lets the new activeElement settle first.
                                setTimeout(() => {
                                  const focused = document.activeElement;
                                  const inGrid = gridContainerRef.current?.contains(focused);
                                  if (focused !== formulaBarInputRef.current && !inGrid) {
                                    commitEdit();
                                  }
                                }, 80);
                              }}
                              className="w-full h-full px-2.5 py-1.5 min-h-[28px] font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                              autoComplete="off"
                              spellCheck={false}
                            />
                          ) : (
                            /* ── Display value ── */
                            <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 min-h-[28px]">
                              <span
                                className={`truncate ${
                                  isErr
                                    ? 'text-red-600 dark:text-red-400 font-bold'
                                    : hasFormula
                                      ? 'text-[#107C41] dark:text-emerald-400 font-semibold'
                                      : typeof val === 'number'
                                        ? 'text-slate-900 dark:text-slate-100'
                                        : 'text-slate-700 dark:text-slate-300 font-sans'
                                }`}
                              >
                                {String(val)}
                              </span>
                              {isTarget && (
                                <span className="text-[9px] font-sans font-semibold px-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                                  Meta
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sheet Tabs */}
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveSheetTab('primary')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeSheetTab === 'primary'
                ? 'bg-white dark:bg-[#111827] text-[#107C41] dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Hoja1
          </button>
          {activeContext.secondarySheet && (
            <button
              type="button"
              onClick={() => setActiveSheetTab('secondary')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeSheetTab === 'secondary'
                  ? 'bg-white dark:bg-[#111827] text-[#107C41] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {activeContext.secondarySheet.name}
            </button>
          )}
          <span className="ml-auto text-[10px] text-slate-400">
            Clic para seleccionar · Escribe para editar · Enter confirma · Esc cancela · F2 edita · ↑↓←→ navega
          </span>
        </div>
      </section>

      {isAdmin && (
        <ExerciseCreatorModal
          open={creatorOpen}
          defaultLessonId={lessonId}
          onClose={() => setCreatorOpen(false)}
          onCreated={() => {
            setLoadedExampleId(null);
            setExerciseIdx(allExercises.length);
          }}
        />
      )}
      </>
      )}
    </div>
  );
};
