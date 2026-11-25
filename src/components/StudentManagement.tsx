import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Gift,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  PlayCircle,
  Search,
  Table2,
  Users,
  X,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { usePlatform } from '../context/PlatformContext';
import { db, isPlaceholderCampusEmail } from '../firebase';
import type {
  AssignmentSubmission,
  Certificate,
  Course,
  CourseLessonType,
  Enrollment,
  ForumReply,
  ForumThread,
  GiftCardRedemption,
  PaymentRecord,
} from '../types';
import { formatCurrency } from '../utils/currency';
import { exportTableToPdf, exportToCsv } from '../utils/export';

interface StudentManagementProps {
  onPreviewCertificate?: (cert: Certificate) => void;
}

type ModalSection = 'all' | 'lessons' | 'forums' | 'access';
type StatusFilter = 'all' | 'active_24h' | 'active' | 'completed' | 'not_started';

interface EnrichedCourseEnrollment {
  enrollment: Enrollment;
  course?: Course;
  payment?: PaymentRecord;
  certificate?: Certificate;
  giftCardRedemption?: GiftCardRedemption;
  totalLessons: number;
  completedLessonsCount: number;
  totalModules: number;
  completedModulesCount: number;
  enrolledAtMs: number | null;
  updatedAtMs: number | null;
  lastActivityMs: number | null;
  access: {
    label: string;
    detail: string;
    kind: 'gift_card' | 'coupon' | 'free' | 'paid';
  };
}

interface StudentRowSummary {
  studentId: string;
  name: string;
  email: string;
  photoURL: string;
  enrollments: EnrichedCourseEnrollment[];
  submissions: AssignmentSubmission[];
  authoredThreads: ForumThread[];
  avgProgressPercent: number;
  completedCoursesCount: number;
  totalStudyMinutes: number;
  totalCompletedLessons: number;
  totalLessonsAcrossCourses: number;
  firstAccessMs: number | null;
  lastProfileSyncMs: number | null;
  lastActivityMs: number | null;
  lastActivityLabel: string;
  activeLast24h: boolean;
  overallStatus: 'completed' | 'active' | 'not_started';
}

interface StudentForumParticipationItem {
  id: string;
  kind: 'thread' | 'reply';
  threadId: string;
  threadTitle: string;
  courseId: string;
  courseTitle: string;
  body: string;
  createdAtMs: number | null;
  resolved: boolean;
  pinned: boolean;
  upvotesCount: number;
  repliesCount: number;
  isInstructorAnswer?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toEpochMs(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === 'object') {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') {
      const ms = maybe.toDate().getTime();
      return Number.isFinite(ms) ? ms : null;
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

function formatRelativeTimeEs(ms: number | null, nowMs: number): string {
  if (!ms) return 'Sin registros';
  const diffMs = Math.max(0, nowMs - ms);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Hace instantes';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `Hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} mes${diffMonths === 1 ? '' : 'es'}`;
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

function getLessonTypeMeta(type?: CourseLessonType): {
  label: string;
  Icon: React.FC<{ className?: string }>;
} {
  switch (type) {
    case 'video':
      return { label: 'Video', Icon: PlayCircle };
    case 'excel':
      return { label: 'Práctica Excel', Icon: Table2 };
    case 'quiz':
      return { label: 'Evaluación', Icon: GraduationCap };
    default:
      return { label: 'Lectura', Icon: FileText };
  }
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
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
    forumThreads,
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [modalSection, setModalSection] = useState<ModalSection>('all');
  const [selectedModalCourseId, setSelectedModalCourseId] = useState<string>('all');
  const [showPendingLessons, setShowPendingLessons] = useState(false);

  const [studentReplies, setStudentReplies] = useState<ForumReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesError, setRepliesError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedStudentId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudentId]);

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

  const giftCardByStudentCourse = useMemo(() => {
    const map: Record<string, GiftCardRedemption> = {};
    for (const r of giftCardRedemptions) {
      map[`${r.courseId}_${r.studentId}`] = r;
    }
    return map;
  }, [giftCardRedemptions]);

  const studentRows = useMemo<StudentRowSummary[]>(() => {
    const byStudent = new Map<string, EnrichedCourseEnrollment[]>();

    for (const enr of instructorEnrollments) {
      const course = courseById[enr.courseId];
      const payment = paymentByStudentCourse[`${enr.courseId}_${enr.studentId}`];
      const certificate = certByStudentCourse[`${enr.courseId}_${enr.studentId}`];
      const giftCardRedemption = giftCardByStudentCourse[`${enr.courseId}_${enr.studentId}`];
      const totalLessons =
        course?.totalLessons ||
        course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ||
        0;
      const completedLessonsCount = enr.completedLessonIds?.length || 0;
      const totalModules = course?.modules?.length || course?.modulesCount || 0;
      const completedModulesCount = enr.completedModuleIds?.length || 0;
      const enrolledAtMs = toEpochMs(enr.enrolledAt);
      const updatedAtMs = toEpochMs(enr.updatedAt);
      const lastActivityMs = updatedAtMs ?? enrolledAtMs;

      const item: EnrichedCourseEnrollment = {
        enrollment: enr,
        course,
        payment,
        certificate,
        giftCardRedemption,
        totalLessons,
        completedLessonsCount,
        totalModules,
        completedModulesCount,
        enrolledAtMs,
        updatedAtMs,
        lastActivityMs,
        access: formatAccessMethod(payment),
      };

      const list = byStudent.get(enr.studentId) || [];
      list.push(item);
      byStudent.set(enr.studentId, list);
    }

    const rows: StudentRowSummary[] = [];

    for (const [studentId, list] of byStudent.entries()) {
      const sortedEnrollments = [...list].sort(
        (a, b) => (b.lastActivityMs ?? 0) - (a.lastActivityMs ?? 0)
      );
      const profile = studentProfilesMap[studentId];
      const emailFromEnrollments = sortedEnrollments.find(
        (x) => !isPlaceholderCampusEmail(x.enrollment.studentEmail)
      )?.enrollment.studentEmail;
      const mappedEmail = !isPlaceholderCampusEmail(studentEmailsMap[studentId])
        ? studentEmailsMap[studentId]
        : '';
      const email = (emailFromEnrollments || mappedEmail || '').trim();
      const name =
        profile?.displayName ||
        sortedEnrollments[0]?.enrollment.studentName ||
        'Estudiante';
      const photoURL = profile?.photoURL || '';

      const studentSubmissions = assignmentSubmissions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => (toEpochMs(b.submittedAt) ?? 0) - (toEpochMs(a.submittedAt) ?? 0));

      const authoredThreads = forumThreads
        .filter((t) => t.authorId === studentId)
        .sort(
          (a, b) =>
            (toEpochMs(b.updatedAt || b.createdAt) ?? 0) -
            (toEpochMs(a.updatedAt || a.createdAt) ?? 0)
        );

      const avgProgressPercent =
        sortedEnrollments.length > 0
          ? Math.round(
              sortedEnrollments.reduce(
                (acc, x) => acc + (x.enrollment.progressPercent || 0),
                0
              ) / sortedEnrollments.length
            )
          : 0;

      const completedCoursesCount = sortedEnrollments.filter(
        (x) => x.enrollment.status === 'completed' || x.enrollment.progressPercent >= 100
      ).length;

      const totalStudyMinutes = sortedEnrollments.reduce(
        (acc, x) => acc + (x.enrollment.studyMinutes || 0),
        0
      );
      const totalCompletedLessons = sortedEnrollments.reduce(
        (acc, x) => acc + x.completedLessonsCount,
        0
      );
      const totalLessonsAcrossCourses = sortedEnrollments.reduce(
        (acc, x) => acc + x.totalLessons,
        0
      );

      const activityCandidates: { ms: number; label: string }[] = [];
      for (const item of sortedEnrollments) {
        if (item.updatedAtMs) {
          activityCandidates.push({
            ms: item.updatedAtMs,
            label: `Progreso · ${item.enrollment.courseTitle}`,
          });
        }
        if (item.enrolledAtMs) {
          activityCandidates.push({
            ms: item.enrolledAtMs,
            label: `Inscripción · ${item.enrollment.courseTitle}`,
          });
        }
      }
      const profileUpdatedMs = toEpochMs(profile?.updatedAt);
      if (profileUpdatedMs) {
        activityCandidates.push({
          ms: profileUpdatedMs,
          label: 'Sesión / perfil sincronizado',
        });
      }
      const profileCreatedMs = toEpochMs(profile?.createdAt);
      for (const sub of studentSubmissions) {
        const subMs = toEpochMs(sub.submittedAt || sub.updatedAt);
        if (subMs) {
          activityCandidates.push({
            ms: subMs,
            label: `Entrega · ${sub.lessonTitle}`,
          });
        }
      }
      for (const th of authoredThreads) {
        const thMs = toEpochMs(th.updatedAt || th.createdAt);
        if (thMs) {
          activityCandidates.push({
            ms: thMs,
            label: `Foro · ${th.title}`,
          });
        }
      }

      activityCandidates.sort((a, b) => b.ms - a.ms);
      const latestActivity = activityCandidates[0] || null;
      const lastActivityMs = latestActivity ? latestActivity.ms : null;
      const lastActivityLabel = latestActivity ? latestActivity.label : 'Sin actividad';

      const enrollmentDates = sortedEnrollments
        .map((x) => x.enrolledAtMs)
        .filter((x): x is number => x !== null);
      if (profileCreatedMs) enrollmentDates.push(profileCreatedMs);
      const firstAccessMs = enrollmentDates.length > 0 ? Math.min(...enrollmentDates) : null;

      const activeLast24h = Boolean(lastActivityMs && nowMs - lastActivityMs <= DAY_MS);

      const overallStatus: 'completed' | 'active' | 'not_started' =
        completedCoursesCount === sortedEnrollments.length && sortedEnrollments.length > 0
          ? 'completed'
          : sortedEnrollments.some((x) => x.enrollment.progressPercent > 0)
            ? 'active'
            : 'not_started';

      rows.push({
        studentId,
        name,
        email,
        photoURL,
        enrollments: sortedEnrollments,
        submissions: studentSubmissions,
        authoredThreads,
        avgProgressPercent,
        completedCoursesCount,
        totalStudyMinutes,
        totalCompletedLessons,
        totalLessonsAcrossCourses,
        firstAccessMs,
        lastProfileSyncMs: profileUpdatedMs,
        lastActivityMs,
        lastActivityLabel,
        activeLast24h,
        overallStatus,
      });
    }

    return rows.sort((a, b) => (b.lastActivityMs ?? 0) - (a.lastActivityMs ?? 0));
  }, [
    instructorEnrollments,
    courseById,
    paymentByStudentCourse,
    certByStudentCourse,
    giftCardByStudentCourse,
    studentProfilesMap,
    studentEmailsMap,
    assignmentSubmissions,
    forumThreads,
    nowMs,
  ]);

  const stats = useMemo(() => {
    const totalStudents = studentRows.length;
    const totalEnrollments = instructorEnrollments.length;
    const completedEnrollments = instructorEnrollments.filter(
      (e) => e.status === 'completed' || e.progressPercent >= 100
    ).length;
    const activeEnrollments = totalEnrollments - completedEnrollments;
    const avgCompletionRate =
      totalEnrollments > 0
        ? Math.round(
            instructorEnrollments.reduce((acc, e) => acc + (e.progressPercent || 0), 0) /
              totalEnrollments
          )
        : 0;
    const activeLast24h = studentRows.filter((s) => s.activeLast24h).length;
    const activeLast24hRate =
      totalStudents > 0 ? Math.round((activeLast24h / totalStudents) * 100) : 0;
    const totalStudyMinutes = studentRows.reduce((acc, s) => acc + s.totalStudyMinutes, 0);
    const totalCompletedLessons = studentRows.reduce(
      (acc, s) => acc + s.totalCompletedLessons,
      0
    );

    return {
      totalStudents,
      totalEnrollments,
      completedEnrollments,
      activeEnrollments,
      avgCompletionRate,
      activeLast24h,
      activeLast24hRate,
      totalStudyMinutes,
      totalCompletedLessons,
    };
  }, [studentRows, instructorEnrollments]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studentRows
      .map((student) => {
        const visibleEnrollments =
          courseFilter === 'all'
            ? student.enrollments
            : student.enrollments.filter((x) => x.enrollment.courseId === courseFilter);
        return { student, visibleEnrollments };
      })
      .filter(({ student, visibleEnrollments }) => {
        if (visibleEnrollments.length === 0) return false;

        if (statusFilter === 'active_24h' && !student.activeLast24h) return false;
        if (statusFilter === 'completed') {
          const allDone = visibleEnrollments.every(
            (x) => x.enrollment.status === 'completed' || x.enrollment.progressPercent >= 100
          );
          if (!allDone) return false;
        }
        if (statusFilter === 'active') {
          const hasProgress = visibleEnrollments.some((x) => x.enrollment.progressPercent > 0);
          const allDone = visibleEnrollments.every(
            (x) => x.enrollment.status === 'completed' || x.enrollment.progressPercent >= 100
          );
          if (!hasProgress || allDone) return false;
        }
        if (statusFilter === 'not_started') {
          const anyProgress = visibleEnrollments.some((x) => x.enrollment.progressPercent > 0);
          if (anyProgress) return false;
        }

        if (!q) return true;
        return (
          student.name.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q) ||
          student.studentId.toLowerCase().includes(q) ||
          visibleEnrollments.some(
            (x) =>
              x.enrollment.courseTitle.toLowerCase().includes(q) ||
              x.access.label.toLowerCase().includes(q)
          )
        );
      });
  }, [studentRows, searchQuery, courseFilter, statusFilter]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentRows.find((s) => s.studentId === selectedStudentId) || null;
  }, [selectedStudentId, studentRows]);

  // Fetch forum replies authored by the selected student across live Firestore threads
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentReplies([]);
      setRepliesError('');
      setLoadingReplies(false);
      return;
    }

    let cancelled = false;
    const firestoreThreads = forumThreads.filter((th) => !th.id.startsWith('seed-'));

    if (firestoreThreads.length === 0) {
      setStudentReplies([]);
      setLoadingReplies(false);
      setRepliesError('');
      return;
    }

    setLoadingReplies(true);
    setRepliesError('');

    void (async () => {
      try {
        const results = await Promise.allSettled(
          firestoreThreads.map(async (th) => {
            const snap = await getDocs(
              query(collection(db, 'forumThreads', th.id, 'replies'), where('threadId', '==', th.id))
            );
            return snap.docs
              .map((d) => d.data() as ForumReply)
              .filter((r) => r.authorId === selectedStudentId);
          })
        );

        if (cancelled) return;

        const collected: ForumReply[] = [];
        let failedCount = 0;
        for (const res of results) {
          if (res.status === 'fulfilled') {
            collected.push(...res.value);
          } else {
            failedCount += 1;
          }
        }

        collected.sort((a, b) => (toEpochMs(b.createdAt) ?? 0) - (toEpochMs(a.createdAt) ?? 0));
        setStudentReplies(collected);
        if (failedCount > 0 && collected.length === 0 && failedCount === firestoreThreads.length) {
          setRepliesError('No se pudieron cargar algunas respuestas de los foros.');
        }
      } catch {
        if (!cancelled) {
          setRepliesError('Error al consultar las respuestas en foros.');
        }
      } finally {
        if (!cancelled) setLoadingReplies(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, forumThreads]);

  const handleOpenStudentModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setModalSection('all');
    setSelectedModalCourseId(courseFilter !== 'all' ? courseFilter : 'all');
    setShowPendingLessons(false);
  };

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
  };

  const handleExportCsv = () => {
    const flatRows = filteredStudents.flatMap(({ student, visibleEnrollments }) =>
      visibleEnrollments.map((item) => [
        student.name,
        student.email || 'Sin correo registrado',
        student.studentId,
        item.enrollment.courseTitle,
        item.access.label,
        `${item.enrollment.progressPercent}%`,
        item.totalLessons > 0
          ? `${item.completedLessonsCount}/${item.totalLessons}`
          : String(item.completedLessonsCount),
        item.enrollment.studyMinutes,
        item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100
          ? 'Completado'
          : item.enrollment.progressPercent > 0
            ? 'En curso'
            : 'Sin iniciar',
        formatDateTimeEs(item.enrolledAtMs),
        formatDateTimeEs(item.lastActivityMs),
        item.certificate?.verificationCode || '—',
      ])
    );

    exportToCsv(
      'db-academy-student-management',
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
        'Última actividad',
        'Certificado',
      ],
      flatRows
    );
  };

  const handleExportPdf = () => {
    const flatRows = filteredStudents.flatMap(({ student, visibleEnrollments }) =>
      visibleEnrollments.map((item) => [
        student.name,
        student.email || 'Sin correo',
        item.enrollment.courseTitle,
        `${item.enrollment.progressPercent}%`,
        `${item.enrollment.studyMinutes} min`,
        formatDateTimeEs(item.lastActivityMs),
        item.enrollment.status === 'completed' || item.enrollment.progressPercent >= 100
          ? 'Completado'
          : item.enrollment.progressPercent > 0
            ? 'En curso'
            : 'Sin iniciar',
      ])
    );

    void exportTableToPdf(
      'db-academy-student-management',
      'Gestión de Estudiantes · DB Academy',
      `Generado: ${new Date().toLocaleDateString('es-DO')} · ${filteredStudents.length} estudiantes`,
      ['Estudiante', 'Correo', 'Curso', 'Progreso', 'Estudio', 'Última actividad', 'Estado'],
      flatRows
    );
  };

  const selectedForumParticipations = useMemo<StudentForumParticipationItem[]>(() => {
    if (!selectedStudent) return [];
    const threadMap = new Map<string, ForumThread>();
    for (const th of forumThreads) threadMap.set(th.id, th);

    const items: StudentForumParticipationItem[] = [];

    for (const th of selectedStudent.authoredThreads) {
      items.push({
        id: `thread_${th.id}`,
        kind: 'thread',
        threadId: th.id,
        threadTitle: th.title,
        courseId: th.courseId,
        courseTitle: courseById[th.courseId]?.title || 'Curso',
        body: th.body,
        createdAtMs: toEpochMs(th.createdAt),
        resolved: th.resolved,
        pinned: th.pinned,
        upvotesCount: th.upvotesCount,
        repliesCount: th.repliesCount,
      });
    }

    for (const rep of studentReplies) {
      const parentThread = threadMap.get(rep.threadId);
      items.push({
        id: `reply_${rep.id}`,
        kind: 'reply',
        threadId: rep.threadId,
        threadTitle: parentThread?.title || 'Hilo de discusión',
        courseId: rep.courseId,
        courseTitle: courseById[rep.courseId]?.title || 'Curso',
        body: rep.body,
        createdAtMs: toEpochMs(rep.createdAt),
        resolved: parentThread?.resolved ?? false,
        pinned: parentThread?.pinned ?? false,
        upvotesCount: parentThread?.upvotesCount ?? 0,
        repliesCount: parentThread?.repliesCount ?? 0,
        isInstructorAnswer: rep.isInstructorAnswer,
      });
    }

    return items.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
  }, [selectedStudent, studentReplies, forumThreads, courseById]);

  const selectedAccessEvents = useMemo(() => {
    if (!selectedStudent) return [];
    const events: {
      id: string;
      atMs: number;
      title: string;
      detail: string;
      kind: 'enrollment' | 'progress' | 'forum' | 'submission' | 'certificate' | 'profile';
    }[] = [];

    if (selectedStudent.firstAccessMs) {
      events.push({
        id: 'profile_created',
        atMs: selectedStudent.firstAccessMs,
        title: 'Primer acceso / registro en la plataforma',
        detail: selectedStudent.email || selectedStudent.name,
        kind: 'profile',
      });
    }

    if (selectedStudent.lastProfileSyncMs) {
      events.push({
        id: 'profile_sync',
        atMs: selectedStudent.lastProfileSyncMs,
        title: 'Última sincronización de cuenta y sesión',
        detail: 'Inicio de sesión o actualización de perfil',
        kind: 'profile',
      });
    }

    for (const item of selectedStudent.enrollments) {
      if (item.enrolledAtMs) {
        events.push({
          id: `enr_${item.enrollment.id}`,
          atMs: item.enrolledAtMs,
          title: `Inscripción en ${item.enrollment.courseTitle}`,
          detail: item.access.label,
          kind: 'enrollment',
        });
      }
      if (item.updatedAtMs && item.updatedAtMs !== item.enrolledAtMs) {
        events.push({
          id: `upd_${item.enrollment.id}`,
          atMs: item.updatedAtMs,
          title: `Último progreso registrado en ${item.enrollment.courseTitle}`,
          detail: `${item.enrollment.progressPercent}% completado · ${item.completedLessonsCount} lecciones · ${item.enrollment.studyMinutes} min`,
          kind: 'progress',
        });
      }
      const certMs = toEpochMs(item.certificate?.issuedAt);
      if (item.certificate && certMs) {
        events.push({
          id: `cert_${item.certificate.id}`,
          atMs: certMs,
          title: `Certificado emitido · ${item.enrollment.courseTitle}`,
          detail: `Código ${item.certificate.verificationCode}`,
          kind: 'certificate',
        });
      }
    }

    for (const sub of selectedStudent.submissions) {
      const subMs = toEpochMs(sub.submittedAt || sub.updatedAt);
      if (subMs) {
        events.push({
          id: `sub_${sub.id}`,
          atMs: subMs,
          title: `Entrega enviada: ${sub.lessonTitle}`,
          detail: `${sub.courseTitle} · ${sub.fileName}`,
          kind: 'submission',
        });
      }
    }

    for (const forumItem of selectedForumParticipations) {
      if (forumItem.createdAtMs) {
        events.push({
          id: `forum_${forumItem.id}`,
          atMs: forumItem.createdAtMs,
          title:
            forumItem.kind === 'thread'
              ? `Abrió tema en foro: ${forumItem.threadTitle}`
              : `Respondió en foro: ${forumItem.threadTitle}`,
          detail: forumItem.courseTitle,
          kind: 'forum',
        });
      }
    }

    return events.sort((a, b) => b.atMs - a.atMs);
  }, [selectedStudent, selectedForumParticipations]);

  const modalVisibleEnrollments = useMemo(() => {
    if (!selectedStudent) return [];
    if (selectedModalCourseId === 'all') return selectedStudent.enrollments;
    const filtered = selectedStudent.enrollments.filter(
      (e) => e.enrollment.courseId === selectedModalCourseId
    );
    return filtered.length > 0 ? filtered : selectedStudent.enrollments;
  }, [selectedStudent, selectedModalCourseId]);

  return (
    <div className="space-y-5">
      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total de estudiantes</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.totalStudents}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.totalEnrollments} inscripciones en cursos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Tasa de finalización promedio</span>
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.avgCompletionRate}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.completedEnrollments} completados · {stats.activeEnrollments} en progreso
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Activos en las últimas 24 h</span>
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.activeLast24h}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.activeLast24hRate}% de estudiantes · {instructorCertificates.length} certificados
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Tiempo total de estudio</span>
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.totalStudyMinutes >= 60
              ? `${(stats.totalStudyMinutes / 60).toFixed(1)} h`
              : `${stats.totalStudyMinutes} min`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {stats.totalCompletedLessons} lecciones completadas en total
          </p>
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--dba-accent-ink)]" />
              <span>Gestión de Estudiantes</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en cualquier estudiante para abrir su historial de lecciones completadas, foros participados y fechas de acceso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar estudiante, correo o curso..."
                className="w-full sm:w-60 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[38px]"
              />
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filtrar por curso"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[38px] max-w-[200px]"
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
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filtrar por estado o actividad"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 min-h-[38px]"
            >
              <option value="all">Todos los estados</option>
              <option value="active_24h">Activos (últimas 24 h)</option>
              <option value="active">En curso</option>
              <option value="completed">Completados (100%)</option>
              <option value="not_started">Sin iniciar (0%)</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[38px] whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[38px] whitespace-nowrap shrink-0"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">Estudiante</th>
                <th className="py-3 px-4 font-medium">Correo electrónico</th>
                <th className="py-3 px-4 font-medium">Progreso por curso</th>
                <th className="py-3 px-4 font-medium">Última actividad</th>
                <th className="py-3 px-4 font-medium text-right">Historial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    {instructorEnrollments.length === 0
                      ? 'Todavía no hay estudiantes inscritos en tus cursos.'
                      : 'Ningún estudiante coincide con los filtros actuales.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(({ student, visibleEnrollments }) => {
                  const copyId = `email_${student.studentId}`;
                  return (
                    <tr
                      key={student.studentId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenStudentModal(student.studentId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenStudentModal(student.studentId);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 transition-colors"
                    >
                      {/* Student identity */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-3">
                          {student.photoURL ? (
                            <img
                              src={student.photoURL}
                              alt={student.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(student.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {visibleEnrollments.length}{' '}
                              {visibleEnrollments.length === 1 ? 'curso' : 'cursos'} ·{' '}
                              {student.totalStudyMinutes} min estudio
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 align-top">
                        {student.email ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a
                                href={`mailto:${student.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline truncate max-w-[220px] font-medium"
                              >
                                {student.email}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(copyId, student.email);
                                }}
                                title="Copiar correo"
                                aria-label={`Copiar correo de ${student.name}`}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                {copiedKey === copyId ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400">
                              UID: {student.studentId.slice(0, 12)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Correo pendiente de sincronización
                          </span>
                        )}
                      </td>

                      {/* Progress per course */}
                      <td className="py-3.5 px-4 align-top min-w-[260px]">
                        <div className="space-y-2.5">
                          {visibleEnrollments.map((item) => {
                            const pct = Math.min(
                              100,
                              Math.max(0, item.enrollment.progressPercent || 0)
                            );
                            const isDone =
                              item.enrollment.status === 'completed' || pct >= 100;
                            return (
                              <div key={item.enrollment.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[210px]">
                                    {item.enrollment.courseTitle}
                                  </span>
                                  <span
                                    className={`font-mono tabular-nums font-bold shrink-0 ${
                                      isDone
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : pct > 0
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isDone
                                        ? 'bg-emerald-500'
                                        : pct > 0
                                          ? 'bg-blue-600'
                                          : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                  <span>
                                    {item.totalLessons > 0
                                      ? `${item.completedLessonsCount}/${item.totalLessons} lecc.`
                                      : `${item.completedLessonsCount} lecc.`}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{item.access.label}</span>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      isDone
                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                        : pct > 0
                                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                                          : 'text-slate-500 dark:text-slate-400'
                                    }
                                  >
                                    {isDone ? 'Completado' : pct > 0 ? 'En curso' : 'Sin iniciar'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Last Activity Timestamp */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                            {formatDateTimeEs(student.lastActivityMs)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatRelativeTimeEs(student.lastActivityMs, nowMs)}
                            {student.activeLast24h ? ' · Activo 24 h' : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {student.lastActivityLabel}
                          </p>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentModal(student.studentId);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver historial</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-detail-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs p-4 overflow-y-auto flex items-start sm:items-center justify-center"
          onClick={() => setSelectedStudentId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] shadow-2xl overflow-hidden my-4"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[var(--dba-bg-hero)] text-white flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedStudent.photoURL ? (
                  <img
                    src={selectedStudent.photoURL}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(selectedStudent.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-amber-300">
                    Historial detallado del estudiante
                  </p>
                  <h3
                    id="student-detail-modal-title"
                    className="text-base sm:text-lg font-bold text-white truncate"
                  >
                    {selectedStudent.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-300 mt-0.5">
                    {selectedStudent.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{selectedStudent.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy('modal_email', selectedStudent.email)}
                          className="text-[11px] underline hover:text-white"
                        >
                          {copiedKey === 'modal_email' ? 'Copiado' : 'Copiar'}
                        </button>
                      </span>
                    ) : (
                      <span>Correo pendiente de sincronización</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      UID: {selectedStudent.studentId}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                aria-label="Cerrar modal de estudiante"
                className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Bar + Section Switcher */}
            <div className="px-6 py-3 border-b border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--dba-text-secondary)] tabular-nums">
                <span>
                  <strong className="text-[var(--dba-text-primary)] font-mono">
                    {selectedStudent.totalCompletedLessons}
                  </strong>{' '}
                  lecciones completadas
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-[var(--dba-text-primary)] font-mono">
                    {selectedForumParticipations.length}
                  </strong>{' '}
                  participaciones en foros
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Último acceso:{' '}
                  <strong className="text-[var(--dba-text-primary)] font-mono">
                    {formatDateTimeEs(selectedStudent.lastActivityMs)}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'Todo' },
                    {
                      id: 'lessons',
                      label: `Lecciones (${selectedStudent.totalCompletedLessons})`,
                    },
                    {
                      id: 'forums',
                      label: `Foros (${selectedForumParticipations.length})`,
                    },
                    {
                      id: 'access',
                      label: `Accesos (${selectedAccessEvents.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalSection(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      modalSection === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 1. Access Dates & Activity Timeline */}
              {(modalSection === 'all' || modalSection === 'access') && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--dba-text-secondary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Fechas de acceso y actividad</span>
                    </h4>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--dba-text-secondary)]">
                      {selectedStudent.activeLast24h
                        ? 'Activo en las últimas 24 h'
                        : formatRelativeTimeEs(selectedStudent.lastActivityMs, nowMs)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3">
                      <p className="text-[11px] text-[var(--dba-text-secondary)]">
                        Primer acceso registrado
                      </p>
                      <p className="mt-1 font-mono tabular-nums font-semibold text-[var(--dba-text-primary)]">
                        {formatDateTimeEs(selectedStudent.firstAccessMs)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3">
                      <p className="text-[11px] text-[var(--dba-text-secondary)]">
                        Último acceso / actividad
                      </p>
                      <p className="mt-1 font-mono tabular-nums font-semibold text-[var(--dba-text-primary)]">
                        {formatDateTimeEs(selectedStudent.lastActivityMs)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3">
                      <p className="text-[11px] text-[var(--dba-text-secondary)]">
                        Sincronización de perfil
                      </p>
                      <p className="mt-1 font-mono tabular-nums font-semibold text-[var(--dba-text-primary)]">
                        {formatDateTimeEs(selectedStudent.lastProfileSyncMs)}
                      </p>
                    </div>
                  </div>

                  {/* Per-course access & payment breakdown */}
                  <div className="rounded-xl border border-[var(--dba-border)] divide-y divide-[var(--dba-border)] bg-[var(--dba-bg-canvas)]">
                    {selectedStudent.enrollments.map((item) => (
                      <div
                        key={`access_${item.enrollment.id}`}
                        className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--dba-text-primary)] truncate">
                            {item.enrollment.courseTitle}
                          </p>
                          <p className="text-[11px] text-[var(--dba-text-secondary)] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="inline-flex items-center gap-1">
                              {item.access.kind === 'gift_card' ? (
                                <Gift className="w-3 h-3 text-amber-500" />
                              ) : (
                                <CreditCard className="w-3 h-3 text-blue-500" />
                              )}
                              <span>{item.access.label}</span>
                            </span>
                            {item.giftCardRedemption && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">
                                  Código: {item.giftCardRedemption.cardCode}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-[var(--dba-text-secondary)] sm:text-right shrink-0 space-y-0.5">
                          <p>Inscrito: {formatDateTimeEs(item.enrolledAtMs)}</p>
                          <p>Último acceso: {formatDateTimeEs(item.updatedAtMs ?? item.enrolledAtMs)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedAccessEvents.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[var(--dba-text-secondary)]">
                        Registro cronológico de accesos y eventos
                      </p>
                      <ul className="rounded-xl border border-[var(--dba-border)] divide-y divide-[var(--dba-border)] bg-[var(--dba-bg-canvas)]">
                        {selectedAccessEvents.map((ev) => (
                          <li
                            key={ev.id}
                            className="px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--dba-text-primary)] truncate">
                                {ev.title}
                              </p>
                              <p className="text-[11px] text-[var(--dba-text-secondary)] truncate">
                                {ev.detail}
                              </p>
                            </div>
                            <span className="font-mono tabular-nums text-[11px] text-[var(--dba-text-secondary)] shrink-0">
                              {formatDateTimeEs(ev.atMs)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* 2. Detailed History of Completed Lessons */}
              {(modalSection === 'all' || modalSection === 'lessons') && (
                <section className="space-y-3 border-t border-[var(--dba-border)] pt-5 first:border-t-0 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--dba-text-secondary)] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Historial detallado de lecciones completadas</span>
                    </h4>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedStudent.enrollments.length > 1 && (
                        <select
                          value={selectedModalCourseId}
                          onChange={(e) => setSelectedModalCourseId(e.target.value)}
                          aria-label="Filtrar lecciones por curso"
                          className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-2.5 py-1 text-[11px] text-[var(--dba-text-primary)]"
                        >
                          <option value="all">Todos sus cursos ({selectedStudent.enrollments.length})</option>
                          {selectedStudent.enrollments.map((item) => (
                            <option key={item.enrollment.id} value={item.enrollment.courseId}>
                              {item.enrollment.courseTitle} ({item.enrollment.progressPercent}%)
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowPendingLessons((prev) => !prev)}
                        className="rounded-lg border border-[var(--dba-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] transition-colors whitespace-nowrap"
                      >
                        {showPendingLessons ? 'Solo completadas' : 'Mostrar plan completo'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {modalVisibleEnrollments.map((item) => {
                      const completedLessonSet = new Set(
                        item.enrollment.completedLessonIds || []
                      );
                      const completedModuleSet = new Set(
                        item.enrollment.completedModuleIds || []
                      );
                      const completedEntries: {
                        moduleIndex: number;
                        moduleTitle: string;
                        moduleCompleted: boolean;
                        lessonId: string;
                        lessonTitle: string;
                        lessonType?: CourseLessonType;
                        durationMinutes: number;
                      }[] = [];

                      if (item.course) {
                        item.course.modules.forEach((mod, mIdx) => {
                          const modDone = completedModuleSet.has(mod.id);
                          mod.lessons.forEach((lesson) => {
                            if (completedLessonSet.has(lesson.id)) {
                              completedEntries.push({
                                moduleIndex: mIdx + 1,
                                moduleTitle: mod.title,
                                moduleCompleted: modDone,
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                lessonType: lesson.type,
                                durationMinutes: lesson.durationMinutes || 0,
                              });
                            }
                          });
                        });
                      }

                      const courseSubs = selectedStudent.submissions.filter(
                        (s) => s.courseId === item.enrollment.courseId
                      );

                      return (
                        <div
                          key={`lessons_${item.enrollment.id}`}
                          className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] overflow-hidden"
                        >
                          {/* Course progress header */}
                          <div className="p-3.5 border-b border-[var(--dba-border)] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-[var(--dba-text-primary)] truncate">
                                  {item.enrollment.courseTitle}
                                </p>
                                <p className="text-[11px] text-[var(--dba-text-secondary)] tabular-nums">
                                  {item.completedLessonsCount} de{' '}
                                  {item.totalLessons || item.completedLessonsCount} lecciones ·{' '}
                                  {item.completedModulesCount} de{' '}
                                  {item.totalModules || item.completedModulesCount} módulos ·{' '}
                                  {item.enrollment.studyMinutes} min · Última actividad:{' '}
                                  {formatDateTimeEs(item.lastActivityMs)}
                                </p>
                              </div>
                              <span className="font-mono tabular-nums font-bold text-sm text-blue-600 dark:text-blue-400 shrink-0">
                                {item.enrollment.progressPercent}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.enrollment.progressPercent >= 100
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, item.enrollment.progressPercent)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Completed lessons list or full curriculum */}
                          <div className="p-3.5 space-y-2.5">
                            {!item.course ? (
                              <p className="text-xs text-[var(--dba-text-secondary)]">
                                {item.completedLessonsCount > 0
                                  ? `${item.completedLessonsCount} lecciones completadas registradas en este curso.`
                                  : 'Aún no completa lecciones en este curso.'}
                              </p>
                            ) : showPendingLessons ? (
                              <div className="space-y-3">
                                {item.course.modules.map((mod, mIdx) => {
                                  const modDoneCount = mod.lessons.filter((l) =>
                                    completedLessonSet.has(l.id)
                                  ).length;
                                  const modCompleted = completedModuleSet.has(mod.id);
                                  return (
                                    <div key={mod.id} className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold text-[var(--dba-text-primary)]">
                                          Módulo {mIdx + 1}: {mod.title}
                                        </span>
                                        <span
                                          className={`text-[11px] font-mono tabular-nums ${
                                            modCompleted
                                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                              : 'text-[var(--dba-text-secondary)]'
                                          }`}
                                        >
                                          {modDoneCount}/{mod.lessons.length}
                                          {modCompleted ? ' · Módulo aprobado' : ''}
                                        </span>
                                      </div>
                                      <ul className="space-y-1 pl-1">
                                        {mod.lessons.map((lesson) => {
                                          const done = completedLessonSet.has(lesson.id);
                                          const typeMeta = getLessonTypeMeta(lesson.type);
                                          return (
                                            <li
                                              key={lesson.id}
                                              className={`flex items-center justify-between gap-2 text-xs py-0.5 ${
                                                done
                                                  ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                                                  : 'text-[var(--dba-text-secondary)]'
                                              }`}
                                            >
                                              <span className="flex items-center gap-2 min-w-0">
                                                {done ? (
                                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                ) : (
                                                  <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                )}
                                                <span className="truncate">{lesson.title}</span>
                                              </span>
                                              <span className="text-[11px] font-mono tabular-nums shrink-0 opacity-80">
                                                {typeMeta.label} · {lesson.durationMinutes} min
                                              </span>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : completedEntries.length === 0 ? (
                              <p className="text-xs text-[var(--dba-text-secondary)]">
                                Aún no ha completado ninguna lección en este curso.
                              </p>
                            ) : (
                              <ul className="divide-y divide-[var(--dba-border)]">
                                {completedEntries.map((entry) => {
                                  const typeMeta = getLessonTypeMeta(entry.lessonType);
                                  const TypeIcon = typeMeta.Icon;
                                  return (
                                    <li
                                      key={entry.lessonId}
                                      className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-start gap-2 min-w-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                          <p className="font-medium text-[var(--dba-text-primary)] truncate">
                                            {entry.lessonTitle}
                                          </p>
                                          <p className="text-[11px] text-[var(--dba-text-secondary)] truncate">
                                            Módulo {entry.moduleIndex}: {entry.moduleTitle}
                                            {entry.moduleCompleted ? ' · Quiz aprobado' : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[var(--dba-text-secondary)] shrink-0">
                                        <span className="inline-flex items-center gap-1">
                                          <TypeIcon className="w-3 h-3" />
                                          <span>{typeMeta.label}</span>
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span>{entry.durationMinutes} min</span>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            {/* Course Submissions */}
                            {courseSubs.length > 0 && (
                              <div className="pt-2.5 border-t border-[var(--dba-border)] space-y-1.5">
                                <p className="text-[11px] font-semibold text-[var(--dba-text-secondary)]">
                                  Entregas prácticas ({courseSubs.length})
                                </p>
                                {courseSubs.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between gap-2 text-xs py-1"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-medium text-[var(--dba-text-primary)] truncate">
                                        {sub.lessonTitle}
                                      </p>
                                      <p className="text-[11px] text-[var(--dba-text-secondary)] truncate">
                                        {sub.fileName} · {formatDateTimeEs(sub.submittedAt)}
                                      </p>
                                    </div>
                                    <span className="font-mono tabular-nums text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                                      {typeof sub.grade === 'number'
                                        ? `${sub.grade}/${sub.maxScore}`
                                        : sub.status === 'submitted'
                                          ? 'Pendiente'
                                          : sub.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Course Certificate */}
                            {item.certificate && (
                              <div className="pt-2.5 border-t border-[var(--dba-border)] flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[var(--dba-text-primary)]">
                                      Certificado emitido
                                    </p>
                                    <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                                      {item.certificate.verificationCode} ·{' '}
                                      {formatDateEs(item.certificate.issuedAt)}
                                    </p>
                                  </div>
                                </div>
                                {onPreviewCertificate && (
                                  <button
                                    type="button"
                                    onClick={() => onPreviewCertificate(item.certificate!)}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shrink-0 whitespace-nowrap"
                                  >
                                    Ver certificado
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Forum Participation */}
              {(modalSection === 'all' || modalSection === 'forums') && (
                <section className="space-y-3 border-t border-[var(--dba-border)] pt-5 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--dba-text-secondary)] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      <span>Foros participados ({selectedForumParticipations.length})</span>
                    </h4>
                    {loadingReplies && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--dba-text-secondary)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Consultando respuestas...</span>
                      </span>
                    )}
                  </div>

                  {repliesError && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">{repliesError}</p>
                  )}

                  {!loadingReplies && selectedForumParticipations.length === 0 ? (
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 text-xs text-[var(--dba-text-secondary)]">
                      Este estudiante aún no ha iniciado temas ni publicado respuestas en los foros del curso.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--dba-border)] divide-y divide-[var(--dba-border)] bg-[var(--dba-bg-canvas)]">
                      {selectedForumParticipations.map((item) => (
                        <div key={item.id} className="p-3.5 space-y-1.5 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <p className="font-semibold text-[var(--dba-text-primary)]">
                              {item.threadTitle}
                            </p>
                            <span className="font-mono tabular-nums text-[11px] text-[var(--dba-text-secondary)] shrink-0">
                              {formatDateTimeEs(item.createdAtMs)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--dba-text-secondary)]">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {item.kind === 'thread' ? 'Tema iniciado' : 'Respuesta publicada'}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{item.courseTitle}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{item.resolved ? 'Resuelto' : 'Abierto'}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="tabular-nums">{item.repliesCount} resp.</span>
                            {item.isInstructorAnswer && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Respuesta destacada
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-[var(--dba-text-secondary)] line-clamp-3">
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
