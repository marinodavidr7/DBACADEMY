import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileDown,
  FileSpreadsheet,
  Gift,
  GraduationCap,
  Mail,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate, Course, Enrollment, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/currency';
import { exportTableToPdf, exportToCsv } from '../utils/export';

interface StudentsAdminPanelProps {
  onPreviewCertificate?: (cert: Certificate) => void;
}

function toEpochMs(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === 'object') {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') {
      return maybe.toDate().getTime();
    }
    if (typeof maybe.seconds === 'number') {
      return maybe.seconds * 1000;
    }
  }
  return null;
}

function formatDateEs(value: unknown): string {
  const ms = toEpochMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTimeEs(value: unknown): string {
  const ms = toEpochMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'E';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatAccessMethod(payment?: PaymentRecord): {
  label: string;
  detail: string;
  kind: 'gift_card' | 'coupon' | 'free' | 'paid';
} {
  if (!payment) {
    return { label: 'Inscripción directa', detail: 'Sin registro de pago', kind: 'paid' };
  }
  if (payment.gateway === 'gift_card' || payment.discountSource === 'gift_card') {
    return {
      label: payment.couponCode ? `Gift Card · ${payment.couponCode}` : 'Gift Card',
      detail:
        payment.amountCents > 0
          ? `Cubrió ${formatCurrency(payment.discountCents ?? 0, payment.currency)} + pago de ${formatCurrency(payment.amountCents, payment.currency)}`
          : `Canje completo (${formatCurrency(payment.discountCents ?? payment.originalAmountCents ?? 0, payment.currency)})`,
      kind: 'gift_card',
    };
  }
  if (payment.discountSource === 'coupon' && payment.couponCode) {
    return {
      label: `Cupón · ${payment.couponCode}`,
      detail: `${payment.gateway.toUpperCase()} · ${formatCurrency(payment.amountCents, payment.currency)}`,
      kind: 'coupon',
    };
  }
  if (payment.gateway === 'free' || payment.amountCents === 0) {
    return { label: 'Gratuito', detail: 'Acceso sin costo', kind: 'free' };
  }
  return {
    label: payment.gateway.toUpperCase(),
    detail: formatCurrency(payment.amountCents, payment.currency),
    kind: 'paid',
  };
}

export const StudentsAdminPanel: React.FC<StudentsAdminPanelProps> = ({
  onPreviewCertificate,
}) => {
  const {
    courses,
    instructorEnrollments,
    instructorPayments,
    instructorCertificates,
    studentProfilesMap,
    studentEmailsMap,
    assignmentSubmissions,
    giftCardRedemptions,
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'not_started'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {};
    for (const c of courses) map[c.id] = c;
    return map;
  }, [courses]);

  const paymentByStudentCourse = useMemo(() => {
    const map: Record<string, PaymentRecord> = {};
    for (const p of instructorPayments) {
      const key = `${p.courseId}_${p.studentId}`;
      const existing = map[key];
      if (!existing || (toEpochMs(p.createdAt) ?? 0) > (toEpochMs(existing.createdAt) ?? 0)) {
        map[key] = p;
      }
    }
    return map;
  }, [instructorPayments]);

  const certByStudentCourse = useMemo(() => {
    const map: Record<string, Certificate> = {};
    for (const cert of instructorCertificates) {
      map[`${cert.courseId}_${cert.studentId}`] = cert;
    }
    return map;
  }, [instructorCertificates]);

  const enrichedEnrollments = useMemo(() => {
    return [...instructorEnrollments]
      .sort((a, b) => (toEpochMs(b.updatedAt || b.enrolledAt) ?? 0) - (toEpochMs(a.updatedAt || a.enrolledAt) ?? 0))
      .map((enr) => {
        const profile = studentProfilesMap[enr.studentId];
        const email = enr.studentEmail || studentEmailsMap[enr.studentId] || '';
        const name = profile?.displayName || enr.studentName || 'Estudiante';
        const course = courseById[enr.courseId];
        const payment = paymentByStudentCourse[`${enr.courseId}_${enr.studentId}`];
        const certificate = certByStudentCourse[`${enr.courseId}_${enr.studentId}`];
        const totalLessons = course?.totalLessons || course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
        const completedLessonsCount = enr.completedLessonIds?.length || 0;
        const totalModules = course?.modules?.length || course?.modulesCount || 0;
        const completedModulesCount = enr.completedModuleIds?.length || 0;
        return {
          enrollment: enr,
          name,
          email,
          photoURL: profile?.photoURL || '',
          course,
          payment,
          certificate,
          totalLessons,
          completedLessonsCount,
          totalModules,
          completedModulesCount,
          access: formatAccessMethod(payment),
        };
      });
  }, [
    instructorEnrollments,
    studentProfilesMap,
    studentEmailsMap,
    courseById,
    paymentByStudentCourse,
    certByStudentCourse,
  ]);

  const uniqueStudentsCount = useMemo(() => {
    const ids = new Set(instructorEnrollments.map((e) => e.studentId));
    return ids.size;
  }, [instructorEnrollments]);

  const stats = useMemo(() => {
    const totalEnrollments = enrichedEnrollments.length;
    const completed = enrichedEnrollments.filter(
      (item) => item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100
    ).length;
    const active = totalEnrollments - completed;
    const avgProgress =
      totalEnrollments > 0
        ? Math.round(
            enrichedEnrollments.reduce((acc, item) => acc + (item.enrollment.progressPercent || 0), 0) /
              totalEnrollments
          )
        : 0;
    const totalStudyMinutes = enrichedEnrollments.reduce(
      (acc, item) => acc + (item.enrollment.studyMinutes || 0),
      0
    );
    return { totalEnrollments, completed, active, avgProgress, totalStudyMinutes };
  }, [enrichedEnrollments]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedEnrollments.filter((item) => {
      if (courseFilter !== 'all' && item.enrollment.courseId !== courseFilter) return false;
      const isDone = item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100;
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'active' && (isDone || item.enrollment.progressPercent === 0)) return false;
      if (statusFilter === 'not_started' && item.enrollment.progressPercent > 0) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.enrollment.courseTitle.toLowerCase().includes(q) ||
        item.enrollment.studentId.toLowerCase().includes(q) ||
        item.access.label.toLowerCase().includes(q)
      );
    });
  }, [enrichedEnrollments, searchQuery, courseFilter, statusFilter]);

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
  };

  const handleExportCsv = () => {
    exportToCsv(
      'db-academy-estudiantes-inscritos',
      [
        'Estudiante',
        'Correo',
        'UID',
        'Curso',
        'Acceso / Pago',
        'Progreso (%)',
        'Lecciones',
        'Estudio (min)',
        'Estado',
        'Fecha de inscripción',
        'Certificado',
      ],
      filtered.map((item) => [
        item.name,
        item.email || 'Sin correo registrado',
        item.enrollment.studentId,
        item.enrollment.courseTitle,
        item.access.label,
        item.enrollment.progressPercent,
        item.totalLessons > 0
          ? `${item.completedLessonsCount}/${item.totalLessons}`
          : item.completedLessonsCount,
        item.enrollment.studyMinutes,
        item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100
          ? 'Completado'
          : item.enrollment.progressPercent > 0
            ? 'En curso'
            : 'Sin iniciar',
        formatDateEs(item.enrollment.enrolledAt),
        item.certificate?.verificationCode || '—',
      ])
    );
  };

  const handleExportPdf = () => {
    void exportTableToPdf(
      'db-academy-estudiantes-inscritos',
      'Directorio de Estudiantes Inscritos',
      `Generado: ${new Date().toLocaleDateString('es-DO')} · ${filtered.length} inscripciones`,
      ['Estudiante', 'Correo', 'Curso', 'Acceso', 'Progreso', 'Estudio', 'Estado'],
      filtered.map((item) => [
        item.name,
        item.email || 'Sin correo',
        item.enrollment.courseTitle,
        item.access.label,
        `${item.enrollment.progressPercent}%`,
        `${item.enrollment.studyMinutes} min`,
        item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100
          ? 'Completado'
          : item.enrollment.progressPercent > 0
            ? 'En curso'
            : 'Sin iniciar',
      ])
    );
  };

  const selectedDetail = useMemo(() => {
    if (!selectedEnrollment) return null;
    const item = enrichedEnrollments.find((x) => x.enrollment.id === selectedEnrollment.id);
    if (!item) return null;
    const studentSubs = assignmentSubmissions.filter(
      (s) =>
        s.studentId === item.enrollment.studentId &&
        s.courseId === item.enrollment.courseId
    );
    const giftCardRedemption = giftCardRedemptions.find(
      (r) =>
        r.studentId === item.enrollment.studentId &&
        r.courseId === item.enrollment.courseId
    );
    return { ...item, studentSubs, giftCardRedemption };
  }, [selectedEnrollment, enrichedEnrollments, assignmentSubmissions, giftCardRedemptions]);

  return (
    <div className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Estudiantes únicos</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {uniqueStudentsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.totalEnrollments} inscripciones en cursos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>En curso / Completados</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.active} <span className="text-sm font-normal text-slate-400">/</span>{' '}
            <span className="text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {instructorCertificates.length} certificados emitidos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progreso promedio</span>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {stats.avgProgress}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Seguimiento en tiempo real
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tiempo total de estudio</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.totalStudyMinutes >= 60
              ? `${(stats.totalStudyMinutes / 60).toFixed(1)} h`
              : `${stats.totalStudyMinutes} min`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Acumulado entre todos los cursos
          </p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--dba-accent-ink)]" />
              <span>Estudiantes inscritos y avance en los cursos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consulta el correo, método de inscripción y avance lección por lección de cada alumno.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar nombre, correo o curso..."
                className="w-full sm:w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[36px]"
              />
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filtrar por curso"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[36px] max-w-[200px]"
            >
              <option value="all">Todos los cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'not_started')
              }
              aria-label="Filtrar por estado"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[36px]"
            >
              <option value="all">Todos los estados</option>
              <option value="active">En curso</option>
              <option value="completed">Completados (100%)</option>
              <option value="not_started">Sin iniciar (0%)</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">Estudiante y correo</th>
                <th className="py-3 px-4 font-medium">Curso e inscripción</th>
                <th className="py-3 px-4 font-medium">Cómo va en el curso</th>
                <th className="py-3 px-4 font-medium">Estado</th>
                <th className="py-3 px-4 font-medium text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    {instructorEnrollments.length === 0
                      ? 'Todavía no hay estudiantes inscritos en tus cursos.'
                      : 'Ningún estudiante coincide con los filtros actuales.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const enr = item.enrollment;
                  const isDone = enr.status === 'completed' || enr.progressPercent >= 100;
                  const copyId = `email_${enr.id}`;
                  return (
                    <tr
                      key={enr.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Student & Email */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          {item.photoURL ? (
                            <img
                              src={item.photoURL}
                              alt={item.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(item.name)}
                            </div>
                          )}
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </p>
                            {item.email ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <a
                                  href={`mailto:${item.email}`}
                                  className="hover:underline truncate max-w-[210px]"
                                >
                                  {item.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(copyId, item.email)}
                                  title="Copiar correo"
                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  {copiedKey === copyId ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">
                                Correo pendiente de sincronizar
                              </p>
                            )}
                            <p className="text-[10px] font-mono text-slate-400">
                              ID: {enr.studentId.slice(0, 12)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Course & Enrollment Method */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1 max-w-xs">
                          <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                            {enr.courseTitle}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                                item.access.kind === 'gift_card'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                  : item.access.kind === 'coupon'
                                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                    : item.access.kind === 'free'
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                              }`}
                            >
                              {item.access.kind === 'gift_card' ? (
                                <Gift className="w-3 h-3" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              <span>{item.access.label}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Inscrito: {formatDateEs(enr.enrolledAt)}</span>
                          </p>
                        </div>
                      </td>

                      {/* Course Progress */}
                      <td className="py-3.5 px-4 align-top min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {enr.progressPercent}%
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono">
                              {item.totalLessons > 0
                                ? `${item.completedLessonsCount}/${item.totalLessons} lecc.`
                                : `${item.completedLessonsCount} lecc.`}{' '}
                              · {enr.studyMinutes} min
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : enr.progressPercent > 0
                                    ? 'bg-blue-600'
                                    : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, enr.progressPercent))}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Última actividad: {formatDateEs(enr.updatedAt || enr.enrolledAt)}
                          </p>
                        </div>
                      </td>

                      {/* Status & Certificate */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : enr.progressPercent > 0
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isDone ? 'Completado' : enr.progressPercent > 0 ? 'En curso' : 'Sin iniciar'}
                          </span>
                          {item.certificate && (
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Award className="w-3 h-3 shrink-0" />
                              <span>{item.certificate.verificationCode}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEnrollment(enr)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs p-4 overflow-y-auto flex items-start sm:items-center justify-center"
          onClick={() => setSelectedEnrollment(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] shadow-2xl overflow-hidden my-4"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[var(--dba-bg-hero)] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {selectedDetail.photoURL ? (
                  <img
                    src={selectedDetail.photoURL}
                    alt={selectedDetail.name}
                    className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(selectedDetail.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                    Ficha del estudiante inscrito
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {selectedDetail.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnrollment(null)}
                aria-label="Cerrar"
                className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Contact & Access Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3.5 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dba-text-secondary)]">
                    Información de contacto
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--dba-text-primary)] flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {selectedDetail.email || 'Correo pendiente de sincronización'}
                      </span>
                    </span>
                    {selectedDetail.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy('modal_email', selectedDetail.email)}
                        className="px-2 py-1 rounded border border-[var(--dba-border)] text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                      >
                        {copiedKey === 'modal_email' ? 'Copiado' : 'Copiar'}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-[var(--dba-text-secondary)]">
                    UID: {selectedDetail.enrollment.studentId}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3.5 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dba-text-secondary)]">
                    Inscripción y acceso
                  </p>
                  <p className="font-semibold text-[var(--dba-text-primary)]">
                    {selectedDetail.access.label}
                  </p>
                  <p className="text-[11px] text-[var(--dba-text-secondary)]">
                    {selectedDetail.access.detail}
                  </p>
                  <p className="text-[11px] text-[var(--dba-text-secondary)]">
                    Inscrito: {formatDateTimeEs(selectedDetail.enrollment.enrolledAt)}
                  </p>
                  {selectedDetail.giftCardRedemption && (
                    <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                      Canje Gift Card: {selectedDetail.giftCardRedemption.cardCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Overall Course Progress */}
              <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                    <span className="font-semibold text-sm text-[var(--dba-text-primary)] truncate">
                      {selectedDetail.enrollment.courseTitle}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 shrink-0">
                    {selectedDetail.enrollment.progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedDetail.enrollment.progressPercent >= 100
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, selectedDetail.enrollment.progressPercent))}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--dba-text-secondary)]">
                  <span>
                    Lecciones completadas: {selectedDetail.completedLessonsCount} de{' '}
                    {selectedDetail.totalLessons || selectedDetail.completedLessonsCount}
                  </span>
                  <span>
                    Módulos completados: {selectedDetail.completedModulesCount} de{' '}
                    {selectedDetail.totalModules || selectedDetail.completedModulesCount}
                  </span>
                  <span>Estudio: {selectedDetail.enrollment.studyMinutes} min</span>
                </div>
              </div>

              {/* Module-by-Module Breakdown */}
              {selectedDetail.course && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--dba-text-secondary)]">
                    Avance módulo por módulo
                  </h4>
                  <div className="space-y-2">
                    {selectedDetail.course.modules.map((mod, mIdx) => {
                      const modCompleted = selectedDetail.enrollment.completedModuleIds?.includes(
                        mod.id
                      );
                      const completedSet = new Set(
                        selectedDetail.enrollment.completedLessonIds || []
                      );
                      const modDoneCount = mod.lessons.filter((l) => completedSet.has(l.id)).length;
                      return (
                        <div
                          key={mod.id}
                          className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[var(--dba-text-primary)]">
                              {mIdx + 1}. {mod.title}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-semibold ${
                                modCompleted
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {modDoneCount}/{mod.lessons.length} lecciones
                            </span>
                          </div>
                          <ul className="space-y-1 pl-1">
                            {mod.lessons.map((lesson) => {
                              const done = completedSet.has(lesson.id);
                              return (
                                <li
                                  key={lesson.id}
                                  className={`flex items-center gap-2 text-[11px] ${
                                    done
                                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                                      : 'text-[var(--dba-text-secondary)]'
                                  }`}
                                >
                                  {done ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate">{lesson.title}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submissions & Certificate */}
              {selectedDetail.studentSubs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--dba-text-secondary)]">
                    Entregas en el curso ({selectedDetail.studentSubs.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetail.studentSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--dba-text-primary)] truncate">
                            {sub.lessonTitle}
                          </p>
                          <p className="text-[11px] text-[var(--dba-text-secondary)] truncate">
                            {sub.fileName}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] font-semibold shrink-0 text-blue-600 dark:text-blue-400">
                          {typeof sub.grade === 'number'
                            ? `${sub.grade}/${sub.maxScore}`
                            : sub.status === 'submitted'
                              ? 'Pendiente'
                              : sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetail.certificate && (
                <div className="rounded-xl border border-emerald-300/70 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--dba-text-primary)]">
                        Certificado oficial emitido
                      </p>
                      <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                        {selectedDetail.certificate.verificationCode} ·{' '}
                        {formatDateEs(selectedDetail.certificate.issuedAt)}
                      </p>
                    </div>
                  </div>
                  {onPreviewCertificate && (
                    <button
                      type="button"
                      onClick={() => onPreviewCertificate(selectedDetail.certificate!)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shrink-0"
                    >
                      Ver certificado
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
