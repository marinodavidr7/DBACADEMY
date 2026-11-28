import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Check, ChevronRight, HelpCircle, Keyboard, Layers, Play, Plus, RotateCcw, Square, StopCircle, Target, X } from 'lucide-react';

const COLS = ['A', 'B', 'C', 'D', 'E'] as const;
type ColLetter = (typeof COLS)[number];
const ROWS = [1, 2, 3, 4, 5] as const;
type RowNumber = (typeof ROWS)[number];

const SAMPLE_DATA: Record<string, string> = {
  A1: 'Código',
  B1: 'Categoría',
  C1: 'Producto',
  D1: 'Precio',
  E1: 'Stock',
  A2: 'F-01',
  B2: 'Frutas',
  C2: 'Banana',
  D2: '$1.20',
  E2: '50',
  A3: 'F-02',
  B3: 'Frutas',
  C3: 'Manzana',
  D3: '$1.50',
  E3: '35',
  A4: 'V-01',
  B4: 'Verduras',
  C4: 'Zanahoria',
  D4: '$0.90',
  E4: '40',
  A5: 'L-01',
  B5: 'Lácteos',
  C5: 'Leche',
  D5: '$2.10',
  E5: '22',
};

type SelectionMode = 'cell' | 'col' | 'row';

type Challenge = {
  id: string;
  title: string;
  instruction: string;
  shortcut: string;
  check: (ctx: {
    mode: SelectionMode;
    col: ColLetter;
    row: RowNumber;
    rangeEndCol: ColLetter;
    rangeEndRow: RowNumber;
    lastKey: string | null;
  }) => boolean;
};

const CHALLENGES_1_2: Challenge[] = [
  {
    id: 'tab-right',
    title: 'Moverse a la derecha',
    instruction: 'Presiona Tab para moverte a la derecha. Llega a la celda D1.',
    shortcut: 'Tab',
    check: ({ mode, col, row }) => mode === 'cell' && col === 'D' && row === 1,
  },
  {
    id: 'enter-down',
    title: 'Moverse hacia abajo',
    instruction: 'Presiona Enter para bajar una fila. Llega a la celda D2.',
    shortcut: 'Enter',
    check: ({ mode, col, row }) => mode === 'cell' && col === 'D' && row === 2,
  },
  {
    id: 'arrows',
    title: 'Navegar con flechas',
    instruction: 'Usa las flechas del teclado para llegar a la celda B3.',
    shortcut: 'Flechas',
    check: ({ mode, col, row }) => mode === 'cell' && col === 'B' && row === 3,
  },
  {
    id: 'shift-arrows',
    title: 'Ampliar selección',
    instruction: 'Mantén Shift y usa las flechas para ampliar la selección desde B3 hasta C4.',
    shortcut: 'Shift + Flechas',
    check: ({ mode, col, row, rangeEndCol, rangeEndRow }) =>
      mode === 'cell' &&
      ((col === 'B' && row === 3 && rangeEndCol === 'C' && rangeEndRow === 4) ||
        (col === 'C' && row === 4 && rangeEndCol === 'B' && rangeEndRow === 3)),
  },
  {
    id: 'ctrl-home',
    title: 'Ir al inicio',
    instruction: 'Presiona Ctrl+Inicio (o usa el botón de simulación) para ir a la celda A1.',
    shortcut: 'Ctrl + Inicio',
    check: ({ mode, col, row }) => mode === 'cell' && col === 'A' && row === 1,
  },
  {
    id: 'shift-space',
    title: 'Seleccionar fila completa',
    instruction: 'Presiona Shift+Espacio para seleccionar la fila completa de la celda activa.',
    shortcut: 'Shift + Espacio',
    check: ({ mode }) => mode === 'row',
  },
  {
    id: 'ctrl-space',
    title: 'Seleccionar columna completa',
    instruction: 'Presiona Ctrl+Espacio para seleccionar la columna completa de la celda activa.',
    shortcut: 'Ctrl + Espacio',
    check: ({ mode }) => mode === 'col',
  },
  {
    id: 'ctrl-arrow',
    title: 'Saltar al borde de datos',
    instruction: 'Desde una celda dentro de datos, presiona Ctrl+Flecha para saltar al borde del rango con datos. Llega a E1 o E5 desde la columna actual.',
    shortcut: 'Ctrl + Flechas',
    check: ({ mode, col, row, lastKey }) =>
      mode === 'cell' && (col === 'E' || col === 'A' || row === 1 || row === 5) && !!lastKey?.startsWith('ctrl-arrow'),
  },
  {
    id: 'tab-sequence',
    title: 'Recorrer con Tab',
    instruction: 'Usa Tab para avanzar hasta la celda E2.',
    shortcut: 'Tab',
    check: ({ mode, col, row }) => mode === 'cell' && col === 'E' && row === 2,
  },
  {
    id: 'range-select',
    title: 'Seleccionar un rango',
    instruction: 'Selecciona el rango B2:D4. Usa Shift+Flechas o Shift+Clic desde una celda para ampliar la selección.',
    shortcut: 'Shift + Flechas / Shift + Clic',
    check: ({ mode, col, row, rangeEndCol, rangeEndRow }) => {
      if (mode !== 'cell') return false;
      const c1 = COLS.indexOf(col), c2 = COLS.indexOf(rangeEndCol);
      const r1 = ROWS.indexOf(row), r2 = ROWS.indexOf(rangeEndRow);
      const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
      const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
      return minC === 1 && maxC === 3 && minR === 1 && maxR === 3; // B2:D4
    },
  },
];

export const ExcelGridBasicsViewer: React.FC = () => {
  const [mode, setMode] = useState<SelectionMode>('cell');
  const [selectedCol, setSelectedCol] = useState<ColLetter>('C');
  const [selectedRow, setSelectedRow] = useState<RowNumber>(3);
  const [rangeEndCol, setRangeEndCol] = useState<ColLetter>('C');
  const [rangeEndRow, setRangeEndRow] = useState<RowNumber>(3);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [challengeDone, setChallengeDone] = useState<boolean[]>([]);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState('Hoja1');
  const [editingSheet, setEditingSheet] = useState(false);
  const [sheetInput, setSheetInput] = useState('Hoja1');
  const [extraSheets, setExtraSheets] = useState<string[]>([]);
  const timersRef = useRef<number[]>([]);
  const advanceTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const stopTour = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsTourRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const focusGrid = useCallback(() => {
    gridRef.current?.focus({ preventScroll: true });
  }, []);

  const selectCell = useCallback(
    (col: ColLetter, row: RowNumber, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('cell');
      setSelectedCol(col);
      setSelectedRow(row);
      setRangeEndCol(col);
      setRangeEndRow(row);
      if (!fromTour) focusGrid();
    },
    [stopTour, focusGrid]
  );

  const selectEntireColumn = useCallback(
    (col: ColLetter, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('col');
      setSelectedCol(col);
      if (!fromTour) focusGrid();
    },
    [stopTour, focusGrid]
  );

  const selectEntireRow = useCallback(
    (row: RowNumber, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('row');
      setSelectedRow(row);
      if (!fromTour) focusGrid();
    },
    [stopTour, focusGrid]
  );

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const startChallenges = useCallback(() => {
    stopTour();
    clearAdvanceTimer();
    setChallengeMode(true);
    setChallengeIdx(0);
    setChallengeDone(Array(CHALLENGES_1_2.length).fill(false));
    setChallengeFeedback(null);
    setLastKey(null);
    setMode('cell');
    setSelectedCol('C');
    setSelectedRow(1);
    setRangeEndCol('C');
    setRangeEndRow(1);
    window.setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 50);
  }, [stopTour, clearAdvanceTimer]);

  const exitChallenges = useCallback(() => {
    clearAdvanceTimer();
    setChallengeMode(false);
    setChallengeFeedback(null);
    setLastKey(null);
  }, [clearAdvanceTimer]);

  const resetChallenge = useCallback(() => {
    clearAdvanceTimer();
    setChallengeDone(Array(CHALLENGES_1_2.length).fill(false));
    setChallengeIdx(0);
    setChallengeFeedback(null);
    setLastKey(null);
    setMode('cell');
    setSelectedCol('C');
    setSelectedRow(1);
    setRangeEndCol('C');
    setRangeEndRow(1);
    window.setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 50);
  }, [clearAdvanceTimer]);

  const simulateChallengeAction = useCallback(() => {
    const ch = CHALLENGES_1_2[challengeIdx];
    if (!ch) return;
    const colIdx = COLS.indexOf(selectedCol);
    const rowIdx = ROWS.indexOf(selectedRow);
    const clampCol = (i: number) => Math.max(0, Math.min(COLS.length - 1, i));
    const clampRow = (i: number) => Math.max(0, Math.min(ROWS.length - 1, i));
    switch (ch.id) {
      case 'tab-right':
        setLastKey('tab');
        selectCell(COLS[clampCol(colIdx + 1)], selectedRow);
        break;
      case 'enter-down':
        setLastKey('enter');
        selectCell(selectedCol, ROWS[clampRow(rowIdx + 1)]);
        break;
      case 'arrows':
        setLastKey('arrow-left');
        selectCell('B', 3);
        break;
      case 'shift-arrows':
        setLastKey('shift-arrow-right');
        setMode('cell');
        setSelectedCol('B');
        setSelectedRow(3);
        setRangeEndCol('C');
        setRangeEndRow(4);
        break;
      case 'ctrl-home':
        setLastKey('ctrl-home');
        selectCell('A', 1);
        break;
      case 'shift-space':
        setLastKey('shift-space');
        setMode('row');
        setSelectedRow(selectedRow);
        break;
      case 'ctrl-space':
        setLastKey('ctrl-space');
        setMode('col');
        setSelectedCol(selectedCol);
        break;
      case 'ctrl-arrow': {
        setLastKey('ctrl-arrow-right');
        selectCell('E', selectedRow);
        break;
      }
      case 'tab-sequence':
        setLastKey('tab');
        selectCell('E', 2);
        break;
      case 'range-select':
        setLastKey('shift-arrow-right');
        setMode('cell');
        setSelectedCol('B');
        setSelectedRow(2);
        setRangeEndCol('D');
        setRangeEndRow(4);
        break;
      default:
        break;
    }
    window.setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 30);
  }, [challengeIdx, selectedCol, selectedRow, selectCell]);

  useEffect(() => {
    if (!challengeMode) return;
    const ch = CHALLENGES_1_2[challengeIdx];
    if (!ch || challengeDone[challengeIdx]) return;
    const ok = ch.check({ mode, col: selectedCol, row: selectedRow, rangeEndCol, rangeEndRow, lastKey });
    if (!ok) return;
    setChallengeDone((prev) => {
      if (prev[challengeIdx]) return prev;
      const next = [...prev];
      next[challengeIdx] = true;
      return next;
    });
    setChallengeFeedback('¡Correcto! ' + ch.title);
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      setChallengeFeedback(null);
      setChallengeIdx((i) => (i < CHALLENGES_1_2.length - 1 ? i + 1 : i));
      setLastKey(null);
      advanceTimerRef.current = null;
    }, 900);
  }, [challengeMode, challengeIdx, challengeDone, mode, selectedCol, selectedRow, rangeEndCol, rangeEndRow, lastKey]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const runAnimatedTour = useCallback(() => {
    if (isTourRunning) {
      stopTour();
      return;
    }
    stopTour();
    setIsTourRunning(true);

    // Paso 1: Mostrar Columnas (B, luego C)
    selectEntireColumn('B', true);

    const t1 = window.setTimeout(() => {
      selectEntireColumn('C', true);
    }, 1600);

    // Paso 2: Mostrar Filas (2, luego 3)
    const t2 = window.setTimeout(() => {
      selectEntireRow(2, true);
    }, 3400);

    const t3 = window.setTimeout(() => {
      selectEntireRow(3, true);
    }, 5000);

    // Paso 3: Mostrar cómo el cruce forma una Celda (C3)
    const t4 = window.setTimeout(() => {
      selectCell('C', 3, true);
    }, 6800);

    // Paso 4: Otro ejemplo de celda (D4)
    const t5 = window.setTimeout(() => {
      selectCell('D', 4, true);
    }, 9500);

    // Finalizar tour
    const t6 = window.setTimeout(() => {
      stopTour();
    }, 12200);

    timersRef.current = [t1, t2, t3, t4, t5, t6];
  }, [isTourRunning, selectCell, selectEntireColumn, selectEntireRow, stopTour]);

  // Valores dinámicos según modo
  const activeCoord = `${selectedCol}${selectedRow}`;
  const anchorC = COLS.indexOf(selectedCol);
  const anchorR = ROWS.indexOf(selectedRow);
  const endC = COLS.indexOf(rangeEndCol);
  const endR = ROWS.indexOf(rangeEndRow);
  const minC = Math.min(anchorC, endC), maxC = Math.max(anchorC, endC);
  const minR = Math.min(anchorR, endR), maxR = Math.max(anchorR, endR);
  const isRange = mode === 'cell' && (minC !== maxC || minR !== maxR);
  const rangeLabel = `${COLS[minC]}${ROWS[minR]}:${COLS[maxC]}${ROWS[maxR]}`;
  let nameBoxText = isRange ? rangeLabel : activeCoord;
  let formulaBarText = isRange ? `Rango seleccionado: ${rangeLabel}` : (SAMPLE_DATA[activeCoord] || '');
  let bannerBadge = isRange ? rangeLabel : activeCoord;
  let bannerTitle = isRange ? (
    <>
      Rango <span className="text-[#107c41] font-mono font-bold">{rangeLabel}</span> seleccionado
    </>
  ) : (
    <>
      Celda <span className="text-[#107c41] font-mono font-bold">{activeCoord}</span> = Columna{' '}
      <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedCol}</span> + Fila{' '}
      <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedRow}</span>
    </>
  );
  let bannerDesc = isRange ? (
    <>
      Has seleccionado un rango desde <strong>{COLS[minC]}{ROWS[minR]}</strong> hasta <strong>{COLS[maxC]}{ROWS[maxR]}</strong>. Puedes ampliarlo con <strong>Shift + Flechas</strong>.
    </>
  ) : (
    <>
      Esta celda contiene el dato <strong>&quot;{SAMPLE_DATA[activeCoord]}&quot;</strong> y nace
      justo en la intersección donde se cruzan la columna {selectedCol} y la fila {selectedRow}.
    </>
  );

  if (mode === 'col') {
    nameBoxText = `${selectedCol}:${selectedCol}`;
    formulaBarText = `Columna ${selectedCol} (Todas las celdas verticales de la columna ${selectedCol})`;
    bannerBadge = `Col ${selectedCol}`;
    bannerTitle = (
      <>
        Has seleccionado toda la{' '}
        <span className="text-blue-600 dark:text-blue-400 font-bold">Columna {selectedCol}</span>
      </>
    );
    bannerDesc = (
      <>
        Las columnas son grupos verticales de celdas identificadas por una <strong>letra</strong>{' '}
        (de arriba hacia abajo).
      </>
    );
  } else if (mode === 'row') {
    nameBoxText = `${selectedRow}:${selectedRow}`;
    formulaBarText = `Fila ${selectedRow} (Todas las celdas horizontales de la fila ${selectedRow})`;
    bannerBadge = `Fila ${selectedRow}`;
    bannerTitle = (
      <>
        Has seleccionado toda la{' '}
        <span className="text-amber-600 dark:text-amber-400 font-bold">Fila {selectedRow}</span>
      </>
    );
    bannerDesc = (
      <>
        Las filas son líneas horizontales de celdas identificadas por un <strong>número</strong>{' '}
        (de izquierda a derecha).
      </>
    );
  }

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const anchorColIdx = COLS.indexOf(selectedCol);
    const anchorRowIdx = ROWS.indexOf(selectedRow);
    const rangeColIdx = COLS.indexOf(rangeEndCol);
    const rangeRowIdx = ROWS.indexOf(rangeEndRow);
    const clampCol = (i: number) => Math.max(0, Math.min(COLS.length - 1, i));
    const clampRow = (i: number) => Math.max(0, Math.min(ROWS.length - 1, i));

    const moveCell = (nextColIdx: number, nextRowIdx: number, extend = false) => {
      const c = COLS[clampCol(nextColIdx)];
      const r = ROWS[clampRow(nextRowIdx)];
      if (!extend) {
        selectCell(c, r);
      } else {
        setMode('cell');
        setRangeEndCol(c);
        setRangeEndRow(r);
        focusGrid();
      }
    };

    const edgeIndex = (axis: 'col' | 'row', dir: 1 | -1, baseCol: number, baseRow: number) => {
      if (axis === 'col') {
        let i = baseCol;
        if (dir > 0) {
          while (i < COLS.length - 1) { i++; if (!SAMPLE_DATA[`${COLS[i]}${ROWS[baseRow]}`]) break; }
        } else {
          while (i > 0) { i--; if (!SAMPLE_DATA[`${COLS[i]}${ROWS[baseRow]}`]) break; }
        }
        return i;
      }
      let i = baseRow;
      if (dir > 0) {
        while (i < ROWS.length - 1) { i++; if (!SAMPLE_DATA[`${COLS[baseCol]}${ROWS[i]}`]) break; }
      } else {
        while (i > 0) { i--; if (!SAMPLE_DATA[`${COLS[baseCol]}${ROWS[i]}`]) break; }
      }
      return i;
    };

    const setKey = (k: string) => setLastKey(k);

    if (e.key === ' ' && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setKey('ctrl-space');
      selectEntireColumn(selectedCol);
      return;
    }
    if (e.key === ' ' && e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      setKey('shift-space');
      selectEntireRow(selectedRow);
      return;
    }

    const extendingFromCell = mode === 'cell';

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const extend = e.shiftKey;
        setKey(e.ctrlKey ? 'ctrl-arrow-right' : (extend ? 'shift-arrow-right' : 'arrow-right'));
        if (mode === 'col' && !extend) { selectEntireColumn(COLS[clampCol(anchorColIdx + 1)]); break; }
        const baseC = extend && extendingFromCell ? rangeColIdx : anchorColIdx;
        const baseR = extend && extendingFromCell ? rangeRowIdx : anchorRowIdx;
        if (e.ctrlKey) moveCell(edgeIndex('col', 1, baseC, baseR), baseR, extend);
        else moveCell(baseC + 1, baseR, extend);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const extend = e.shiftKey;
        setKey(e.ctrlKey ? 'ctrl-arrow-left' : (extend ? 'shift-arrow-left' : 'arrow-left'));
        if (mode === 'col' && !extend) { selectEntireColumn(COLS[clampCol(anchorColIdx - 1)]); break; }
        const baseC = extend && extendingFromCell ? rangeColIdx : anchorColIdx;
        const baseR = extend && extendingFromCell ? rangeRowIdx : anchorRowIdx;
        if (e.ctrlKey) moveCell(edgeIndex('col', -1, baseC, baseR), baseR, extend);
        else moveCell(baseC - 1, baseR, extend);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const extend = e.shiftKey;
        setKey(e.ctrlKey ? 'ctrl-arrow-down' : (extend ? 'shift-arrow-down' : 'arrow-down'));
        if (mode === 'row' && !extend) { selectEntireRow(ROWS[clampRow(anchorRowIdx + 1)]); break; }
        const baseC = extend && extendingFromCell ? rangeColIdx : anchorColIdx;
        const baseR = extend && extendingFromCell ? rangeRowIdx : anchorRowIdx;
        if (e.ctrlKey) moveCell(baseC, edgeIndex('row', 1, baseC, baseR), extend);
        else moveCell(baseC, baseR + 1, extend);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const extend = e.shiftKey;
        setKey(e.ctrlKey ? 'ctrl-arrow-up' : (extend ? 'shift-arrow-up' : 'arrow-up'));
        if (mode === 'row' && !extend) { selectEntireRow(ROWS[clampRow(anchorRowIdx - 1)]); break; }
        const baseC = extend && extendingFromCell ? rangeColIdx : anchorColIdx;
        const baseR = extend && extendingFromCell ? rangeRowIdx : anchorRowIdx;
        if (e.ctrlKey) moveCell(baseC, edgeIndex('row', -1, baseC, baseR), extend);
        else moveCell(baseC, baseR - 1, extend);
        break;
      }
      case 'Tab':
        e.preventDefault();
        setKey(e.shiftKey ? 'shift-tab' : 'tab');
        moveCell(anchorColIdx + (e.shiftKey ? -1 : 1), anchorRowIdx, false);
        break;
      case 'Enter':
        e.preventDefault();
        setKey(e.shiftKey ? 'shift-enter' : 'enter');
        moveCell(anchorColIdx, anchorRowIdx + (e.shiftKey ? -1 : 1), false);
        break;
      case 'Home':
        e.preventDefault();
        setKey(e.ctrlKey ? 'ctrl-home' : 'home');
        if (e.ctrlKey) selectCell(COLS[0], ROWS[0]);
        else moveCell(0, e.shiftKey && extendingFromCell ? rangeRowIdx : anchorRowIdx, e.shiftKey);
        break;
      case 'End':
        e.preventDefault();
        setKey(e.ctrlKey ? 'ctrl-end' : 'end');
        if (e.ctrlKey) selectCell(COLS[COLS.length - 1], ROWS[ROWS.length - 1]);
        else moveCell(COLS.length - 1, e.shiftKey && extendingFromCell ? rangeRowIdx : anchorRowIdx, e.shiftKey);
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] shadow-md overflow-hidden">
      {/* Barra Superior Verde Excel */}
      <div className="bg-[#107c41] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 p-1.5 rounded-lg font-bold text-sm select-none">⊞</div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              Anatomía de una Hoja de Cálculo
            </h3>
            <p className="text-[11px] text-emerald-100">Columnas, Filas y Celdas en 2D</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={challengeMode ? exitChallenges : startChallenges}
            className={`${challengeMode ? 'bg-amber-400 text-amber-950 hover:bg-amber-300' : 'bg-white text-[#107c41] hover:bg-emerald-50'} active:scale-95 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer min-h-[36px]`}
          >
            {challengeMode ? <X className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
            <span>{challengeMode ? 'Salir del simulador' : 'Entrar al simulador'}</span>
          </button>
          <button
            type="button"
            onClick={runAnimatedTour}
            className="bg-white/15 text-white hover:bg-white/25 active:scale-95 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
          >
            {isTourRunning ? (
              <>
                <StopCircle className="w-4 h-4 text-red-200" />
                <span>Detener</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Tour</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Cuadro de Nombres y Barra de Fórmulas */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Celda:</span>
          <div className="bg-white dark:bg-slate-800 border-2 border-[#107c41] rounded-lg px-3 py-1 text-xs sm:text-sm font-mono font-bold text-[#107c41] shadow-xs min-w-[64px] text-center">
            {nameBoxText}
          </div>
        </div>
        <div className="text-slate-400 font-serif italic font-bold text-sm select-none shrink-0">
          fx
        </div>
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 shadow-inner truncate">
          {formulaBarText}
        </div>
      </div>

      {challengeMode && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-[#107c41]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#107c41]">Simulador de desafíos · 1.2</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Práctica guiada, no evaluación oficial</span>
              </div>
              {challengeIdx < CHALLENGES_1_2.length && (
                <>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Desafío {challengeIdx + 1}/{CHALLENGES_1_2.length}: {CHALLENGES_1_2[challengeIdx].title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1">{CHALLENGES_1_2[challengeIdx].instruction}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
                      {CHALLENGES_1_2[challengeIdx].shortcut}
                    </span>
                    <button type="button" onClick={simulateChallengeAction} className="inline-flex items-center gap-1 rounded-md bg-[#107c41] text-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-[#0d6535]">
                      <ChevronRight className="w-3.5 h-3.5" /> Simular acción
                    </button>
                    <button type="button" onClick={resetChallenge} className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                    </button>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Si el navegador bloquea el atajo, usa “Simular acción”.</span>
                  </div>
                </>
              )}
              {challengeFeedback && (
                <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{challengeFeedback}</div>
              )}
              {challengeDone.length === CHALLENGES_1_2.length && challengeDone.every(Boolean) && (
                <div className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">¡Completaste los desafíos de navegación y selección de 1.2!</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CHALLENGES_1_2.map((ch, i) => (
                <div key={ch.id} title={ch.title} className={`w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center border ${challengeDone[i] ? 'bg-emerald-600 text-white border-emerald-600' : i === challengeIdx ? 'bg-white dark:bg-slate-800 text-[#107c41] border-[#107c41]' : 'bg-white/70 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                  {challengeDone[i] ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Conceptos Didácticos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        {/* Concepto 1: Columnas */}
        <button
          type="button"
          onClick={() => selectEntireColumn('C')}
          className={`text-left p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border-2 transition-all shadow-xs cursor-pointer ${
            mode === 'col'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              1. Vertical ↓
            </span>
            <span className="font-mono text-xs font-bold text-slate-400">A, B, C, D...</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            Columnas
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Van de <strong>arriba hacia abajo</strong>. Se identifican siempre con{' '}
            <strong>letras</strong> en la parte superior.
          </p>
        </button>

        {/* Concepto 2: Filas */}
        <button
          type="button"
          onClick={() => selectEntireRow(3)}
          className={`text-left p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border-2 transition-all shadow-xs cursor-pointer ${
            mode === 'row'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
              2. Horizontal →
            </span>
            <span className="font-mono text-xs font-bold text-slate-400">1, 2, 3, 4...</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            Filas
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Van de <strong>izquierda a derecha</strong>. Se identifican siempre con{' '}
            <strong>números</strong> en el borde izquierdo.
          </p>
        </button>

        {/* Concepto 3: Celdas */}
        <button
          type="button"
          onClick={() => selectCell('C', 3)}
          className={`text-left p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border-2 transition-all shadow-xs cursor-pointer ${
            mode === 'cell'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              3. Intersección ✚
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Letra + Número
            </span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            Celdas
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Es cada rectángulo donde se cruzan una <strong>Columna</strong> y una{' '}
            <strong>Fila</strong> (ej. <strong className="font-mono text-emerald-700 dark:text-emerald-400">C3</strong>).
          </p>
        </button>
      </div>

      {/* Cuadrícula Interactiva de Excel */}
      <div className="p-4 sm:p-6 overflow-x-auto bg-white dark:bg-[#070E1D]">
        <div
          ref={gridRef}
          tabIndex={0}
          role="application"
          aria-label="Cuadrícula de Excel interactiva. Usa flechas, Tab y Enter para moverte."
          onKeyDown={handleGridKeyDown}
          className="min-w-[540px] max-w-3xl mx-auto outline-none focus:ring-2 focus:ring-[#107c41]/40 rounded-lg"
        >
          <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-xs">
            {/* Encabezados de Columnas A, B, C, D, E */}
            <div className="grid grid-cols-[52px_repeat(5,1fr)] bg-slate-100 dark:bg-slate-800/80 text-center text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              <div className="p-2.5 border-r border-b border-slate-300 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800 select-none">
                ◢
              </div>
              {COLS.map((col) => {
                const isActiveCol =
                  mode === 'col' ? selectedCol === col : selectedCol === col;
                const isFullColSelected = mode === 'col' && selectedCol === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => selectEntireColumn(col)}
                    className={`p-2.5 border-r border-b border-slate-300 dark:border-slate-700 transition-colors select-none font-bold ${
                      isFullColSelected
                        ? 'bg-blue-600 text-white border-blue-700'
                        : isActiveCol
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          : 'hover:bg-blue-100/70 dark:hover:bg-blue-950/40 hover:text-blue-700'
                    }`}
                    title={`Haz clic para seleccionar toda la Columna ${col}`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>

            {/* Filas 1 a 5 */}
            {ROWS.map((row) => {
              const isFullRowSelected = mode === 'row' && selectedRow === row;
              const isRowActive = mode === 'row' ? selectedRow === row : selectedRow === row;

              return (
                <div
                  key={row}
                  className="grid grid-cols-[52px_repeat(5,1fr)] text-xs sm:text-sm"
                >
                  {/* Encabezado de fila 1, 2, 3... */}
                  <button
                    type="button"
                    onClick={() => selectEntireRow(row)}
                    className={`p-2.5 text-center font-bold border-r border-b border-slate-300 dark:border-slate-700 transition-colors select-none ${
                      isFullRowSelected
                        ? 'bg-amber-600 text-white border-amber-700'
                        : isRowActive
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100/70 hover:text-amber-800'
                    }`}
                    title={`Haz clic para seleccionar toda la Fila ${row}`}
                  >
                    {row}
                  </button>

                  {/* Celdas individuales de la fila */}
                  {COLS.map((col) => {
                    const coord = `${col}${row}`;
                    const val = SAMPLE_DATA[coord] || '';
                    const cIdx = COLS.indexOf(col);
                    const rIdx = ROWS.indexOf(row);
                    const anchorC = COLS.indexOf(selectedCol);
                    const anchorR = ROWS.indexOf(selectedRow);
                    const endC = COLS.indexOf(rangeEndCol);
                    const endR = ROWS.indexOf(rangeEndRow);
                    const minC = Math.min(anchorC, endC), maxC = Math.max(anchorC, endC);
                    const minR = Math.min(anchorR, endR), maxR = Math.max(anchorR, endR);
                    const inRange = mode === 'cell' && cIdx >= minC && cIdx <= maxC && rIdx >= minR && rIdx <= maxR;
                    const isAnchor = mode === 'cell' && selectedCol === col && selectedRow === row;
                    const isSelectedCell = isAnchor;
                    const isRangeCell = inRange && !isAnchor;
                    const isCellInActiveCol =
                      (mode === 'col' && selectedCol === col) ||
                      (mode === 'cell' && selectedCol === col && !inRange);
                    const isCellInActiveRow =
                      (mode === 'row' && selectedRow === row) ||
                      (mode === 'cell' && selectedRow === row && !inRange);
                    const isHeaderRow = row === 1;

                    let bgClass = isHeaderRow
                      ? 'bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-800 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';

                    if (isSelectedCell && inRange && (minC !== maxC || minR !== maxR)) {
                      bgClass = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold ring-2 ring-inset ring-[#107c41] z-10';
                    } else if (isSelectedCell) {
                      bgClass =
                        'bg-[#107c41] text-white font-bold ring-3 ring-[#107c41]/40 scale-[1.02] z-10';
                    } else if (isRangeCell) {
                      bgClass = 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                    } else if (isCellInActiveCol && isCellInActiveRow) {
                      bgClass = 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                    } else if (isCellInActiveCol) {
                      bgClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200';
                    } else if (isCellInActiveRow) {
                      bgClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
                    }

                    return (
                      <div
                        key={coord}
                        onClick={(e) => {
                          if (e.shiftKey && mode === 'cell') {
                            stopTour();
                            setRangeEndCol(col);
                            setRangeEndRow(row);
                            setLastKey('shift-click');
                            gridRef.current?.focus({ preventScroll: true });
                          } else {
                            selectCell(col, row);
                          }
                        }}
                        className={`p-2.5 border-r border-b border-slate-300 dark:border-slate-700 cursor-pointer flex items-center justify-between transition-all select-none hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 ${bgClass}`}
                      >
                        <span className="truncate">{val}</span>
                        <span
                          className={`text-[10px] font-mono ml-1 shrink-0 ${
                            isSelectedCell && !(inRange && (minC !== maxC || minR !== maxR)) ? 'opacity-90 text-white' : 'opacity-40'
                          }`}
                        >
                          {coord}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pestañas de hoja (Ejercicio 1.3: renombrar y añadir hoja) */}
      <div className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setEditingSheet(false); }}
            className={`px-3 py-1.5 rounded-t-md text-xs font-semibold border border-b-0 ${!extraSheets.length ? 'bg-white dark:bg-slate-800 text-[#107c41] border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-[#107c41] border-slate-300 dark:border-slate-600'}`}
            title="Doble clic para renombrar la pestaña"
            onDoubleClick={() => { setSheetInput(sheetName); setEditingSheet(true); }}
          >
            {editingSheet ? (
              <input
                autoFocus
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                onBlur={() => { const v = sheetInput.trim(); if (v) setSheetName(v); setEditingSheet(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { const v = sheetInput.trim(); if (v) setSheetName(v); setEditingSheet(false); }
                  if (e.key === 'Escape') { setEditingSheet(false); setSheetInput(sheetName); }
                }}
                className="w-24 bg-transparent outline-none text-xs font-semibold text-[#107c41]"
                aria-label="Nombre de hoja"
              />
            ) : sheetName}
          </button>
          {extraSheets.map((name, i) => (
            <span key={`${name}-${i}`} className="px-3 py-1.5 rounded-t-md text-xs font-medium bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-b-0 border-slate-300 dark:border-slate-600">
              {name}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExtraSheets((prev) => [...prev, `Hoja${prev.length + 2}`])}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Añadir hoja"
          aria-label="Añadir hoja"
        >
          <Plus className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">Doble clic para renombrar · + para añadir hoja</span>
      </div>

      {/* Panel Inferior de Explicación Dinámica */}
      <div className="bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 shadow-xs ${
              mode === 'col'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : mode === 'row'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {bannerBadge}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {bannerTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{bannerDesc}</p>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
          💡 Tip: Haz clic para seleccionar. Teclado: Flechas mueven celda, Tab/Shift+Tab derecha/izquierda, Enter/Shift+Enter abajo/arriba.
        </span>
      </div>
    </div>
  );
};
