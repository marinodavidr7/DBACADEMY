import React, { useEffect, useState } from 'react';
import { Award, Check, CheckCircle2, Copy, ExternalLink, FileDown, QrCode, ShieldCheck, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate } from '../types';
import { exportCertificatePdf, formatCertificateDate } from '../utils/export';
import { generateCertificateQrDataUrl, getCertificateVerificationUrl } from '../utils/qr';
import {
  DAVID_SIGNATURE_DOT,
  DAVID_SIGNATURE_STROKES,
  DAVID_SIGNATURE_VIEWBOX,
  DAVID_SIGNER_NAME,
  DAVID_SIGNER_TITLE,
} from '../utils/signature';

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
    <div className="relative w-full rounded-xl bg-gradient-to-b from-[#FAFBFD] via-white to-[#F1F5F9] text-[#0F172A] px-6 py-8 sm:px-12 sm:py-10 shadow-md border border-slate-200 overflow-hidden select-none text-center">
      {isSample && (
        <span className="absolute top-3.5 right-3.5 rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          Vista previa de diseño
        </span>
      )}

      {/* Official Centered Logo */}
      <div className="flex justify-center">
        <img
          src="/assets/aistudio/logo-db-academy-light.png"
          alt="DB Academy"
          referrerPolicy="no-referrer"
          className="h-20 sm:h-24 w-auto object-contain"
        />
      </div>

      {/* Main Certificate Title */}
      <h2 className="mt-3 font-display text-lg sm:text-2xl font-extrabold uppercase tracking-wide text-[#0F172A] text-balance">
        Certificado Oficial de Finalización
      </h2>

      {/* Recipient & Completion Copy */}
      <p className="mt-4 text-xs sm:text-sm text-slate-600">
        Se certifica que / This certifies that
      </p>

      <h3 className="mt-1.5 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0F172A] text-balance">
        {certificate.studentName}
      </h3>

      <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
        ha completado satisfactoriamente el 100% de los módulos, prácticas y evaluaciones del programa:
      </p>

      <p className="mt-2.5 font-display text-base sm:text-xl font-bold text-[#0F172A] max-w-2xl mx-auto text-balance">
        {certificate.courseTitle}
      </p>

      {/* 2-Column Signature (David) & Issue Date */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-14 max-w-2xl mx-auto items-end">
        <div className="flex flex-col items-center">
          <svg
            viewBox={DAVID_SIGNATURE_VIEWBOX}
            fill="none"
            role="img"
            aria-label={`Firma de ${DAVID_SIGNER_NAME}`}
            className="h-11 sm:h-12 w-auto -mb-1 pointer-events-none"
          >
            {DAVID_SIGNATURE_STROKES.map((s, idx) => (
              <path
                key={idx}
                d={s.d}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={s.opacity}
              />
            ))}
            <circle
              cx={DAVID_SIGNATURE_DOT.cx}
              cy={DAVID_SIGNATURE_DOT.cy}
              r={DAVID_SIGNATURE_DOT.r}
              fill={DAVID_SIGNATURE_DOT.fill}
            />
          </svg>
          <p className="text-sm sm:text-base font-semibold text-[#0F172A] truncate max-w-full">
            {DAVID_SIGNER_NAME}
          </p>
          <div className="mt-1.5 w-full max-w-[240px] border-t border-slate-400" />
          <p className="mt-1.5 text-xs text-slate-600 truncate max-w-full">
            {DAVID_SIGNER_TITLE}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm sm:text-base font-semibold text-[#0F172A]">
            {formatCertificateDate(certificate.issuedAt)}
          </p>
          <div className="mt-1.5 w-full max-w-[240px] border-t border-slate-400" />
          <p className="mt-1.5 text-xs text-slate-600">Fecha de Emisión</p>
        </div>
      </div>

      {/* Centered Verification Code + Scannable QR */}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="text-center sm:text-left space-y-0.5">
          <p className="text-xs text-slate-600">Código de Verificación</p>
          <p className="text-sm sm:text-base font-bold font-mono tracking-wide text-[#0F172A]">
            {certificate.verificationCode}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
            Escanea para verificar
          </p>
        </div>

        <div className="shrink-0 rounded-md border border-slate-200 bg-white p-1.5 shadow-xs">
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
      </div>

      {/* Bottom Centered SHA-256 Signature */}
      <p className="mt-6 text-[10px] sm:text-[11px] font-mono text-slate-500 break-all">
        DB Academy Firma Digital SHA-256 {certificate.hashSignature}
      </p>
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
