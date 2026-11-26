import React, { useEffect, useState } from 'react';
import { Award, Check, CheckCircle2, Copy, ExternalLink, FileDown, Loader2, ShieldCheck, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate } from '../types';
import { exportCertificatePdf, formatCertificateDate } from '../utils/export';
import { generateCertificateQrDataUrl, getCertificateVerificationUrl } from '../utils/qr';

const CERT_LOGO_SRC = '/assets/aistudio/certificado-logo.png';
const DEFAULT_SIGNATURE_SRC = '/assets/aistudio/certificado-firma-default.png';

const CERTIFICATE_CSS = `
.dba-cert-root { container-type: inline-size; width: 100%; max-width: 846px; margin: 0 auto; }
.dba-cert-root .certificate {
  width: 100%; max-width: 846px; margin: 0 auto;
  aspect-ratio: 846 / 691;
  padding: 3.8cqw 6cqw 0;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  background: linear-gradient(180deg, var(--cert-paper-top), var(--cert-paper-bottom));
  border: 1px solid #d9dde6; border-radius: 12px;
  container-type: normal;
  color: var(--cert-ink);
  font-family: var(--cert-body);
  position: relative;
  overflow: hidden;
}
.dba-cert-root .logo { height: 12.4cqw; width: auto; display: block; }
.dba-cert-root .title { margin: 2.2cqw 0 0; font-family: var(--cert-head); font-weight: 600; font-size: 2.6cqw; letter-spacing: .06em; color: var(--cert-ink); }
.dba-cert-root .certifies { margin: 3.6cqw 0 0; font-size: 1.65cqw; color: var(--cert-muted); font-family: var(--cert-body); }
.dba-cert-root .name { margin: .6cqw 0 0; font-family: var(--cert-head); font-weight: 700; font-size: 3.9cqw; line-height: 1.15; color: var(--cert-ink); overflow-wrap: anywhere; word-break: break-word; max-width: 100%; }
.dba-cert-root .statement { margin: 1.7cqw 0 0; max-width: 56cqw; font-size: 1.75cqw; line-height: 1.6; color: var(--cert-muted); font-family: var(--cert-body); }
.dba-cert-root .course { margin: 1.9cqw 0 0; max-width: 80cqw; font-family: var(--cert-head); font-weight: 600; font-size: 2.25cqw; line-height: 1.25; color: var(--cert-ink); overflow-wrap: anywhere; word-break: break-word; }
.dba-cert-root .sig-line strong { display: block; margin-bottom: .3cqw; color: var(--cert-ink); font-weight: 600; font-size: 1.6cqw; }
.dba-cert-root .signatures {
  margin-top: 4.4cqw; width: 100%;
  display: flex; justify-content: center; gap: 14.7cqw; align-items: flex-start;
}
.dba-cert-root .sig-col { width: 28.4cqw; display: flex; flex-direction: column; align-items: center; }
.dba-cert-root .top { width: 100%; height: 11.2cqw; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; }
.dba-cert-root .sig-img { height: 8.4cqw; width: auto; max-width: 100%; object-fit: contain; display: block; margin-bottom: -2.4cqw; position: relative; z-index: 1; }
.dba-cert-root .date-value { height: 6cqw; margin: 0; padding-top: 2.5cqw; font-weight: 600; font-size: 2cqw; line-height: 1.15; color: var(--cert-ink); font-family: var(--cert-body); }
.dba-cert-root .sig-line { width: 100%; border-top: 1px solid var(--cert-line); padding-top: 1.1cqw; font-size: 1.45cqw; color: var(--cert-muted); font-family: var(--cert-body); }
.dba-cert-root .verify-text { margin-top: 2.6cqw; text-align: center; }
.dba-cert-root .verify-label { font-size: 1.45cqw; color: var(--cert-muted); font-family: var(--cert-body); }
.dba-cert-root .verify-code { margin: .7cqw 0; font-family: var(--cert-mono); font-weight: 500; font-size: 2.05cqw; letter-spacing: .04em; color: var(--cert-ink); }
.dba-cert-root .verify-cta { font-size: 1.3cqw; font-weight: 600; letter-spacing: .05em; color: var(--cert-ink); font-family: var(--cert-body); }
.dba-cert-root .qr { margin-top: 1.8cqw; width: 12.1cqw; height: 12.1cqw; padding: .9cqw; background: #fff; border: 1px solid #e1e5ee; border-radius: 9px; box-shadow: 0 2px 8px rgba(17,26,44,.08); }
.dba-cert-root .qr img { width: 100%; height: 100%; display: block; }
.dba-cert-root .hash { margin: auto 0 0; padding-bottom: 3.2cqw; padding-top: 1.6cqw; font-family: var(--cert-mono); font-size: 1.28cqw; color: #55607a; word-break: break-all; line-height: 1.4; }
@page { size: 210mm 171.5mm; margin: 0; }
@media print {
  .dba-cert-root { max-width: none; width: 210mm; }
  .dba-cert-root .certificate { border: 0; border-radius: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

interface CertificateDocumentProps {
  certificate: Certificate;
  isSample?: boolean;
}

export const CertificateDocumentCard: React.FC<CertificateDocumentProps> = ({
  certificate,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    void generateCertificateQrDataUrl(certificate, 320).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [certificate.id, certificate.verificationCode]);

  const instructorName = certificate.instructorName?.trim() || 'Instructor DB Academy';
  const signatureSrc = (certificate as Certificate & { instructorSignatureUrl?: string }).instructorSignatureUrl || DEFAULT_SIGNATURE_SRC;
  const issuedDate = formatCertificateDate(certificate.issuedAt);

  return (
    <div
      className="dba-cert-root"
      style={{
        ['--cert-ink' as string]: '#111a2c',
        ['--cert-muted' as string]: '#475069',
        ['--cert-line' as string]: '#8a93a6',
        ['--cert-paper-top' as string]: '#ffffff',
        ['--cert-paper-bottom' as string]: '#f1f4f9',
        ['--cert-head' as string]: '"IBM Plex Sans", "Inter", system-ui, "Segoe UI", Arial, sans-serif',
        ['--cert-body' as string]: '"Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
        ['--cert-mono' as string]: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{CERTIFICATE_CSS}</style>
      <main className="certificate" aria-label={`Certificado ${certificate.verificationCode}`}>
        <img className="logo" src={CERT_LOGO_SRC} alt="DB Academy" />

        <h1 className="title">CERTIFICADO OFICIAL DE FINALIZACIÓN</h1>

        <p className="certifies">Se certifica que / This certifies that</p>
        <p className="name">{certificate.studentName}</p>

        <p className="statement">ha completado satisfactoriamente el 100% de los módulos, prácticas y evaluaciones del programa:</p>
        <p className="course">{certificate.courseTitle}</p>

        <div className="signatures">
          <div className="sig-col">
            <div className="top">
              <img className="sig-img" src={signatureSrc} alt={`Firma de ${instructorName}`} crossOrigin="anonymous" />
              <div className="sig-line"><strong>{instructorName}</strong>Instructor · DB Academy</div>
            </div>
            <div className="verify-text">
              <div className="verify-label">Código de Verificación</div>
              <div className="verify-code">{certificate.verificationCode}</div>
              <div className="verify-cta">ESCANEA PARA VERIFICAR</div>
            </div>
          </div>
          <div className="sig-col">
            <div className="top">
              <div className="date-value">{issuedDate}</div>
              <div className="sig-line">Fecha de Emisión</div>
            </div>
            <div className="qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`Código QR de verificación ${certificate.verificationCode}`} />
              ) : (
                <div style={{ width: '100%', height: '100%' }} aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        <p className="hash">DB Academy Firma Digital SHA-256 {certificate.hashSignature}</p>
      </main>
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
    const code = certificate.verificationCode || certificate.id;
    const url = `/verificar/${encodeURIComponent(code)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  void setActiveView; // kept for interface stability if needed

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
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
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
