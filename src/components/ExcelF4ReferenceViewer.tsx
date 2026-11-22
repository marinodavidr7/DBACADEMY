import React, { useState } from 'react';
import { Lock, Unlock, ArrowDown, ArrowRight, RefreshCw, Key, CheckCircle, Info } from 'lucide-react';

interface F4StateInfo {
  state: string;
  type: string;
  badgeColor: string;
  colFixed: boolean;
  rowFixed: boolean;
  desc: string;
  whenCopiedDown: string;
  whenCopiedRight: string;
  exampleUse: string;
}

const F4_STATES: F4StateInfo[] = [
  {
    state: 'A1',
    type: 'Referencia Relativa',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    colFixed: false,
    rowFixed: false,
    desc: 'Es el modo predeterminado. Al copiar o arrastrar la fórmula, tanto la columna como la fila se adaptan automáticamente a la nueva posición.',
    whenCopiedDown: 'A2, A3, A4... (la fila se incrementa)',
    whenCopiedRight: 'B1, C1, D1... (la columna avanza)',
    exampleUse: 'Calcular el total por fila: =Cantidad * Precio en cada renglón.',
  },
  {
    state: '$A$1',
    type: 'Referencia Absoluta',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    colFixed: true,
    rowFixed: true,
    desc: 'Los signos $ antes de la letra y del número congelan por completo la celda. Sin importar adónde copies la fórmula, siempre apuntará a A1.',
    whenCopiedDown: '$A$1 (se mantiene exactamente igual)',
    whenCopiedRight: '$A$1 (se mantiene exactamente igual)',
    exampleUse: 'Multiplicar ventas por una celda fija de ITBIS/IVA o tipo de cambio.',
  },
  {
    state: 'A$1',
    type: 'Referencia Mixta (Fila fija)',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    colFixed: false,
    rowFixed: true,
    desc: 'El signo $ está solo antes del número 1. La fila 1 queda fija, pero la columna (A, B, C...) es libre de cambiar horizontalmente.',
    whenCopiedDown: 'A$1, A$1, A$1... (la fila no cambia)',
    whenCopiedRight: 'B$1, C$1, D$1... (la columna avanza)',
    exampleUse: 'Fila de porcentajes de descuento en el encabezado de una matriz.',
  },
  {
    state: '$A1',
    type: 'Referencia Mixta (Columna fija)',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    colFixed: true,
    rowFixed: false,
    desc: 'El signo $ está solo antes de la letra A. La columna A queda fija, pero el número de fila es libre de cambiar hacia abajo.',
    whenCopiedDown: '$A2, $A3, $A4... (la fila se incrementa)',
    whenCopiedRight: '$A1, $A1, $A1... (la columna no cambia)',
    exampleUse: 'Columna lateral de precios base en tablas de doble entrada.',
  },
];

export const ExcelF4ReferenceViewer: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pulse, setPulse] = useState(false);

  const cycle = () => {
    setPulse(true);
    setCurrentIndex((prev) => (prev + 1) % F4_STATES.length);
    setTimeout(() => setPulse(false), 250);
  };

  const current = F4_STATES[currentIndex];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950">
                Atajo Clave de Fórmulas
              </span>
              <span className="text-xs text-emerald-100 hidden sm:inline">Tecla F4 en Windows / Cmd+T en Mac</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Selector Interactivo de Referencias (F4)
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={cycle}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black shadow-md transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-emerald-700" />
          <span>Presionar F4</span>
        </button>
      </div>

      {/* Selector interactivo central */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          {/* Display de la referencia */}
          <div className="flex items-center gap-4">
            <div
              className={`w-28 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-mono text-3xl font-black shadow-lg transition-transform ${
                pulse ? 'scale-110 ring-4 ring-emerald-300' : 'scale-100'
              }`}
            >
              {current.state}
            </div>

            <div className="space-y-1 text-left">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${current.badgeColor}`}>
                {current.type}
              </span>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  {current.colFixed ? (
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  Columna {current.colFixed ? 'Fija ($)' : 'Libre'}
                </span>
                <span className="flex items-center gap-1">
                  {current.rowFixed ? (
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  Fila {current.rowFixed ? 'Fija ($)' : 'Libre'}
                </span>
              </div>
            </div>
          </div>

          {/* Dots indicadores */}
          <div className="flex sm:flex-col items-center gap-2">
            {F4_STATES.map((s, idx) => (
              <button
                key={s.state}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentIndex === idx
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                <span className="font-mono">{s.state}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Explicación y comportamiento al arrastrar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Comportamiento
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {current.desc}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Al arrastrar hacia abajo</span>
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {current.whenCopiedDown}
            </p>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 pt-1">
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Al arrastrar a la derecha</span>
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {current.whenCopiedRight}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Caso de Uso Recomendado</span>
            </span>
            <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
              {current.exampleUse}
            </p>
          </div>
        </div>

        {/* Consejo profesional */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Atajo profesional:</strong> En la barra de fórmulas, ubica el cursor sobre cualquier referencia
            (ej. <code>A1</code>) y presiona la tecla <strong>F4</strong> repetidamente para ciclar rápidamente entre
            los 4 modos sin escribir el signo <code>$</code> manualmente.
          </span>
        </div>
      </div>
    </div>
  );
};
