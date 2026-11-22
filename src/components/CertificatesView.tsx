import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  Award,
  CheckCircle2,
  FileDown,
  FileText,
  Filter,
  Linkedin,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { db } from '../firebase';
import type { Certificate } from '../types';
import { exportCertificatePdf } from '../utils/export';
import { computeUserBadges, type DigitalBadge } from '../utils/badges';
import { AuthGateNotice } from './AuthGateNotice';
import { BadgeModal } from './BadgeModal';
import { DigitalBadgeCard } from './DigitalBadgeCard';

export const CertificatesView: React.FC = () => {
  const { user, certificates, enrollments, t } = usePlatform();
  const [activeTab, setActiveTab] = useState<'badges' | 'certificates' | 'verify'>('badges');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<DigitalBadge | null>(null);

  const [lookupId, setLookupId] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifiedBadge, setVerifiedBadge] = useState<DigitalBadge | null>(null);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  // Compute all available and unlocked badges for this user
  const userBadges = useMemo(() => {
    return computeUserBadges(user, certificates, enrollments);
  }, [user, certificates, enrollments]);

  const filteredBadges = useMemo(() => {
    return userBadges.filter((b) => {
      if (badgeFilter === 'unlocked') return b.unlocked;
      if (badgeFilter === 'locked') return !b.unlocked;
      return true;
    });
  }, [userBadges, badgeFilter]);

  const unlockedCount = useMemo(() => userBadges.filter((b) => b.unlocked).length, [userBadges]);

  // Handle URL verification param on mount (e.g. from LinkedIn link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyParam = urlParams.get('verify');
      if (verifyParam) {
        setLookupId(verifyParam);
        setActiveTab('verify');
        void performVerification(verifyParam);
      }
    }
  }, [certificates, userBadges]);

  if (!user) return <AuthGateNotice />;

  const performVerification = async (cleaned: string) => {
    if (!cleaned) return;

    // Check in local certificates
    const localCert = certificates.find(
      (c) => c.verificationCode === cleaned || c.id === cleaned
    );
    if (localCert) {
      setVerifiedCert(localCert);
      setVerifiedBadge(null);
      setLookupStatus('found');
      return;
    }

    // Check in user badges
    const localBadge = userBadges.find((b) => b.code === cleaned || b.id === cleaned);
    if (localBadge) {
      setVerifiedBadge(localBadge);
      setVerifiedCert(null);
      setLookupStatus('found');
      return;
    }

    // Check in Firestore certificates collection
    try {
      const snap = await getDoc(doc(db, 'certificates', cleaned));
      if (snap.exists()) {
        setVerifiedCert(snap.data() as Certificate);
        setVerifiedBadge(null);
        setLookupStatus('found');
      } else {
        setVerifiedCert(null);
        setVerifiedBadge(null);
        setLookupStatus('not_found');
      }
    } catch {
      setVerifiedCert(null);
      setVerifiedBadge(null);
      setLookupStatus('not_found');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await performVerification(lookupId.trim());
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span>Insignias Digitales y Certificados</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              LinkedIn Ready
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {unlockedCount} de {userBadges.length} insignias desbloqueadas · Firma criptográfica SHA-256 verificable
          </p>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'badges'
                ? 'bg-white dark:bg-[#1A2333] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Insignias para LinkedIn ({unlockedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'certificates'
                ? 'bg-white dark:bg-[#1A2333] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Diplomas PDF ({certificates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'verify'
                ? 'bg-white dark:bg-[#1A2333] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verificar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DIGITAL BADGES FOR LINKEDIN */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* LinkedIn Integration Banner */}
          <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 dark:from-[#0B1728] dark:via-[#091120] dark:to-[#070D18] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-[#0A66C2] text-white shrink-0 shadow-md shadow-[#0A66C2]/20">
                <Linkedin className="w-6 h-6 fill-current" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Acredita tus competencias técnicas directamente en LinkedIn
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Cada insignia incluye integración oficial <strong>1-Click Add-to-Profile</strong> que completa automáticamente el formulario de certificaciones de LinkedIn con tu nombre, DB Academy como emisor, ID oficial y enlace de validación criptográfica SHA-256.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 text-xs shrink-0 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setBadgeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  badgeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({userBadges.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  badgeFilter === 'unlocked'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Desbloqueadas ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('locked')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  badgeFilter === 'locked'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Próximas ({userBadges.length - unlockedCount})
              </button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBadges.map((badge) => (
              <DigitalBadgeCard
                key={badge.id}
                badge={badge}
                onOpenDetails={(b) => setSelectedBadge(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TRADITIONAL PDF DIPLOMAS */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center space-y-3">
              <Award className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Aún no tienes diplomas académicos generados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Completa el 100% de las lecciones del Curso de Excel para emitir automáticamente tu diploma oficial en PDF de alta resolución con sello de firma digital.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-5 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {cert.verificationCode}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        100% Completado · {cert.instructorName}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {cert.courseTitle}
                    </h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {cert.studentName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate pt-2">
                      Firma Digital SHA-256: {cert.hashSignature}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const matchedBadge = userBadges.find((b) => b.code === cert.verificationCode);
                        if (matchedBadge) setSelectedBadge(matchedBadge);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      <Linkedin className="w-3.5 h-3.5 fill-current" />
                      <span>Ver insignia para LinkedIn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportCertificatePdf(cert)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition min-h-[40px]"
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
      )}

      {/* TAB 3: VERIFICATION LOOKUP */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <form
            onSubmit={(e) => void handleVerify(e)}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4 shadow-sm"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Verificador Criptográfico de Credenciales DB Academy</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ingresa el código único (ej. CAT-EXCE-XXXXXX o DB-EXCEL-XXXXXX) para validar su autenticidad y fecha de emisión.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Código de verificación (ej. CAT-EXCE-...) o SHA-256"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-semibold text-white transition min-h-[44px]"
              >
                <Search className="w-4 h-4" />
                <span>Validar Credencial</span>
              </button>
            </div>
          </form>

          {lookupStatus === 'found' && (verifiedCert || verifiedBadge) && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500 text-white shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Credencial Oficial Válida
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {verifiedCert?.courseTitle || verifiedBadge?.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Otorgado a: <strong>{verifiedCert?.studentName || verifiedBadge?.studentName}</strong> · Código: <code className="font-mono font-bold text-slate-900 dark:text-white">{verifiedCert?.verificationCode || verifiedBadge?.code}</code>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 pt-1">
                    SHA-256: {verifiedCert?.hashSignature || verifiedBadge?.hashSignature}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {verifiedCert && (
                  <button
                    type="button"
                    onClick={() => exportCertificatePdf(verifiedCert)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    Descargar Diploma PDF
                  </button>
                )}
                {verifiedBadge && (
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(verifiedBadge)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Ver Insignia para LinkedIn
                  </button>
                )}
              </div>
            </div>
          )}

          {lookupStatus === 'not_found' && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-5 text-center text-xs text-red-600 dark:text-red-400">
              No se encontró ninguna credencial registrada con el código proporcionado. Verifica los caracteres e intenta nuevamente.
            </div>
          )}
        </div>
      )}

      {/* Interactive Badge Modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};
