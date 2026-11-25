import React, { useState } from 'react';
import { Eye, Palette, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  CHRISTMAS_THEME,
  HOLIDAY_THEMES,
  type SeasonalThemeId,
} from '../config/holidays.config';
import { useSeasonalTheme, useSeasonalThemePreview } from '../hooks/useSeasonalTheme';
import { usePlatform } from '../context/PlatformContext';

const OPTIONS: Array<{ id: SeasonalThemeId; label: string }> = [
  { id: CHRISTMAS_THEME.id, label: `🎄 ${CHRISTMAS_THEME.label}` },
  ...HOLIDAY_THEMES.map((item) => ({ id: item.id, label: item.label })),
];

export const AdminThemePanel: React.FC = () => {
  const { isAdmin } = usePlatform();
  const theme = useSeasonalTheme();
  const { previewId, setPreviewId, resetPreview } = useSeasonalThemePreview();
  const [selected, setSelected] = useState<SeasonalThemeId | 'auto'>(
    previewId === 'auto' ? 'auto' : previewId
  );

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Esta herramienta está disponible sólo para administradores.
      </div>
    );
  }

  const preview = () => {
    setPreviewId(selected);
    const url = selected === 'auto' ? '/' : `/?theme=${encodeURIComponent(selected)}`;
    window.location.assign(url);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--dba-bg-elevated)] p-2.5 text-[var(--dba-accent-ink)]">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Apariencia · Temas estacionales
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Previsualiza y fuerza temas de fechas patrias y Navidad sin esperar a la fecha real.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200 flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          El override es <strong>privado para tu sesión</strong> (sessionStorage + parámetro URL).
          Estudiantes, profesores y visitantes en incógnito siguen viendo el tema automático por fecha.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 dark:border-slate-800 dark:bg-[#111827]">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Selecciona un tema</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            «Automático» respeta la fecha real del sistema (1-31 de diciembre y las fechas patrias configuradas).
          </p>
        </div>

        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
          Tema activo
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value as SeasonalThemeId | 'auto')}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="auto">Automático (por fecha)</option>
            {OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Tema vigente en esta vista: {theme.label}
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Estado: {previewId === 'auto' ? 'Automático' : `Vista previa de ${previewId}`}
            {theme.isPreview && ' · badge de previsualización activo'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={preview}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Eye className="h-4 w-4" />
            Ver Landing con este tema
          </button>
          <button
            type="button"
            onClick={() => {
              resetPreview();
              setSelected('auto');
            }}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Restablecer automático
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Al cerrar sesión se elimina automáticamente la bandera de previsualización.
      </p>
    </div>
  );
};
