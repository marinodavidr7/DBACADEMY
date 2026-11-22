import React, { useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  label: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ label }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label={label}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-[#0052CC] hover:bg-[#0747A6] px-3 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label={label}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{label}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/apple-touch-icon.png"
                    alt="DB Academy"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3
                      id="ios-install-title"
                      className="text-sm font-bold text-slate-900 dark:text-white truncate"
                    >
                      Instalar DB Academy en iOS
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Úsala a pantalla completa sin barras de Safari
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Cerrar guía de instalación"
                  className="min-w-[44px] min-h-[44px] -mr-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-[#090D16] text-xs text-slate-800 dark:text-slate-200">
                <li className="flex items-center gap-3 p-3.5">
                  <span className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">1. Pulsa «Compartir»</p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      En la barra inferior de Safari (ícono de cuadrado con flecha arriba).
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-3.5">
                  <span className="w-9 h-9 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">2. «Añadir a pantalla de inicio»</p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Desplázate hacia abajo y confirma con «Añadir».
                    </p>
                  </div>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-xs font-semibold text-white transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
