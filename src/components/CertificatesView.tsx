import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Award, CheckCircle2, FileDown, ShieldCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { db } from '../firebase';
import type { Certificate } from '../types';
import { exportCertificatePdf } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';

export const CertificatesView: React.FC = () => {
  const { user, certificates, t } = usePlatform();
  const [lookupId, setLookupId] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  if (!user) return <AuthGateNotice />;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupId.trim();
    if (!cleaned) return;
    const localMatch = certificates.find(
      (c) => c.verificationCode === cleaned || c.id === cleaned
    );
    if (localMatch) {
      setVerifiedCert(localMatch);
      setLookupStatus('found');
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'certificates', cleaned));
      if (snap.exists()) {
        setVerifiedCert(snap.data() as Certificate);
        setLookupStatus('found');
      } else {
        setVerifiedCert(null);
        setLookupStatus('not_found');
      }
    } catch {
      setVerifiedCert(null);
      setLookupStatus('not_found');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('certificatesTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {certificates.length} certificados emitidos con firma SHA-256 verificable
        </p>
      </div>

      {/* Verification Lookup Bar */}
      <form
        onSubmit={(e) => void handleVerify(e)}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder={t('verifyCertPlaceholder')}
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-5 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 min-h-[42px]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('verifyBtn')}</span>
        </button>
      </form>

      {lookupStatus === 'found' && verifiedCert && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Credencial válida · {verifiedCert.studentName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {verifiedCert.courseTitle} · {verifiedCert.verificationCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportCertificatePdf(verifiedCert)}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            {t('downloadPdf')}
          </button>
        </div>
      )}

      {lookupStatus === 'not_found' && (
        <p className="text-xs text-red-600 dark:text-red-400">
          No se encontró un certificado con ese código o identificador.
        </p>
      )}

      {/* Issued Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
          <Award className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Completa el 100% de las lecciones de cualquier curso para generar automáticamente tu certificado PDF verificable.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {cert.verificationCode}
                  </span>
                  <span>100% · {cert.instructorName}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {cert.courseTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {cert.studentName}
                </p>
                <p className="mt-3 text-[11px] font-mono text-slate-400 truncate">
                  SHA-256: {cert.hashSignature}
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => exportCertificatePdf(cert)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors min-h-[40px]"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{t('downloadPdf')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
