import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Check, HelpCircle, Layers, Play, Square, StopCircle } from 'lucide-react';

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

export const ExcelGridBasicsViewer: React.FC = () => {
  const [mode, setMode] = useState<SelectionMode>('cell');
  const [selectedCol, setSelectedCol] = useState<ColLetter>('C');
  const [selectedRow, setSelectedRow] = useState<RowNumber>(3);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const timersRef = useRef<number[]>([]);

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

  const selectCell = useCallback(
    (col: ColLetter, row: RowNumber, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('cell');
      setSelectedCol(col);
      setSelectedRow(row);
    },
    [stopTour]
  );

  const selectEntireColumn = useCallback(
    (col: ColLetter, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('col');
      setSelectedCol(col);
    },
    [stopTour]
  );

  const selectEntireRow = useCallback(
    (row: RowNumber, fromTour = false) => {
      if (!fromTour) stopTour();
      setMode('row');
      setSelectedRow(row);
    },
    [stopTour]
  );

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
  let nameBoxText = activeCoord;
  let formulaBarText = SAMPLE_DATA[activeCoord] || '';
  let bannerBadge = activeCoord;
  let bannerTitle = (
    <>
      Celda <span className="text-[#107c41] font-mono font-bold">{activeCoord}</span> = Columna{' '}
      <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedCol}</span> + Fila{' '}
      <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedRow}</span>
    </>
  );
  let bannerDesc = (
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

        {/* Botón de Tour Guiado */}
        <button
          type="button"
          onClick={runAnimatedTour}
          className="bg-white text-[#107c41] hover:bg-emerald-50 active:scale-95 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
        >
          {isTourRunning ? (
            <>
              <StopCircle className="w-4 h-4 text-red-600" />
              <span>Detener explicación</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-[#107c41] fill-current" />
              <span>Explicación animada</span>
            </>
          )}
        </button>
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
        <div className="min-w-[540px] max-w-3xl mx-auto">
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
                    const isSelectedCell = mode === 'cell' && selectedCol === col && selectedRow === row;
                    const isCellInActiveCol =
                      (mode === 'col' && selectedCol === col) ||
                      (mode === 'cell' && selectedCol === col && !isSelectedCell);
                    const isCellInActiveRow =
                      (mode === 'row' && selectedRow === row) ||
                      (mode === 'cell' && selectedRow === row && !isSelectedCell);
                    const isHeaderRow = row === 1;

                    let bgClass = isHeaderRow
                      ? 'bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-800 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';

                    if (isSelectedCell) {
                      bgClass =
                        'bg-[#107c41] text-white font-bold ring-3 ring-[#107c41]/40 scale-[1.02] z-10';
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
                        onClick={() => selectCell(col, row)}
                        className={`p-2.5 border-r border-b border-slate-300 dark:border-slate-700 cursor-pointer flex items-center justify-between transition-all select-none hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 ${bgClass}`}
                      >
                        <span className="truncate">{val}</span>
                        <span
                          className={`text-[10px] font-mono ml-1 shrink-0 ${
                            isSelectedCell ? 'opacity-90 text-white' : 'opacity-40'
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
          💡 Tip: Haz clic en las letras o números para explorar filas y columnas completas
        </span>
      </div>
    </div>
  );
};
