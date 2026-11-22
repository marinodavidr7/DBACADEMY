import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Linkedin,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { db } from '../firebase';
import type { Certificate } from '../types';
import { exportCertificatePdf, formatCertificateDate } from '../utils/export';
import { computeUserBadges, type DigitalBadge } from '../utils/badges';
import { isSampleCertificateId } from '../utils/qr';
import { AuthGateNotice } from './AuthGateNotice';
import { BadgeModal } from './BadgeModal';
import { CertificateDocumentCard, CertificatePreviewModal } from './CertificatePreviewModal';
import { DigitalBadgeCard } from './DigitalBadgeCard';

export const CertificatesView: React.FC = () => {
  const { user, isAdmin, courses, certificates, instructorCertificates, enrollments, t } = usePlatform();
  const hasVerifyQueryParam =
    typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('verify'));

  const [activeTab, setActiveTab] = useState<'badges' | 'certificates' | 'verify'>(() => {
    if (hasVerifyQueryParam) return 'verify';
    return isAdmin ? 'certificates' : 'badges';
  });
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<DigitalBadge | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<{ cert: Certificate; isSample?: boolean } | null>(null);
  const [sampleCourseId, setSampleCourseId] = useState<string>('');
  const [sampleStudentName, setSampleStudentName] = useState<string>('María Fernanda López');

  const [lookupId, setLookupId] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifiedBadge, setVerifiedBadge] = useState<DigitalBadge | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'sample' | 'not_found'>('idle');

  const selectedSampleCourse = useMemo(
    () => courses.find((c) => c.id === sampleCourseId) || courses[0] || null,
    [courses, sampleCourseId]
  );

  const sampleCertificate: Certificate = useMemo(
    () => ({
      id: 'cert_preview_admin',
      verificationCode: 'DB-EXCEL-PREVIEW01',
      courseId: selectedSampleCourse?.id || '',
      courseTitle: selectedSampleCourse?.title || 'Nuestro curso de Excel',
      studentId: user?.uid || 'admin_preview',
      studentName: sampleStudentName.trim() || user?.displayName || 'Estudiante DB Academy',
      instructorId: selectedSampleCourse?.instructorId || 'admin',
      instructorName: selectedSampleCourse?.instructorName || 'Equipo DB Academy',
      completionPercent: 100,
      hashSignature: '8f4e2a9c1b7d3065f12a4c890de341fa7b92c6018e54ab3190cd7712e4f8a109',
      issuedAt: new Date().toISOString(),
    }),
    [selectedSampleCourse, sampleStudentName, user]
  );

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

  const performVerification = useCallback(
    async (rawCode: string) => {
      const cleaned = rawCode.trim();
      if (!cleaned) return;

      if (isSampleCertificateId(cleaned)) {
        setVerifiedCert(null);
        setVerifiedBadge(null);
        setLookupStatus('sample');
        return;
      }

      setVerifying(true);
      try {
        // 1. Validate directly against Firestore certificates collection (supports public QR scans)
        if (/^[a-zA-Z0-9_-]{1,128}$/.test(cleaned)) {
          try {
            const snap = await getDoc(doc(db, 'certificates', cleaned));
            if (snap.exists()) {
              setVerifiedCert(snap.data() as Certificate);
              setVerifiedBadge(null);
              setLookupStatus('found');
              return;
            }
          } catch {
            // Fall through to signed-in local cache lookup if offline or code is CAT-... format
          }
        }

        // 2. Check signed-in user/admin loaded certificates by verificationCode or id
        const localCert = [...certificates, ...instructorCertificates].find(
          (c) => c.verificationCode === cleaned || c.id === cleaned
        );
        if (localCert) {
          setVerifiedCert(localCert);
          setVerifiedBadge(null);
          setLookupStatus('found');
          return;
        }

        // 3. Check in user badges
        const localBadge = userBadges.find((b) => b.code === cleaned || b.id === cleaned);
        if (localBadge) {
          setVerifiedBadge(localBadge);
          setVerifiedCert(null);
          setLookupStatus('found');
          return;
        }

        setVerifiedCert(null);
        setVerifiedBadge(null);
        setLookupStatus('not_found');
      } finally {
        setVerifying(false);
      }
    },
    [certificates, instructorCertificates, userBadges]
  );

  // Handle URL verification param on mount or when clicking QR test link
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const triggerVerify = (token: string | null) => {
      if (!token) return;
      setLookupId(token);
      setActiveTab('verify');
      void performVerification(token);
    };

    const urlParams = new URLSearchParams(window.location.search);
    triggerVerify(urlParams.get('verify'));

    const onCustomVerify = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        triggerVerify(customEvent.detail);
      }
    };

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      triggerVerify(params.get('verify'));
    };

    window.addEventListener('dbacademy:verify', onCustomVerify);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('dbacademy:verify', onCustomVerify);
      window.removeEventListener('popstate', onPopState);
    };
  }, [performVerification]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await performVerification(lookupId);
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
            <span>
              Diplomas PDF ({isAdmin ? instructorCertificates.length : certificates.length})
            </span>
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
      {activeTab === 'badges' && (!user ? <AuthGateNotice /> : (
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
      ))}

      {/* TAB 2: TRADITIONAL PDF DIPLOMAS */}
      {activeTab === 'certificates' && (!user ? <AuthGateNotice /> : (
        <div className="space-y-5">
          {isAdmin && (
            <section className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-[#111827] p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0052CC] dark:text-cyan-400" />
                    <span>Vista Previa Oficial de Certificados (Administrador)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visualiza en directo el diseño final del diploma con el logo oficial de DB Academy y prueba su exportación en PDF.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewCertificate({ cert: sampleCertificate, isSample: true })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[38px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ampliar vista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportCertificatePdf(sampleCertificate)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-3.5 py-2 text-xs font-semibold text-white transition-colors min-h-[38px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Descargar PDF de muestra</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Curso a previsualizar
                  </label>
                  <select
                    value={selectedSampleCourse?.id || ''}
                    onChange={(e) => setSampleCourseId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 min-h-[38px]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre de estudiante de prueba
                  </label>
                  <input
                    type="text"
                    value={sampleStudentName}
                    onChange={(e) => setSampleStudentName(e.target.value)}
                    placeholder="Nombre completo del alumno"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 min-h-[38px]"
                  />
                </div>
              </div>

              <CertificateDocumentCard certificate={sampleCertificate} isSample={true} />
            </section>
          )}

          {(() => {
            const visibleCertificates = isAdmin ? instructorCertificates : certificates;
            if (visibleCertificates.length === 0) {
              return (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center space-y-2.5">
                  <Award className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                    {isAdmin
                      ? 'Aún no hay certificados emitidos por estudiantes'
                      : 'Aún no tienes diplomas académicos generados'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {isAdmin
                      ? 'Cuando un alumno complete el 100% de un programa aparecerá aquí automáticamente para su inspección y descarga.'
                      : 'Completa el 100% de las lecciones del curso para emitir automáticamente tu diploma oficial en PDF con el logo de DB Academy y sello de firma digital.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {isAdmin && (
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Certificados emitidos en la academia ({visibleCertificates.length})
                  </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                            {cert.verificationCode}
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            100% Completado · {cert.instructorName}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                          {cert.courseTitle}
                        </h2>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {cert.studentName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 truncate pt-1">
                          Firma Digital SHA-256: {cert.hashSignature}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const matchedBadge = userBadges.find((b) => b.code === cert.verificationCode);
                            if (matchedBadge) setSelectedBadge(matchedBadge);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          <Linkedin className="w-3.5 h-3.5 fill-current" />
                          <span>Insignia LinkedIn</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewCertificate({ cert, isSample: false })}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition min-h-[38px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Vista previa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void exportCertificatePdf(cert)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition min-h-[38px]"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>{t('downloadPdf')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ))}

      {/* TAB 3: VERIFICATION LOOKUP (PUBLIC QR + CODE VERIFIER) */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <form
            onSubmit={(e) => void handleVerify(e)}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4 shadow-sm"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Verificador Oficial por QR y Código DB Academy</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Al escanear el código QR del certificado o ingresar su ID / código de verificación, consultamos directamente los registros oficiales para confirmar su autenticidad.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="ID del certificado (ej. cert_...) o código de verificación"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={verifying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-2.5 text-xs font-semibold text-white transition min-h-[44px]"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{verifying ? 'Verificando...' : 'Validar Credencial'}</span>
              </button>
            </div>
          </form>

          {verifying && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Consultando registro oficial en DB Academy...</span>
            </div>
          )}

          {!verifying && lookupStatus === 'found' && (verifiedCert || verifiedBadge) && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/25 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        Certificado Real Verificado
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {verifiedCert?.courseTitle || verifiedBadge?.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Otorgado a: <strong>{verifiedCert?.studentName || verifiedBadge?.studentName}</strong>
                      {verifiedCert && (
                        <>
                          {' '}· Emitido el <strong>{formatCertificateDate(verifiedCert.issuedAt)}</strong>
                        </>
                      )}
                      {' '}· Código:{' '}
                      <code className="font-mono font-bold text-slate-900 dark:text-white">
                        {verifiedCert?.verificationCode || verifiedBadge?.code}
                      </code>
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 pt-1 break-all">
                      SHA-256: {verifiedCert?.hashSignature || verifiedBadge?.hashSignature}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {verifiedCert && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewCertificate({ cert: verifiedCert, isSample: false })}
                        className="rounded-xl border border-emerald-600/40 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 transition"
                      >
                        Ampliar diploma
                      </button>
                      <button
                        type="button"
                        onClick={() => void exportCertificatePdf(verifiedCert)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        Descargar PDF
                      </button>
                    </>
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

              {verifiedCert && <CertificateDocumentCard certificate={verifiedCert} isSample={false} />}
            </div>
          )}

          {!verifying && lookupStatus === 'sample' && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/25 p-5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Muestra de vista previa de diseño (no es un certificado emitido)</p>
                <p>
                  Este código QR pertenece a la plantilla de prueba del administrador. Cuando un estudiante completa el 100% de un curso, su certificado real queda registrado en la base de datos y su QR lo valida como auténtico.
                </p>
              </div>
            </div>
          )}

          {!verifying && lookupStatus === 'not_found' && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-5 text-center text-xs text-red-700 dark:text-red-300">
              Certificado no válido: no se encontró ninguna credencial oficial registrada en DB Academy con el código proporcionado.
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

      {/* Certificate Visual Preview Modal */}
      {previewCertificate && (
        <CertificatePreviewModal
          certificate={previewCertificate.cert}
          isSample={previewCertificate.isSample}
          onClose={() => setPreviewCertificate(null)}
        />
      )}
    </div>
  );
};
