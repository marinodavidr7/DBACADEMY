import React, { useEffect, useState } from 'react';
import { Award, Check, CheckCircle2, Copy, ExternalLink, FileDown, QrCode, ShieldCheck, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate } from '../types';
import { exportCertificatePdf, formatCertificateDate } from '../utils/export';
import { generateCertificateQrDataUrl, getCertificateVerificationUrl } from '../utils/qr';

interface CertificateDocumentProps {
  certificate: Certificate;
  isSample?: boolean;
}

export const CertificateDocumentCard: React.FC<CertificateDocumentProps> = ({
  certificate,
  isSample = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    void generateCertificateQrDataUrl(certificate, 220).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [certificate.id, certificate.verificationCode]);

  return (
    <div className="relative w-full rounded-xl bg-[#F8FAFC] text-slate-900 p-3 sm:p-5 shadow-lg border border-slate-300 overflow-hidden select-none">
      {/* Outer Navy Frame */}
      <div className="relative border-[3px] border-slate-900 p-1.5 sm:p-2">
        {/* Inner Gold Accent Frame */}
        <div className="relative border-[1.5px] border-amber-500 bg-white/95 px-5 py-6 sm:px-9 sm:py-8 text-center">
          {/* Top Blue Accent Bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#0052CC]" />

          {isSample && (
            <span className="absolute top-3 right-3 rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Vista previa de diseño
            </span>
          )}

          {/* Official Transparent Logo */}
          <div className="flex justify-center pt-1">
            <img
              src="/assets/aistudio/logo-db-academy-light.png"
              alt="DB Academy"
              referrerPolicy="no-referrer"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          <p className="mt-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#0052CC]">
            Certificado Oficial de Finalización
          </p>
          <div className="mx-auto mt-2 h-px w-48 bg-slate-200" />

          <p className="mt-4 text-xs sm:text-sm text-slate-600">
            Se certifica que / This certifies that
          </p>

          <h3 className="mt-2 font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
            {certificate.studentName}
          </h3>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            ha completado satisfactoriamente el 100% de los módulos, prácticas y evaluaciones del programa:
          </p>

          <p className="mt-2.5 font-display text-base sm:text-xl font-bold text-slate-900 max-w-2xl mx-auto text-balance">
            {certificate.courseTitle}
          </p>

          {/* Signatures + Verification Code + Scannable Verification QR */}
          <div className="mt-7 flex flex-col md:flex-row items-center md:items-end justify-between gap-5 pt-2">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-end flex-1">
              <div className="border-t border-slate-300 pt-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {certificate.instructorName}
                </p>
                <p className="text-[11px] text-slate-500">Instructor Titular</p>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {formatCertificateDate(certificate.issuedAt)}
                </p>
                <p className="text-[11px] text-slate-500">Fecha de Emisión</p>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <p className="text-xs sm:text-sm font-bold font-mono text-[#0052CC] truncate">
                  {certificate.verificationCode}
                </p>
                <p className="text-[11px] text-slate-500">Código de Verificación</p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="rounded-lg border border-slate-300 bg-white p-1.5 shadow-xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR para verificar certificado ${certificate.verificationCode}`}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center bg-slate-100 text-slate-500">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>
              <span className="mt-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
                Escanea para verificar
              </span>
            </div>
          </div>

          <p className="mt-5 text-[10px] font-mono text-slate-400 truncate text-center md:text-left">
            DB Academy · Firma Digital SHA-256: {certificate.hashSignature}
          </p>
        </div>
      </div>
    </div>
  );
};

interface CertificatePreviewModalProps {
  certificate: Certificate;
  isSample?: boolean;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certificate,
  isSample = false,
  onClose,
}) => {
  const { setActiveView } = usePlatform();
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const verifyUrl = getCertificateVerificationUrl(certificate);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportCertificatePdf(certificate);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyVerifyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback ignored if clipboard denied
    }
  };

  const handleOpenVerification = () => {
    const token = certificate.id || certificate.verificationCode;
    if (typeof window !== 'undefined') {
      const nextUrl = `${window.location.pathname}?verify=${encodeURIComponent(token)}`;
      window.history.replaceState({}, '', nextUrl);
      window.dispatchEvent(new CustomEvent('dbacademy:verify', { detail: token }));
    }
    onClose();
    setActiveView('certificates');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl p-4 sm:p-6 space-y-4 my-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Vista Previa del Certificado Oficial</span>
                {isSample && (
                  <span className="rounded bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                    Muestra Administrador
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {certificate.courseTitle} · {certificate.studentName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopyVerifyLink()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[38px]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Enlace QR copiado' : 'Copiar enlace QR'}</span>
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 px-3.5 py-2 text-xs font-semibold text-white transition-colors min-h-[38px]"
            >
              <FileDown className="w-4 h-4" />
              <span>{downloading ? 'Generando PDF...' : 'Descargar PDF con Logo y QR'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <CertificateDocumentCard certificate={certificate} isSample={isSample} />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Incluye QR verificable directamente contra la base de datos de DB Academy</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenVerification}
              className="inline-flex items-center gap-1 font-semibold text-[#0052CC] dark:text-cyan-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Probar enlace del QR</span>
            </button>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>{certificate.verificationCode}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
