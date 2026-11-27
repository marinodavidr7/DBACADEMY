import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldCheck, XCircle } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where } from '../lib/supabase/firestoreAdapter';
import { db } from '../lib/supabase/firestoreAdapter';
import type { Certificate } from '../types';
import { formatCertificateDate } from '../utils/export';
import { isSampleCertificateId } from '../utils/qr';
import { CertificateDocumentCard } from './CertificatePreviewModal';

interface CertificateVerificationPageProps {
  code: string;
  onBack: () => void;
}

export const CertificateVerificationPage: React.FC<CertificateVerificationPageProps> = ({ code, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'sample' | 'not_found'>('loading');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const cleaned = code.trim();
      if (!cleaned) {
        if (!cancelled) { setStatus('not_found'); setLoading(false); }
        return;
      }
      if (isSampleCertificateId(cleaned)) {
        if (!cancelled) { setStatus('sample'); setCert(null); setLoading(false); }
        return;
      }
      setLoading(true);
      try {
        // 1) direct doc id
        try {
          const snap = await getDoc(doc(db, 'certificates', cleaned));
          if (snap.exists()) {
            if (!cancelled) { setCert(snap.data() as Certificate); setStatus('found'); }
            return;
          }
        } catch { /* continue */ }

        // 2) query by verificationCode
        try {
          const q = query(collection(db, 'certificates'), where('verificationCode', '==', cleaned));
          const snaps = await getDocs(q);
          const first = snaps.docs[0];
          if (first) {
            if (!cancelled) { setCert(first.data() as Certificate); setStatus('found'); }
            return;
          }
        } catch { /* continue */ }

        if (!cancelled) { setCert(null); setStatus('not_found'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-[#070E1D] text-slate-900 dark:text-slate-100 px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400">DB Academy</p>
            <h1 className="text-xl sm:text-2xl font-bold mt-1">Verificación de Certificado</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-all">Código consultado: <span className="font-mono">{code}</span></p>
          </div>
          <button type="button" onClick={onBack} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]">Volver</button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Consultando registro oficial en DB Academy...</span>
          </div>
        )}

        {!loading && status === 'found' && cert && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/25 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Certificado válido
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{cert.courseTitle}</h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Otorgado a: <strong>{cert.studentName}</strong></p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Instructor: <strong>{cert.instructorName}</strong></p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Fecha de emisión: <strong>{formatCertificateDate(cert.issuedAt)}</strong></p>
                  <p className="text-[11px] font-mono text-slate-500 pt-1 break-all">Código: {cert.verificationCode} · SHA-256: {cert.hashSignature}</p>
                </div>
              </div>
            </div>
            <CertificateDocumentCard certificate={cert} />
          </div>
        )}

        {!loading && status === 'sample' && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/25 p-6 flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Muestra de vista previa (no es un certificado emitido)</p>
              <p className="text-xs mt-1">Este código pertenece a una plantilla de prueba del administrador. No corresponde a un certificado oficial emitido.</p>
            </div>
          </div>
        )}

        {!loading && status === 'not_found' && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-8 text-center space-y-2">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="font-bold text-red-700 dark:text-red-300">Certificado no válido</p>
            <p className="text-xs text-red-600 dark:text-red-400">No se encontró ninguna credencial oficial registrada en DB Academy con el código proporcionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
