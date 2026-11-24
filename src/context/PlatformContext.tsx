import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  enableNetwork,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { EXCEL_BASICO_COURSE, REMOVED_SEED_COURSE_IDS, SEED_COURSES } from '../data/seedCourses';
import { SEED_FORUM_THREADS } from '../data/seedForum';
import {
  assertPlatformAdminWrite,
  auth,
  AUTHORIZED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  isAuthorizedAdminEmail,
  isFirestoreOfflineError,
  OperationType,
} from '../firebase';
import { translations, type TranslationKeys } from '../i18n/translations';
import type {
  ApiIntegrationKey,
  AppView,
  AssignmentSubmission,
  AssignmentSubmissionStatus,
  CalendarEvent,
  Certificate,
  CloudProvider,
  Coupon,
  CouponAppliesTo,
  CouponRedemption,
  CouponType,
  CouponValidationResult,
  Course,
  CourseSyncState,
  CurrencyCode,
  CustomExcelExercise,
  EncryptedNote,
  Enrollment,
  ForumThread,
  GiftCard,
  GiftCardRedemption,
  GiftCardValidationErrorCode,
  GiftCardValidationResult,
  InAppNotification,
  Language,
  LemonSqueezyCheckoutSession,
  LemonSqueezyStatus,
  LemonSqueezyVerificationResult,
  PaymentGateway,
  PaymentRecord,
  ThemeMode,
  UserPrivateInfo,
  UserProfile,
} from '../types';
import { uploadAssignmentSubmissionFile } from '../services/storageService';
import { encryptTextE2EE, getOrCreateVaultKey, sha256Hex } from '../utils/crypto';

const isAdminEmail = isAuthorizedAdminEmail;
const CUSTOM_EXERCISES_STORAGE_KEY = 'dbacademy_custom_exercises_v1';

function loadLocalCustomExercises(): CustomExcelExercise[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EXERCISES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomExcelExercise[]) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomExercises(items: CustomExcelExercise[]) {
  try {
    localStorage.setItem(CUSTOM_EXERCISES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

const ASSIGNMENTS_STORAGE_KEY = 'dbacademy_submissions_v1';

function loadLocalSubmissions(): AssignmentSubmission[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AssignmentSubmission[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSubmissions(items: AssignmentSubmission[]) {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

function mergeSeedLessonsIntoCourse(course: Course): { course: Course; changed: boolean } {
  if (course.id !== EXCEL_BASICO_COURSE.id) {
    return { course, changed: false };
  }
  let changed = false;
  const existingModules = Array.isArray(course.modules) ? [...course.modules] : [];
  const nextModules = existingModules.map((mod) => {
    const seedMod = EXCEL_BASICO_COURSE.modules.find((sm) => sm.id === mod.id);
    if (!seedMod) return mod;

    let modMaterialsChanged = false;
    const updatedExistingLessons = (mod.lessons || []).map((lesson) => {
      const seedLesson = seedMod.lessons.find((sl) => sl.id === lesson.id);
      if (!seedLesson) return lesson;

      const currentMaterials = Array.isArray(lesson.materials) ? [...lesson.materials] : [];
      let lessonChanged = false;

      const seedMaterials = seedLesson.materials ?? [];
      const nextMaterials = currentMaterials.map((mat) => {
        if (
          lesson.id === 'les-excel-0-0' &&
          mat.id === 'mat-partes-pantalla-img' &&
          mat.url !== '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp'
        ) {
          lessonChanged = true;
          const seedMatch = seedMaterials.find((sm) => sm.id === 'mat-partes-pantalla-img');
          return {
            ...mat,
            name: 'Partes principales de una hoja de cálculo de Excel',
            url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp',
            ...(seedMatch?.description ? { description: seedMatch.description } : {}),
          };
        }
        if (!mat.description) {
          const seedMatch = seedMaterials.find((sm) => sm.id === mat.id || sm.url === mat.url);
          if (seedMatch?.description) {
            lessonChanged = true;
            return { ...mat, description: seedMatch.description };
          }
        }
        return mat;
      });

      const missingImages = seedMaterials.filter(
        (seedMat) =>
          seedMat.type === 'image' &&
          !nextMaterials.some((m) => m.id === seedMat.id || m.url === seedMat.url)
      );
      const missingOthers = seedMaterials.filter(
        (seedMat) =>
          seedMat.type !== 'image' &&
          !nextMaterials.some((m) => m.id === seedMat.id || m.url === seedMat.url)
      );
      if (missingImages.length > 0 || missingOthers.length > 0) {
        lessonChanged = true;
        const existingImages = nextMaterials.filter((m) => m.type === 'image');
        const existingOthers = nextMaterials.filter((m) => m.type !== 'image');
        nextMaterials.splice(
          0,
          nextMaterials.length,
          ...existingImages,
          ...missingImages,
          ...existingOthers,
          ...missingOthers
        );
      }

      const hasLegacyRawTheoryDump =
        typeof lesson.content === 'string' &&
        (lesson.content.includes('=== ') ||
          lesson.content.includes('PRÁCTICAS —') ||
          lesson.content.includes('PRÁCTICAS (3):'));
      const nextContent =
        hasLegacyRawTheoryDump && seedLesson.content && lesson.content !== seedLesson.content
          ? seedLesson.content
          : lesson.content;
      if (nextContent !== lesson.content) {
        lessonChanged = true;
      }

      if (!lessonChanged) return lesson;
      changed = true;
      modMaterialsChanged = true;
      return {
        ...lesson,
        content: nextContent,
        materials: nextMaterials,
      };
    });

    const needsQuizUpgrade =
      Boolean(seedMod.questions && seedMod.questions.length >= 2) &&
      (!mod.questions || mod.questions.length < 2);
    if (needsQuizUpgrade) {
      changed = true;
    }

    const existingLessonIds = new Set(updatedExistingLessons.map((l) => l.id));
    const missingLessons = seedMod.lessons.filter((sl) => !existingLessonIds.has(sl.id));
    if (missingLessons.length === 0 && !modMaterialsChanged && !needsQuizUpgrade) return mod;
    if (missingLessons.length > 0) {
      changed = true;
    }
    const seedOrderMap = new Map(seedMod.lessons.map((sl, idx) => [sl.id, idx]));
    const mergedLessons = [...updatedExistingLessons, ...missingLessons].sort(
      (a, b) => (seedOrderMap.get(a.id) ?? 999) - (seedOrderMap.get(b.id) ?? 999)
    );
    return {
      ...mod,
      ...(needsQuizUpgrade
        ? {
            quizEnabled: true,
            questions: seedMod.questions,
          }
        : {}),
      durationMinutes: mergedLessons.reduce((acc, l) => acc + (Number(l.durationMinutes) || 15), 0),
      lessons: mergedLessons,
    };
  });

  const existingModuleIds = new Set(nextModules.map((m) => m.id));
  for (const seedMod of EXCEL_BASICO_COURSE.modules) {
    if (!existingModuleIds.has(seedMod.id)) {
      changed = true;
      nextModules.push(seedMod);
    }
  }

  if (!changed) {
    return { course, changed: false };
  }

  const totalLessons = nextModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  return {
    changed: true,
    course: {
      ...course,
      modulesCount: nextModules.length,
      totalLessons,
      modules: nextModules,
    },
  };
}

function formatGoogleAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';
  if (code === 'auth/unauthorized-domain') {
    const extra = host !== 'dbacademy.vercel.app' ? ' (y dbacademy.vercel.app)' : '';
    return `El dominio "${host}" aún no está autorizado en Firebase Authentication (proyecto river-pipe-m6tvw). Agrega "${host}"${extra} en Firebase Console → Authentication → Settings → Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'El inicio de sesión con Google no está habilitado en Firebase Authentication.';
  }
  if (code === 'auth/network-request-failed') {
    return 'No se pudo conectar con Google Auth. Verifica tu conexión a internet.';
  }
  if (code === 'auth/popup-blocked') {
    return 'El navegador bloqueó la ventana emergente de Google. Redirigiendo...';
  }
  return err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.';
}

function getDeviceId(): string {
  const existing = sessionStorage.getItem('catedra_device_id');
  if (existing) return existing;
  const id = `dev_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem('catedra_device_id', id);
  return id;
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'Mobile Browser';
  if (/macintosh/i.test(ua)) return 'macOS Workstation';
  if (/windows/i.test(ua)) return 'Windows Workstation';
  return 'Linux / Web Client';
}

function extractCourseSyncError(err: unknown): string {
  if (!(err instanceof Error)) return 'No se pudieron guardar los cambios en Firestore.';
  const raw = err.message.trim();
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error;
      }
    } catch {
      // Ignore JSON parse fallback
    }
  }
  return raw || 'No se pudieron guardar los cambios en Firestore.';
}

interface PlatformContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  privateInfo: UserPrivateInfo | null;
  theme: ThemeMode;
  language: Language;
  t: (key: TranslationKeys) => string;
  activeView: AppView;
  setActiveView: (v: AppView) => void;
  zenMode: boolean;
  setZenMode: (v: boolean) => void;
  toggleZenMode: () => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  workspaceRole: 'student' | 'instructor';
  setWorkspaceRole: (role: 'student' | 'instructor') => void;
  courses: Course[];
  customExercises: CustomExcelExercise[];
  enrollments: Enrollment[];
  instructorEnrollments: Enrollment[];
  payments: PaymentRecord[];
  instructorPayments: PaymentRecord[];
  certificates: Certificate[];
  instructorCertificates: Certificate[];
  forumThreads: ForumThread[];
  calendarEvents: CalendarEvent[];
  encryptedNotes: EncryptedNote[];
  apiKeys: ApiIntegrationKey[];
  assignmentSubmissions: AssignmentSubmission[];
  notifications: InAppNotification[];
  unreadCount: number;
  connectedDevicesCount: number;
  wsConnected: boolean;
  e2eeFingerprint: string;
  authError: string | null;
  clearAuthError: () => void;
  toggleTheme: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signInAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  enrollWithPayment: (
    course: Course,
    gateway: PaymentGateway,
    options?: {
      couponCode?: string;
      referralWelcome?: boolean;
      testMode?: boolean;
      externalPaymentId?: string;
      externalTransactionRef?: string;
    }
  ) => Promise<PaymentRecord>;
  getLemonSqueezyStatus: () => Promise<LemonSqueezyStatus>;
  createLemonSqueezyCheckout: (
    course: Course,
    options?: { couponCode?: string; giftCardCode?: string }
  ) => Promise<LemonSqueezyCheckoutSession>;
  verifyAndCompleteLemonSqueezyCheckout: (
    paymentId: string,
    courseId: string,
    orderId?: string
  ) => Promise<{
    verified: boolean;
    status: 'paid' | 'pending' | 'refunded';
    payment?: PaymentRecord;
    message?: string;
  }>;
  lemonSqueezyBanner: { status: 'verifying' | 'success' | 'pending' | 'error'; message: string } | null;
  clearLemonSqueezyBanner: () => void;
  completeLesson: (course: Course, lessonId: string, minutesSpent?: number) => Promise<{ progressPercent: number; certificateIssued?: Certificate }>;
  courseSyncState: CourseSyncState;
  getCourseSyncSnapshot: () => CourseSyncState;
  initCourseSync: (courseId: string | null) => void;
  markCourseUnsaved: (courseId?: string | null) => number;
  setCourseSyncError: (message: string | null, courseId?: string | null) => void;
  resetCourseSync: () => void;
  createCourse: (
    courseInput: Omit<Course, 'id' | 'instructorId' | 'instructorName' | 'createdAt' | 'updatedAt'>,
    syncOptions?: { targetRevision?: number }
  ) => Promise<Course>;
  updateCourse: (
    courseId: string,
    patch: Partial<Course>,
    syncOptions?: { targetRevision?: number }
  ) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  createCustomExercise: (input: Omit<CustomExcelExercise, 'id' | 'ownerId' | 'authorName' | 'createdAt' | 'updatedAt'>) => Promise<CustomExcelExercise>;
  deleteCustomExercise: (exerciseId: string) => Promise<void>;
  createForumThread: (courseId: string, title: string, body: string) => Promise<void>;
  addForumReply: (thread: ForumThread, body: string) => Promise<void>;
  upvoteForumThread: (thread: ForumThread) => Promise<void>;
  toggleForumThreadState: (thread: ForumThread, field: 'pinned' | 'resolved') => Promise<void>;
  createCalendarEvent: (ev: Omit<CalendarEvent, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleCalendarEventComplete: (ev: CalendarEvent) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  updateNotificationPrefs: (patch: Partial<UserPrivateInfo>) => Promise<void>;
  triggerPushAlert: (category: InAppNotification['category'], title: string, message: string, forceBrowserPush?: boolean) => void;
  markAllNotificationsRead: () => void;
  saveEncryptedNote: (titleHint: string, plaintext: string, courseId?: string) => Promise<void>;
  deleteEncryptedNote: (noteId: string) => Promise<void>;
  syncCloudBackup: (provider: CloudProvider, folder: string, autoBackup: boolean) => Promise<{ checksumSha256: string; syncedAt: string; bytes: number }>;
  createApiKey: (label: string, webhookUrl?: string) => Promise<{ rawKey: string; keyRecord: ApiIntegrationKey }>;
  toggleApiKey: (keyRecord: ApiIntegrationKey) => Promise<void>;
  deleteApiKey: (keyId: string) => Promise<void>;
  refreshVaultFingerprint: () => Promise<string>;
  submitAssignment: (courseId: string, lessonId: string, file: File, comment?: string) => Promise<AssignmentSubmission>;
  gradeAssignment: (submissionId: string, grade: number, feedback: string, requestResubmit?: boolean) => Promise<void>;
  deleteSubmission: (submissionId: string) => Promise<void>;
  giftCards: GiftCard[];
  giftCardRedemptions: GiftCardRedemption[];
  createGiftCards: (input: {
    amountCents: number;
    currency: CurrencyCode;
    courseId?: string;
    courseTitle?: string;
    singleUse?: boolean;
    quantity?: number;
    customCode?: string;
    expiresAtIso?: string;
    note?: string;
  }) => Promise<GiftCard[]>;
  toggleGiftCardActive: (card: GiftCard) => Promise<void>;
  deleteGiftCard: (cardCode: string) => Promise<void>;
  validateGiftCard: (code: string, course?: Course | null) => Promise<GiftCardValidationResult>;
  subscribeToGiftCard: (
    code: string,
    course: Course | null | undefined,
    onUpdate: (result: GiftCardValidationResult) => void
  ) => () => void;
  redeemGiftCardForCourse: (
    code: string,
    course: Course,
    partialGateway?: PaymentGateway,
    options?: { externalPaymentId?: string; externalTransactionRef?: string }
  ) => Promise<{ payment: PaymentRecord; redemption: GiftCardRedemption }>;
  redeemGiftCardCode: (
    code: string,
    targetCourse?: Course | null
  ) => Promise<{
    success: boolean;
    course: Course;
    payment: PaymentRecord;
    redemption: GiftCardRedemption;
  }>;
  coupons: Coupon[];
  createCoupon: (input: {
    code: string;
    description: string;
    type: CouponType;
    value: number;
    currency: CurrencyCode;
    appliesTo: CouponAppliesTo;
    courseIds: string[];
    maxRedemptions?: number;
    maxPerUser?: number;
    minPurchaseCents?: number;
    startsAtIso?: string;
    expiresAtIso?: string;
  }) => Promise<Coupon>;
  toggleCouponActive: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (couponCode: string) => Promise<void>;
  validateCoupon: (code: string, course: Course) => Promise<CouponValidationResult>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('catedra_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('catedra_lang');
    if (saved === 'es' || saved === 'en' || saved === 'fr' || saved === 'pt') return saved;
    return 'es';
  });

  const [activeView, setActiveView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify')) return 'certificates';
    }
    return 'landing';
  });
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<'student' | 'instructor'>('student');

  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const coursesRef = useRef<Course[]>(courses);
  coursesRef.current = courses;
  const [courseSyncState, setCourseSyncState] = useState<CourseSyncState>({
    courseId: null,
    status: 'idle',
    dirtyRevision: 0,
    savedRevision: 0,
    lastSavedAt: null,
    error: null,
  });
  const courseSyncRef = useRef<CourseSyncState>(courseSyncState);

  const commitCourseSync = useCallback(
    (updater: (prev: CourseSyncState) => CourseSyncState): CourseSyncState => {
      const next = updater(courseSyncRef.current);
      courseSyncRef.current = next;
      setCourseSyncState(next);
      return next;
    },
    []
  );

  const getCourseSyncSnapshot = useCallback(() => courseSyncRef.current, []);

  const initCourseSync = useCallback(
    (courseId: string | null) => {
      commitCourseSync(() => ({
        courseId,
        status: 'saved',
        dirtyRevision: 0,
        savedRevision: 0,
        lastSavedAt: Date.now(),
        error: null,
      }));
    },
    [commitCourseSync]
  );

  const markCourseUnsaved = useCallback(
    (courseId?: string | null): number => {
      const next = commitCourseSync((prev) => ({
        courseId: courseId !== undefined ? courseId : prev.courseId,
        status: prev.status === 'saving' ? 'saving' : 'unsaved',
        dirtyRevision: prev.dirtyRevision + 1,
        savedRevision: prev.savedRevision,
        lastSavedAt: prev.lastSavedAt,
        error: null,
      }));
      return next.dirtyRevision;
    },
    [commitCourseSync]
  );

  const setCourseSyncError = useCallback(
    (message: string | null, courseId?: string | null) => {
      commitCourseSync((prev) => ({
        ...prev,
        courseId: courseId !== undefined ? courseId : prev.courseId,
        status: message ? 'error' : prev.dirtyRevision > prev.savedRevision ? 'unsaved' : 'saved',
        error: message,
      }));
    },
    [commitCourseSync]
  );

  const resetCourseSync = useCallback(() => {
    commitCourseSync(() => ({
      courseId: null,
      status: 'idle',
      dirtyRevision: 0,
      savedRevision: 0,
      lastSavedAt: null,
      error: null,
    }));
  }, [commitCourseSync]);

  const [customExercises, setCustomExercises] = useState<CustomExcelExercise[]>(() =>
    loadLocalCustomExercises()
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [instructorEnrollments, setInstructorEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [instructorPayments, setInstructorPayments] = useState<PaymentRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [instructorCertificates, setInstructorCertificates] = useState<Certificate[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>(SEED_FORUM_THREADS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedNote[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiIntegrationKey[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>(() =>
    loadLocalSubmissions()
  );
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [giftCardRedemptions, setGiftCardRedemptions] = useState<GiftCardRedemption[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState(1);
  const [wsConnected, setWsConnected] = useState(false);
  const [e2eeFingerprint, setE2eeFingerprint] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const clearAuthError = useCallback(() => setAuthError(null), []);
  const [lemonSqueezyBanner, setLemonSqueezyBanner] = useState<{
    status: 'verifying' | 'success' | 'pending' | 'error';
    message: string;
  } | null>(null);
  const clearLemonSqueezyBanner = useCallback(() => setLemonSqueezyBanner(null), []);

  const wsRef = useRef<WebSocket | null>(null);
  const notifiedDeadlineIdsRef = useRef<Set<string>>(new Set());
  const handledLemonReturnRef = useRef<string | null>(null);

  const toggleZenMode = useCallback(() => {
    setZenMode((prev) => !prev);
  }, []);

  useEffect(() => {
    if (activeView !== 'learning' && zenMode) {
      setZenMode(false);
    }
  }, [activeView, zenMode]);

  const isAdmin = useMemo(
    () => Boolean(isAdminEmail(user?.email)),
    [user]
  );

  const t = useCallback(
    (key: TranslationKeys) => translations[language][key] || translations.es[key] || key,
    [language]
  );

  // Sync theme to <html> class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('catedra_theme', theme);
  }, [theme]);

  // Initialize E2EE Vault key fingerprint
  useEffect(() => {
    void getOrCreateVaultKey().then(({ fingerprint }) => setE2eeFingerprint(fingerprint));
  }, []);

  const refreshVaultFingerprint = useCallback(async () => {
    const { fingerprint } = await getOrCreateVaultKey();
    setE2eeFingerprint(fingerprint);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        e2eeKeyFingerprint: fingerprint,
        updatedAt: serverTimestamp(),
      });
    }
    return fingerprint;
  }, [user]);

  const triggerPushAlert = useCallback(
    (
      category: InAppNotification['category'],
      title: string,
      message: string,
      forceBrowserPush = false
    ) => {
      const item: InAppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category,
        title,
        message,
        createdAtIso: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 30));

      const shouldNotifyBrowser =
        forceBrowserPush ||
        (privateInfo?.pushEnabled !== false &&
          ((category === 'deadline' && privateInfo?.notifyDeadlines !== false) ||
            (category === 'forum' && privateInfo?.notifyForumReplies !== false) ||
            (category === 'payment' && privateInfo?.notifyPayments !== false) ||
            (category === 'certificate' && privateInfo?.notifyCertificates !== false) ||
            category === 'sync'));

      if (
        shouldNotifyBrowser &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, { body: message, icon: '/pwa-192x192.png' });
        } catch {
          // Ignore browser push restrictions in embedded frames
        }
      }
    },
    [privateInfo]
  );

  const sendWs = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Auth listener & profile bootstrapping
  useEffect(() => {
    let activeUid: string | null = null;
    let bootstrapCompletedForUid: string | null = null;
    let isBootstrapping = false;

    const runBootstrap = async (firebaseUser: User) => {
      if (isBootstrapping || bootstrapCompletedForUid === firebaseUser.uid) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      isBootstrapping = true;
      try {
        const { fingerprint } = await getOrCreateVaultKey();
        setE2eeFingerprint(fingerprint);

        const withRetry = async <T,>(op: () => Promise<T>): Promise<T> => {
          let lastError: unknown;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await op();
            } catch (err) {
              lastError = err;
              if (isFirestoreOfflineError(err) && attempt < 2) {
                await enableNetwork(db).catch(() => undefined);
                await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
                continue;
              }
              throw err;
            }
          }
          throw lastError;
        };

        if (!firebaseUser.emailVerified) {
          setProfile({
            uid: firebaseUser.uid,
            displayName: (firebaseUser.displayName || firebaseUser.email || 'Estudiante').slice(0, 100),
            photoURL: (firebaseUser.photoURL || '').slice(0, 500),
            role: 'student',
            preferredLanguage: language,
            preferredTheme: theme,
            e2eeKeyFingerprint: fingerprint,
            activeDevicesCount: 1,
          });
          if (activeUid === firebaseUser.uid) {
            bootstrapCompletedForUid = firebaseUser.uid;
          }
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        let snap;
        try {
          snap = await withRetry(() => getDoc(userRef));
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          throw err;
        }
        if (!snap.exists()) {
          try {
            await withRetry(() =>
              setDoc(userRef, {
                uid: firebaseUser.uid,
                displayName: (firebaseUser.displayName || firebaseUser.email || 'Estudiante').slice(0, 100),
                photoURL: (firebaseUser.photoURL || '').slice(0, 500),
                role: 'student',
                preferredLanguage: language,
                preferredTheme: theme,
                e2eeKeyFingerprint: fingerprint,
                activeDevicesCount: 1,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            );
          } catch (err) {
            if (!isFirestoreOfflineError(err)) {
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
            }
            throw err;
          }
        }

        const privRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
        let privSnap;
        try {
          privSnap = await withRetry(() => getDoc(privRef));
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}/private/info`);
          }
          throw err;
        }
        if (!privSnap.exists()) {
          try {
            await withRetry(() =>
              setDoc(privRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email || 'user@catedra.campus',
                pushEnabled: true,
                notifyDeadlines: true,
                notifyForumReplies: true,
                notifyPayments: true,
                notifyCertificates: true,
                deadlineLeadMinutes: 60,
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00',
                cloudProvider: 'none',
                cloudFolder: '/Catedra-Backups',
                cloudAutoBackup: false,
                cloudLastSyncedAt: '',
                updatedAt: serverTimestamp(),
              })
            );
          } catch (err) {
            if (!isFirestoreOfflineError(err)) {
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/private/info`);
            }
            throw err;
          }
        }

        const isCurrentAdmin = Boolean(
          firebaseUser.emailVerified && isAdminEmail(firebaseUser.email)
        );
        const alreadyCleaned = localStorage.getItem('db_academy_non_excel_cleaned_v1') === '1';

        if (isCurrentAdmin) {
          // Solo el administrador único puede sembrar, limpiar o actualizar cursos en Firestore
          let existingCourses;
          try {
            existingCourses = await withRetry(() => getDocs(collection(db, 'courses')));
          } catch (err) {
            if (!isFirestoreOfflineError(err)) {
              handleFirestoreError(err, OperationType.LIST, 'courses');
            }
            throw err;
          }
          const existingIds = new Set(existingCourses.docs.map((d) => d.id));
          const missingCourses = SEED_COURSES.filter((c) => !existingIds.has(c.id));
          const coursesToDelete = existingCourses.docs.filter((d) =>
            REMOVED_SEED_COURSE_IDS.includes(d.id)
          );

          const existingExcelSnap = existingCourses.docs.find(
            (d) => d.id === EXCEL_BASICO_COURSE.id
          );
          const existingExcelData = existingExcelSnap ? (existingExcelSnap.data() as Course) : null;
          const needsExcelReset = Boolean(
            existingExcelData &&
            (!existingExcelData.published ||
              (existingExcelData.title && existingExcelData.title.includes('eliminado')) ||
              !existingExcelData.modulesCount)
          );
          const excelMergeResult = existingExcelSnap && !needsExcelReset
            ? mergeSeedLessonsIntoCourse(existingExcelSnap.data() as Course)
            : null;
          const canUpdateExistingExcel = Boolean(existingExcelSnap && excelMergeResult?.changed);

          if (missingCourses.length > 0 || coursesToDelete.length > 0 || canUpdateExistingExcel || needsExcelReset) {
            const batch = writeBatch(db);
            for (const docSnap of coursesToDelete) {
              batch.delete(docSnap.ref);
            }
            for (const course of missingCourses) {
              batch.set(doc(db, 'courses', course.id), {
                ...course,
                instructorId: firebaseUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            if (needsExcelReset) {
              batch.set(doc(db, 'courses', EXCEL_BASICO_COURSE.id), {
                ...EXCEL_BASICO_COURSE,
                instructorId: firebaseUser.uid,
                updatedAt: serverTimestamp(),
              });
            } else if (canUpdateExistingExcel && excelMergeResult) {
              batch.update(doc(db, 'courses', EXCEL_BASICO_COURSE.id), {
                modulesCount: excelMergeResult.course.modulesCount,
                totalLessons: excelMergeResult.course.totalLessons,
                modules: excelMergeResult.course.modules,
                updatedAt: serverTimestamp(),
              });
            }
            try {
              await withRetry(() => batch.commit());
            } catch (err) {
              if (!isFirestoreOfflineError(err)) {
                handleFirestoreError(err, OperationType.WRITE, 'courses');
              }
              throw err;
            }
          }
          if (!alreadyCleaned) {
            localStorage.setItem('db_academy_non_excel_cleaned_v1', '1');
          }
        }
        if (activeUid === firebaseUser.uid) {
          bootstrapCompletedForUid = firebaseUser.uid;
        }
      } catch (err) {
        if (isFirestoreOfflineError(err)) {
          console.warn('Firestore unreachable during bootstrap; will retry when online.');
        } else {
          console.error('Bootstrap error:', err);
        }
      } finally {
        isBootstrapping = false;
      }
    };

    const handleOnline = () => {
      void enableNetwork(db).catch(() => undefined);
      if (auth.currentUser && bootstrapCompletedForUid !== auth.currentUser.uid) {
        void runBootstrap(auth.currentUser);
      }
    };
    window.addEventListener('online', handleOnline);

    void getRedirectResult(auth).catch((err: unknown) => {
      const code = (err as { code?: string })?.code;
      if (code && code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setAuthError(formatGoogleAuthError(err));
      }
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setAuthError(null);
      }

      if (!firebaseUser) {
        activeUid = null;
        bootstrapCompletedForUid = null;
        setProfile(null);
        setPrivateInfo(null);
        setEnrollments([]);
        setInstructorEnrollments([]);
        setPayments([]);
        setInstructorPayments([]);
        setCertificates([]);
        setCalendarEvents([]);
        setEncryptedNotes([]);
        setApiKeys([]);
        setGiftCards([]);
        setGiftCardRedemptions([]);
        setCoupons([]);
        return;
      }

      activeUid = firebaseUser.uid;
      await runBootstrap(firebaseUser);
    });
    return () => {
      window.removeEventListener('online', handleOnline);
      unsub();
    };
  }, []);

  // Real-time WebSocket multi-device sync
  useEffect(() => {
    if (!authReady || !user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    let closedByEffect = false;
    let reconnectTimer: number | null = null;
    const deviceId = getDeviceId();

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(
          JSON.stringify({
            type: 'IDENTIFY',
            uid: user.uid,
            deviceId,
            deviceLabel: getDeviceLabel(),
            role: workspaceRole,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as Record<string, unknown>;
          if (data.type === 'PRESENCE_SYNC' && typeof data.deviceCount === 'number') {
            setConnectedDevicesCount(Math.max(1, data.deviceCount));
          } else if (data.type === 'SYNC_PREFS') {
            if (data.theme === 'dark' || data.theme === 'light') {
              setTheme(data.theme);
            }
            if (
              data.language === 'es' ||
              data.language === 'en' ||
              data.language === 'fr' ||
              data.language === 'pt'
            ) {
              setLanguageState(data.language);
              localStorage.setItem('catedra_lang', data.language);
            }
          } else if (data.type === 'INSTRUCTOR_SALE' && data.courseTitle) {
            triggerPushAlert(
              'payment',
              'Nueva inscripción',
              `${String(data.courseTitle)} (${String(data.gateway).toUpperCase()})`
            );
          } else if (data.type === 'FORUM_POSTED' && data.senderUid !== user.uid) {
            triggerPushAlert(
              'forum',
              'Nuevo mensaje en foro',
              String(data.title || 'Se ha publicado un nuevo debate')
            );
          } else if (data.type === 'GIFT_CARD_REDEEMED' && data.senderUid !== user.uid) {
            triggerPushAlert(
              'payment',
              'Gift Card canjeada en tiempo real',
              `${String(data.courseTitle || 'Curso')} · Código ${String(data.cardCode || '')}`
            );
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      closedByEffect = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [authReady, user, workspaceRole, triggerPushAlert]);

  // Firestore real-time listeners (wait for authReady so Auth resolution doesn't abort initial stream)
  useEffect(() => {
    if (!authReady) return;

    const coursesQuery = isAdmin
      ? collection(db, 'courses')
      : query(collection(db, 'courses'), where('published', '==', true));

    const applyCoursesDocs = (docs: Array<{ data: () => unknown }>) => {
      if (docs.length > 0) {
        const loaded = docs
          .map((d) => mergeSeedLessonsIntoCourse(d.data() as Course).course)
          .filter((c) => !REMOVED_SEED_COURSE_IDS.includes(c.id));
        const loadedIds = new Set(loaded.map((c) => c.id));
        const merged = [
          ...loaded,
          ...SEED_COURSES.filter((s) => !loadedIds.has(s.id)),
        ];
        // Cursos Excel eliminados por ahora: no se mutan precios ni listados
        setCourses(merged);
      } else {
        setCourses(SEED_COURSES);
      }
    };

    if (!user) {
      let cancelled = false;
      void getDocs(coursesQuery)
        .then((snap) => {
          if (!cancelled) applyCoursesDocs(snap.docs);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Public courses fetch fallback:', msg);
        });
      return () => {
        cancelled = true;
      };
    }

    const unsubPublicCourses = onSnapshot(
      coursesQuery,
      (snap) => applyCoursesDocs(snap.docs),
      (err) => {
        console.warn('Public courses listener fallback:', err.message);
      }
    );
    return () => unsubPublicCourses();
  }, [authReady, user, isAdmin]);

  useEffect(() => {
    if (!authReady || !user) return;

    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (snap.exists()) {
            const p = snap.data() as UserProfile;
            setProfile(p);
            if (p.preferredTheme === 'dark' || p.preferredTheme === 'light') {
              setTheme(p.preferredTheme);
            }
            if (
              p.preferredLanguage === 'es' ||
              p.preferredLanguage === 'en' ||
              p.preferredLanguage === 'fr' ||
              p.preferredLanguage === 'pt'
            ) {
              setLanguageState(p.preferredLanguage);
              localStorage.setItem('catedra_lang', p.preferredLanguage);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', user.uid, 'private', 'info'),
        (snap) => {
          if (snap.exists()) {
            setPrivateInfo(snap.data() as UserPrivateInfo);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/private/info`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'enrollments'), where('studentId', '==', user.uid)),
        (snap) => setEnrollments(snap.docs.map((d) => d.data() as Enrollment)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'enrollments')
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'enrollments'),
          (snap) => setInstructorEnrollments(snap.docs.map((d) => d.data() as Enrollment)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'enrollments/instructor')
        )
      );
    } else {
      setInstructorEnrollments([]);
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'payments'), where('studentId', '==', user.uid)),
        (snap) => setPayments(snap.docs.map((d) => d.data() as PaymentRecord)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'payments'),
          (snap) => setInstructorPayments(snap.docs.map((d) => d.data() as PaymentRecord)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'payments/instructor')
        )
      );
    } else {
      setInstructorPayments([]);
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'certificates'), where('studentId', '==', user.uid)),
        (snap) => setCertificates(snap.docs.map((d) => d.data() as Certificate)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'certificates')
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'certificates'),
          (snap) => setInstructorCertificates(snap.docs.map((d) => d.data() as Certificate)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'certificates/instructor')
        )
      );
    } else {
      setInstructorCertificates([]);
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'forumThreads'), where('pinned', 'in', [true, false])),
        (snap) => {
          const loaded = snap.docs.map((d) => d.data() as ForumThread);
          const loadedIds = new Set(loaded.map((t) => t.id));
          const missing = SEED_FORUM_THREADS.filter((s) => !loadedIds.has(s.id));
          setForumThreads([...loaded, ...missing]);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'forumThreads');
          setForumThreads(SEED_FORUM_THREADS);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'calendarEvents'), where('ownerId', '==', user.uid)),
        (snap) => setCalendarEvents(snap.docs.map((d) => d.data() as CalendarEvent)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'calendarEvents')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'encryptedNotes'), where('ownerId', '==', user.uid)),
        (snap) => setEncryptedNotes(snap.docs.map((d) => d.data() as EncryptedNote)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'encryptedNotes')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'apiKeys'), where('ownerId', '==', user.uid)),
        (snap) => setApiKeys(snap.docs.map((d) => d.data() as ApiIntegrationKey)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'apiKeys')
      )
    );

    const customExQuery = isAdmin
      ? collection(db, 'customExercises')
      : query(collection(db, 'customExercises'), where('published', '==', true));
    unsubs.push(
      onSnapshot(
        customExQuery,
        (snap) => {
          const remote = snap.docs.map((d) => d.data() as CustomExcelExercise);
          const remoteIds = new Set(remote.map((x) => x.id));
          const localOnly = loadLocalCustomExercises().filter((x) => !remoteIds.has(x.id));
          setCustomExercises([...remote, ...localOnly]);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'customExercises')
      )
    );

    const submissionsQuery = isAdmin
      ? collection(db, 'assignmentSubmissions')
      : query(collection(db, 'assignmentSubmissions'), where('studentId', '==', user.uid));
    unsubs.push(
      onSnapshot(
        submissionsQuery,
        (snap) => {
          const remote = snap.docs.map((d) => d.data() as AssignmentSubmission);
          const remoteIds = new Set(remote.map((x) => x.id));
          const localOnly = loadLocalSubmissions().filter((x) => !remoteIds.has(x.id));
          const merged = [...remote, ...localOnly];
          saveLocalSubmissions(merged);
          setAssignmentSubmissions(merged);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'assignmentSubmissions');
          setAssignmentSubmissions(loadLocalSubmissions());
        }
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'giftCards'),
          (snap) => {
            const loaded = snap.docs
              .map((d) => d.data() as GiftCard)
              .sort((a, b) => (toEpochMs(b.createdAt) ?? 0) - (toEpochMs(a.createdAt) ?? 0));
            setGiftCards(loaded);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'giftCards')
        )
      );
    } else {
      setGiftCards([]);
    }

    const redemptionsQuery = isAdmin
      ? collection(db, 'giftCardRedemptions')
      : query(collection(db, 'giftCardRedemptions'), where('studentId', '==', user.uid));
    unsubs.push(
      onSnapshot(
        redemptionsQuery,
        (snap) => {
          const loaded = snap.docs
            .map((d) => d.data() as GiftCardRedemption)
            .sort((a, b) => (toEpochMs(b.redeemedAt) ?? 0) - (toEpochMs(a.redeemedAt) ?? 0));
          setGiftCardRedemptions(loaded);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'giftCardRedemptions')
      )
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'coupons'),
          (snap) => {
            setCoupons(snap.docs.map((d) => d.data() as Coupon));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
        )
      );
    } else {
      setCoupons([]);
    }

    return () => unsubs.forEach((u) => u());
  }, [authReady, user, isAdmin]);

  // Real-time Calendar Deadline & Push Notification Engine
  useEffect(() => {
    if (!user || calendarEvents.length === 0) return;

    const checkDeadlines = () => {
      if (privateInfo && !privateInfo.notifyDeadlines) return;
      const now = Date.now();
      for (const ev of calendarEvents) {
        if (ev.completed) continue;
        if (notifiedDeadlineIdsRef.current.has(ev.id)) continue;
        const dueMs = new Date(ev.dueAtIso).getTime();
        const leadMs = (ev.reminderMinutes || privateInfo?.deadlineLeadMinutes || 60) * 60 * 1000;
        if (dueMs - now <= leadMs && dueMs - now >= -24 * 60 * 60 * 1000) {
          notifiedDeadlineIdsRef.current.add(ev.id);
          const minsLeft = Math.max(0, Math.round((dueMs - now) / 60000));
          triggerPushAlert(
            'deadline',
            `Fecha límite próxima: ${ev.title}`,
            minsLeft === 0 ? 'Vence ahora mismo' : `Vence en ${minsLeft} min`
          );
        }
      }
    };

    checkDeadlines();
    const timer = window.setInterval(checkDeadlines, 15000);
    return () => window.clearInterval(timer);
  }, [user, calendarEvents, privateInfo, triggerPushAlert]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError(formatGoogleAuthError(err));
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError(formatGoogleAuthError(err));
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return { success: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === 'auth/operation-not-allowed') {
          return {
            success: false,
            message:
              'El acceso con correo y contraseña no está habilitado en Firebase. Usa el acceso con Google.',
          };
        }
        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password'
        ) {
          return { success: false, message: 'Correo o contraseña incorrectos.' };
        }
        if (code === 'auth/too-many-requests') {
          return { success: false, message: 'Demasiados intentos. Intenta más tarde o usa Google.' };
        }
        return {
          success: false,
          message: err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
        };
      }
    },
    []
  );

  const signInAsAdmin = useCallback(async () => {
    setAuthError(null);
    googleProvider.setCustomParameters({ prompt: 'select_account', login_hint: AUTHORIZED_ADMIN_EMAIL });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError(formatGoogleAuthError(err));
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError(formatGoogleAuthError(err));
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    sendWs({ type: 'SYNC_PREFS', theme: next });
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          preferredTheme: next,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  }, [theme, user, sendWs]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem('catedra_lang', lang);
      sendWs({ type: 'SYNC_PREFS', language: lang });
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            preferredLanguage: lang,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    },
    [user, sendWs]
  );

  const normalizeCouponCode = (raw: string): string =>
    raw.trim().toUpperCase().replace(/\s+/g, '');

  const toEpochMs = (val: unknown): number | null => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: unknown }).toMillis === 'function') {
      return (val as { toMillis: () => number }).toMillis();
    }
    if (typeof val === 'string' || typeof val === 'number') {
      const ms = new Date(val).getTime();
      return Number.isFinite(ms) ? ms : null;
    }
    return null;
  };

  const createCoupon = useCallback(
    async (input: {
      code: string;
      description: string;
      type: CouponType;
      value: number;
      currency: CurrencyCode;
      appliesTo: CouponAppliesTo;
      courseIds: string[];
      maxRedemptions?: number;
      maxPerUser?: number;
      minPurchaseCents?: number;
      startsAtIso?: string;
      expiresAtIso?: string;
    }): Promise<Coupon> => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede crear cupones.');
      }
      const verifiedAdmin = await assertPlatformAdminWrite('crear cupón', user);

      const code = normalizeCouponCode(input.code);
      if (!/^[A-Z0-9_-]{3,64}$/.test(code)) {
        throw new Error('El código del cupón debe tener entre 3 y 64 caracteres (A-Z, 0-9, "-" o "_").');
      }

      const description = input.description.trim().slice(0, 240);
      if (!description) {
        throw new Error('Agrega una descripción breve para el cupón.');
      }

      const rawValue = Math.round(Number(input.value));
      if (!Number.isFinite(rawValue) || rawValue < 1) {
        throw new Error('El valor del cupón debe ser mayor que 0.');
      }
      if (input.type === 'percent' && rawValue > 100) {
        throw new Error('El descuento porcentual debe estar entre 1% y 100%.');
      }
      if (input.type === 'fixed' && rawValue > 10000000) {
        throw new Error('El descuento fijo supera el límite permitido.');
      }

      const existingSnap = await getDoc(doc(db, 'coupons', code));
      if (existingSnap.exists()) {
        throw new Error(`El cupón "${code}" ya existe.`);
      }

      let startsTimestamp: Timestamp | null = null;
      if (input.startsAtIso && input.startsAtIso.trim()) {
        const d = new Date(input.startsAtIso);
        if (Number.isNaN(d.getTime())) throw new Error('Fecha de inicio inválida.');
        startsTimestamp = Timestamp.fromDate(d);
      }

      let expiresTimestamp: Timestamp | null = null;
      if (input.expiresAtIso && input.expiresAtIso.trim()) {
        const d = new Date(input.expiresAtIso);
        if (Number.isNaN(d.getTime())) throw new Error('Fecha de expiración inválida.');
        expiresTimestamp = Timestamp.fromDate(d);
      }

      if (startsTimestamp && expiresTimestamp && expiresTimestamp.toMillis() <= startsTimestamp.toMillis()) {
        throw new Error('La fecha de expiración debe ser posterior a la fecha de inicio.');
      }

      const maxRedemptions =
        typeof input.maxRedemptions === 'number' && Number.isFinite(input.maxRedemptions) && input.maxRedemptions >= 1
          ? Math.min(1000000, Math.round(input.maxRedemptions))
          : undefined;
      const maxPerUser =
        typeof input.maxPerUser === 'number' && Number.isFinite(input.maxPerUser) && input.maxPerUser >= 1
          ? Math.min(1000, Math.round(input.maxPerUser))
          : 1;
      const minPurchaseCents =
        typeof input.minPurchaseCents === 'number' && Number.isFinite(input.minPurchaseCents) && input.minPurchaseCents >= 0
          ? Math.min(10000000, Math.round(input.minPurchaseCents))
          : undefined;

      const courseIds = input.appliesTo === 'courses'
        ? input.courseIds.map((c) => c.trim()).filter(Boolean).slice(0, 50)
        : [];
      if (input.appliesTo === 'courses' && courseIds.length === 0) {
        throw new Error('Indica al menos un ID de curso para cupones específicos.');
      }

      const payload: Record<string, unknown> = {
        id: code,
        code,
        description,
        type: input.type,
        value: rawValue,
        currency: input.currency,
        appliesTo: input.appliesTo,
        courseIds,
        maxPerUser,
        redemptionCount: 0,
        active: true,
        createdBy: verifiedAdmin.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(startsTimestamp ? { startsAt: startsTimestamp } : {}),
        ...(expiresTimestamp ? { expiresAt: expiresTimestamp } : {}),
        ...(maxRedemptions !== undefined ? { maxRedemptions } : {}),
        ...(minPurchaseCents !== undefined ? { minPurchaseCents } : {}),
      };

      try {
        await setDoc(doc(db, 'coupons', code), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `coupons/${code}`);
      }

      return {
        id: code,
        code,
        description,
        type: input.type,
        value: rawValue,
        currency: input.currency,
        appliesTo: input.appliesTo,
        courseIds,
        startsAt: startsTimestamp ?? undefined,
        expiresAt: expiresTimestamp ?? undefined,
        maxRedemptions,
        maxPerUser,
        minPurchaseCents,
        redemptionCount: 0,
        active: true,
        createdBy: verifiedAdmin.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    [user, isAdmin]
  );

  const toggleCouponActive = useCallback(
    async (coupon: Coupon) => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede modificar cupones.');
      }
      await assertPlatformAdminWrite('actualizar cupón', user);
      try {
        await updateDoc(doc(db, 'coupons', coupon.code), {
          active: !coupon.active,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `coupons/${coupon.code}`);
      }
    },
    [user, isAdmin]
  );

  const deleteCoupon = useCallback(
    async (couponCode: string) => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede eliminar cupones.');
      }
      await assertPlatformAdminWrite('eliminar cupón', user);
      try {
        await deleteDoc(doc(db, 'coupons', couponCode));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${couponCode}`);
      }
    },
    [user, isAdmin]
  );

  const validateCoupon = useCallback(
    async (rawCode: string, course: Course): Promise<CouponValidationResult> => {
      const baseInvalid = (reason: string): CouponValidationResult => ({
        valid: false,
        originalPriceCents: course.priceCents,
        discountCents: 0,
        finalPriceCents: course.priceCents,
        currency: course.currency,
        reason,
      });

      if (!user) {
        return baseInvalid('Inicia sesión con Google para aplicar un cupón.');
      }

      const code = normalizeCouponCode(rawCode);
      if (!/^[A-Z0-9_-]{3,64}$/.test(code)) {
        return baseInvalid('Formato de código inválido.');
      }

      let snap;
      try {
        snap = await getDoc(doc(db, 'coupons', code));
      } catch (err) {
        if (isFirestoreOfflineError(err)) {
          return baseInvalid('Sin conexión con el servidor para verificar el cupón.');
        }
        const fbCode = (err as { code?: string })?.code;
        if (fbCode === 'permission-denied') {
          handleFirestoreError(err, OperationType.GET, `coupons/${code}`);
        }
        return baseInvalid('No se pudo verificar el cupón.');
      }

      if (!snap.exists()) {
        return baseInvalid('Cupón no encontrado.');
      }

      const coupon = snap.data() as Coupon;
      if (!coupon.active) {
        return baseInvalid('Este cupón está desactivado.');
      }

      const now = Date.now();
      const startsMs = toEpochMs(coupon.startsAt);
      if (startsMs !== null && now < startsMs) {
        return baseInvalid('Este cupón aún no entra en vigencia.');
      }
      const expiresMs = toEpochMs(coupon.expiresAt);
      if (expiresMs !== null && now > expiresMs) {
        return baseInvalid('Este cupón ha expirado.');
      }

      if (typeof coupon.maxRedemptions === 'number' && coupon.redemptionCount >= coupon.maxRedemptions) {
        return baseInvalid('Este cupón alcanzó el límite máximo de canjes.');
      }

      if (coupon.appliesTo === 'courses' && !coupon.courseIds.includes(course.id)) {
        return baseInvalid('Este cupón no aplica para este curso.');
      }

      if (coupon.type === 'fixed' && coupon.currency !== course.currency) {
        return baseInvalid(`Este cupón es en ${coupon.currency}, pero el curso está en ${course.currency}.`);
      }

      if (typeof coupon.minPurchaseCents === 'number' && course.priceCents < coupon.minPurchaseCents) {
        return baseInvalid(
          `Compra mínima requerida: ${(coupon.minPurchaseCents / 100).toFixed(2)} ${course.currency}.`
        );
      }

      if (coupon.maxPerUser > 0) {
        try {
          const userRedemptionsSnap = await getDocs(
            query(collection(db, 'couponRedemptions'), where('userId', '==', user.uid))
          );
          const usedByUser = userRedemptionsSnap.docs.filter((d) => {
            const data = d.data() as CouponRedemption;
            return data.couponCode === code && data.status !== 'refunded';
          }).length;
          if (usedByUser >= coupon.maxPerUser) {
            return baseInvalid('Ya alcanzaste el máximo de usos permitidos para este cupón.');
          }
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            handleFirestoreError(err, OperationType.LIST, 'couponRedemptions');
          }
          return baseInvalid('No se pudo verificar el límite de uso del cupón.');
        }
      }

      const discountCents =
        coupon.type === 'percent'
          ? Math.min(course.priceCents, Math.round((course.priceCents * coupon.value) / 100))
          : Math.min(course.priceCents, coupon.value);
      const finalPriceCents = Math.max(0, course.priceCents - discountCents);

      return {
        valid: true,
        originalPriceCents: course.priceCents,
        discountCents,
        finalPriceCents,
        currency: course.currency,
        coupon,
      };
    },
    [user]
  );

  const enrollWithPayment = useCallback(
    async (
      course: Course,
      gateway: PaymentGateway,
      options?: {
        couponCode?: string;
        referralWelcome?: boolean;
        testMode?: boolean;
        externalPaymentId?: string;
        externalTransactionRef?: string;
      }
    ): Promise<PaymentRecord> => {
      if (!user) throw new Error('Authentication required');

      // Validar prerrequisitos estrictos
      if (course.prerequisites && course.prerequisites.length > 0 && !isAdmin) {
        const unmet = course.prerequisites.filter((prereqId) => {
          const enr = enrollments.find((e) => e.courseId === prereqId);
          const hasCert = certificates.some((c) => c.courseId === prereqId);
          return !((enr && enr.progressPercent >= 100) || hasCert);
        });
        if (unmet.length > 0) {
          const prereqCourse = courses.find((c) => c.id === unmet[0]);
          throw new Error(
            `Prerrequisito obligatorio no completado: Debes completar y aprobar primero "${prereqCourse?.title || unmet[0]}".`
          );
        }
      }

      const rawCouponCode = options?.couponCode ? normalizeCouponCode(options.couponCode) : '';
      const testMode = Boolean(isAdmin && options?.testMode === true);

      // Ensure the course document exists in Firestore before enrollment/payment rules check exists()
      const courseRef = doc(db, 'courses', course.id);
      const courseSnap = await getDoc(courseRef);
      let resolvedInstructorId =
        course.instructorId === 'platform-faculty' ? user.uid : course.instructorId;
      let authoritativePriceCents = course.priceCents;
      let authoritativeCurrency = course.currency;

      if (!courseSnap.exists()) {
        if (isAdmin && user.emailVerified) {
          await assertPlatformAdminWrite('registrar curso en inscripción', user);
          try {
            await setDoc(courseRef, {
              ...course,
              instructorId: resolvedInstructorId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `courses/${course.id}`);
          }
        } else {
          throw new Error(
            'El curso aún no está publicado en Firestore. Solicita al administrador (Marinodavidr7@gmail.com) que inicie sesión para sincronizar el catálogo.'
          );
        }
      } else {
        const cData = courseSnap.data() as Course;
        resolvedInstructorId = String(cData.instructorId || resolvedInstructorId);
        authoritativePriceCents = Math.max(0, Math.round(Number(cData.priceCents ?? course.priceCents)));
        authoritativeCurrency =
          cData.currency === 'DOP' || cData.currency === 'USD' || cData.currency === 'EUR' || cData.currency === 'MXN'
            ? cData.currency
            : 'DOP';
      }

      const authoritativeCourse: Course = {
        ...course,
        priceCents: authoritativePriceCents,
        currency: authoritativeCurrency,
        instructorId: resolvedInstructorId,
      };

      const enrollmentId = `${course.id}_${user.uid}`;
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      const existingEnrollmentSnap = await getDoc(enrollmentRef);
      if (existingEnrollmentSnap.exists() && !testMode) {
        throw new Error('Ya estás inscrito en este curso.');
      }

      let discountCents = 0;
      let finalAmount = authoritativePriceCents;
      let appliedCouponCode = '';

      if (rawCouponCode) {
        const validation = await validateCoupon(rawCouponCode, authoritativeCourse);
        if (!validation.valid || !validation.coupon) {
          throw new Error(validation.reason || 'Cupón inválido.');
        }
        if (!testMode && !user.emailVerified) {
          throw new Error('Tu cuenta requiere correo verificado para canjear cupones.');
        }
        discountCents = validation.discountCents;
        finalAmount = validation.finalPriceCents;
        appliedCouponCode = validation.coupon.code;
      }

      const paymentId =
        options?.externalPaymentId && /^[a-zA-Z0-9_-]{4,128}$/.test(options.externalPaymentId)
          ? options.externalPaymentId
          : authoritativePriceCents === 0 && !appliedCouponCode
            ? `free_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
            : `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const transactionRef =
        options?.externalTransactionRef && options.externalTransactionRef.length >= 4
          ? options.externalTransactionRef.slice(0, 100)
          : finalAmount === 0 && !appliedCouponCode
            ? `gratis_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
            : testMode
              ? `test_${gateway.slice(0, 4)}_${Date.now().toString(36)}`
              : `${gateway.slice(0, 4)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

      const resolvedGateway: PaymentGateway = finalAmount === 0 ? 'free' : gateway;
      const discountSource: PaymentRecord['discountSource'] = appliedCouponCode ? 'coupon' : 'none';

      const paymentPayload: PaymentRecord = {
        id: paymentId,
        courseId: course.id,
        courseTitle: course.title.slice(0, 140),
        studentId: user.uid,
        instructorId: resolvedInstructorId,
        amountCents: finalAmount,
        originalAmountCents: authoritativePriceCents,
        discountCents,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        discountSource,
        currency: authoritativeCurrency,
        gateway: resolvedGateway,
        status: 'succeeded',
        transactionRef,
        createdAt: serverTimestamp(),
      };

      const enrollmentPayload = {
        id: enrollmentId,
        courseId: course.id,
        courseTitle: course.title.slice(0, 140),
        studentId: user.uid,
        studentName: (user.displayName || user.email || 'Estudiante').slice(0, 100),
        instructorId: resolvedInstructorId,
        completedModuleIds: [],
        completedLessonIds: [],
        progressPercent: 0,
        studyMinutes: 0,
        status: 'active',
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (appliedCouponCode && !testMode) {
        const couponRef = doc(db, 'coupons', appliedCouponCode);
        try {
          await runTransaction(db, async (tx) => {
            const [cSnap, eSnap] = await Promise.all([tx.get(couponRef), tx.get(enrollmentRef)]);
            if (!cSnap.exists()) {
              throw new Error('Cupón no encontrado.');
            }
            const couponData = cSnap.data() as Coupon;
            if (!couponData.active) {
              throw new Error('Este cupón ya no está activo.');
            }
            if (typeof couponData.maxRedemptions === 'number' && couponData.redemptionCount >= couponData.maxRedemptions) {
              throw new Error('Este cupón alcanzó su límite de canjes.');
            }

            const nextRedemptionNumber = (couponData.redemptionCount || 0) + 1;
            const redemptionId = `${appliedCouponCode}_${nextRedemptionNumber}`;

            tx.update(couponRef, {
              redemptionCount: nextRedemptionNumber,
              updatedAt: serverTimestamp(),
            });
            tx.set(doc(db, 'couponRedemptions', redemptionId), {
              id: redemptionId,
              couponCode: appliedCouponCode,
              redemptionNumber: nextRedemptionNumber,
              userId: user.uid,
              courseId: course.id,
              orderId: paymentId,
              discountCents,
              status: 'confirmed',
              createdAt: serverTimestamp(),
            });
            tx.set(doc(db, 'payments', paymentId), paymentPayload);
            if (!eSnap.exists()) {
              tx.set(enrollmentRef, enrollmentPayload);
            }
          });
        } catch (err) {
          const fbCode = (err as { code?: string })?.code;
          if (fbCode === 'permission-denied') {
            handleFirestoreError(err, OperationType.WRITE, `coupons/${appliedCouponCode}`);
          }
          throw err;
        }
      } else {
        const batch = writeBatch(db);
        batch.set(doc(db, 'payments', paymentId), paymentPayload);
        if (!existingEnrollmentSnap.exists()) {
          batch.set(enrollmentRef, enrollmentPayload);
        }
        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'payments+enrollments');
        }
      }

      if (!existingEnrollmentSnap.exists()) {
        try {
          const deadlineId = `cal_${course.id}_${Date.now().toString(36)}`;
          await setDoc(doc(db, 'calendarEvents', deadlineId), {
            id: deadlineId,
            ownerId: user.uid,
            courseId: course.id,
            courseTitle: course.title.slice(0, 140),
            title: `Completar Módulo 1: ${course.title.slice(0, 80)}`,
            type: 'deadline',
            dueAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
            priority: 'medium',
            reminderMinutes: privateInfo?.deadlineLeadMinutes ?? 60,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Non-blocking calendar deadline sync
        }
      }

      triggerPushAlert(
        'payment',
        t('paymentSuccess'),
        finalAmount === 0
          ? `${course.title} (${appliedCouponCode ? `Cupón ${appliedCouponCode}` : 'Inscripción gratuita'})`
          : `${course.title} (${resolvedGateway.toUpperCase()} · ${transactionRef})`
      );
      return paymentPayload;
    },
    [user, isAdmin, enrollments, certificates, courses, privateInfo, validateCoupon, triggerPushAlert, t]
  );

  const completeLesson = useCallback(
    async (
      course: Course,
      lessonId: string,
      minutesSpent = 15
    ): Promise<{ progressPercent: number; certificateIssued?: Certificate }> => {
      if (!user) throw new Error('Authentication required');
      const enrollmentId = `${course.id}_${user.uid}`;
      const current = enrollments.find((e) => e.id === enrollmentId);
      if (!current) {
        if (isAdmin || course.instructorId === user.uid) {
          return { progressPercent: 0 };
        }
        throw new Error('Enrollment not found');
      }

      if (current.completedLessonIds.includes(lessonId) || current.status === 'completed') {
        return { progressPercent: current.progressPercent };
      }

      const completedLessonIds = Array.from(new Set([...current.completedLessonIds, lessonId]));
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 1;
      const completedModuleIds = course.modules
        .filter((m) => m.lessons.every((l) => completedLessonIds.includes(l.id)))
        .map((m) => m.id);
      const progressPercent = Math.min(
        100,
        Math.round((completedLessonIds.length / totalLessons) * 100)
      );
      const isCompleted = progressPercent === 100;

      const batch = writeBatch(db);
      batch.update(doc(db, 'enrollments', enrollmentId), {
        completedLessonIds,
        completedModuleIds,
        progressPercent,
        studyMinutes: Math.min(100000, (current.studyMinutes || 0) + minutesSpent),
        status: isCompleted ? 'completed' : 'active',
        updatedAt: serverTimestamp(),
      });

      let issuedCert: Certificate | undefined;
      if (isCompleted && !certificates.some((c) => c.courseId === course.id)) {
        const certId = `cert_${course.id}_${user.uid}`.slice(0, 128);
        const verificationCode = `CAT-${course.id.slice(0, 4).toUpperCase()}-${user.uid.slice(0, 6).toUpperCase()}`;
        const hashSignature = await sha256Hex(`${certId}|${verificationCode}|${course.title}|${user.uid}`);
        issuedCert = {
          id: certId,
          verificationCode,
          courseId: course.id,
          courseTitle: course.title.slice(0, 140),
          studentId: user.uid,
          studentName: (user.displayName || user.email || 'Estudiante').slice(0, 100),
          instructorId: course.instructorId,
          instructorName: course.instructorName.slice(0, 100),
          completionPercent: 100,
          hashSignature,
          issuedAt: serverTimestamp(),
        };
        batch.set(doc(db, 'certificates', certId), issuedCert);
      }

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `enrollments/${enrollmentId}`);
      }

      sendWs({
        type: 'PROGRESS_UPDATED',
        courseId: course.id,
        instructorId: course.instructorId,
        progressPercent,
      });

      if (issuedCert) {
        sendWs({
          type: 'CERTIFICATE_ISSUED',
          courseId: course.id,
          instructorId: course.instructorId,
          verificationCode: issuedCert.verificationCode,
        });
        triggerPushAlert(
          'certificate',
          'Certificado emitido automáticamente',
          `${course.title} · ${issuedCert.verificationCode}`,
          true
        );
      }

      return { progressPercent, certificateIssued: issuedCert };
    },
    [user, enrollments, certificates, sendWs, triggerPushAlert]
  );

  const createCourse = useCallback(
    async (
      courseInput: Omit<Course, 'id' | 'instructorId' | 'instructorName' | 'createdAt' | 'updatedAt'>,
      syncOptions?: { targetRevision?: number }
    ): Promise<Course> => {
      const targetRevision = syncOptions?.targetRevision ?? courseSyncRef.current.dirtyRevision;
      commitCourseSync((prev) => ({
        ...prev,
        status: 'saving',
        error: null,
      }));
      if (!user || !isAdmin) {
        const msg = 'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede crear cursos.';
        commitCourseSync((prev) => ({ ...prev, status: 'error', error: msg }));
        throw new Error(msg);
      }
      const id = `crs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        const verifiedAdmin = await assertPlatformAdminWrite('crear cursos', user);
        const createdCourse: Course = {
          ...courseInput,
          id,
          instructorId: verifiedAdmin.uid,
          instructorName: (verifiedAdmin.displayName || verifiedAdmin.email || 'Profesor').slice(0, 100),
        };
        await setDoc(doc(db, 'courses', id), {
          ...createdCourse,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const nextSavedRevision = Math.max(courseSyncRef.current.savedRevision, targetRevision);
        const allSaved = courseSyncRef.current.dirtyRevision <= nextSavedRevision;
        commitCourseSync((prev) => ({
          ...prev,
          courseId: id,
          savedRevision: nextSavedRevision,
          lastSavedAt: Date.now(),
          status: allSaved ? 'saved' : 'unsaved',
          error: null,
        }));
        return createdCourse;
      } catch (err) {
        commitCourseSync((prev) => ({
          ...prev,
          status: 'error',
          error: extractCourseSyncError(err),
        }));
        handleFirestoreError(err, OperationType.CREATE, `courses/${id}`);
      }
    },
    [user, isAdmin, commitCourseSync]
  );

  const updateCourse = useCallback(
    async (
      courseId: string,
      patch: Partial<Course>,
      syncOptions?: { targetRevision?: number }
    ) => {
      const targetRevision = syncOptions?.targetRevision ?? courseSyncRef.current.dirtyRevision;
      commitCourseSync((prev) => ({
        ...prev,
        courseId,
        status: 'saving',
        error: null,
      }));
      if (!user || !isAdmin) {
        const msg = 'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede editar cursos.';
        commitCourseSync((prev) => ({ ...prev, courseId, status: 'error', error: msg }));
        throw new Error(msg);
      }
      try {
        const verifiedAdmin = await assertPlatformAdminWrite('editar cursos', user);
        const courseRef = doc(db, 'courses', courseId);
        const allowedPatch: Record<string, unknown> = {};

        if (typeof patch.title === 'string') allowedPatch.title = patch.title.trim().slice(0, 140);
        if (typeof patch.subtitle === 'string') allowedPatch.subtitle = patch.subtitle.trim().slice(0, 240);
        if (typeof patch.description === 'string') {
          allowedPatch.description = patch.description.trim().slice(0, 2000);
        }
        if (typeof patch.category === 'string') allowedPatch.category = patch.category.trim().slice(0, 60);
        if (patch.level === 'beginner' || patch.level === 'intermediate' || patch.level === 'advanced') {
          allowedPatch.level = patch.level;
        }
        if (typeof patch.priceCents === 'number') {
          allowedPatch.priceCents = Math.max(0, Math.min(10000000, Math.round(patch.priceCents)));
        }
        if (patch.currency === 'DOP' || patch.currency === 'USD' || patch.currency === 'EUR' || patch.currency === 'MXN') {
          allowedPatch.currency = patch.currency;
        }
        if (typeof patch.coverImage === 'string') {
          allowedPatch.coverImage = patch.coverImage.slice(0, 300000);
        }
        if (typeof patch.instructorName === 'string') {
          allowedPatch.instructorName = patch.instructorName.trim().slice(0, 100);
        }
        if (typeof patch.published === 'boolean') allowedPatch.published = patch.published;
        if (Array.isArray(patch.prerequisites)) {
          allowedPatch.prerequisites = patch.prerequisites
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 10);
        }
        if (Array.isArray(patch.technologies)) {
          allowedPatch.technologies = patch.technologies
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 20);
        }

        if (Array.isArray(patch.modules) && patch.modules.length > 0) {
          const modulesSlice = patch.modules.slice(0, 12);
          allowedPatch.modules = modulesSlice;
          allowedPatch.modulesCount = modulesSlice.length;
          allowedPatch.totalLessons = Math.max(
            1,
            modulesSlice.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
          );
        } else {
          if (typeof patch.modulesCount === 'number') allowedPatch.modulesCount = patch.modulesCount;
          if (typeof patch.totalLessons === 'number') allowedPatch.totalLessons = patch.totalLessons;
        }

        const snap = await getDoc(courseRef);
        if (snap.exists()) {
          await updateDoc(courseRef, {
            ...allowedPatch,
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingLocal = coursesRef.current.find((c) => c.id === courseId);
          if (!existingLocal) throw new Error('Course not found');
          await setDoc(courseRef, {
            ...existingLocal,
            ...allowedPatch,
            id: courseId,
            instructorId: verifiedAdmin.uid,
            instructorName: (verifiedAdmin.displayName || verifiedAdmin.email || existingLocal.instructorName || 'Profesor').slice(0, 100),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const nextSavedRevision = Math.max(courseSyncRef.current.savedRevision, targetRevision);
        const allSaved = courseSyncRef.current.dirtyRevision <= nextSavedRevision;
        commitCourseSync((prev) => ({
          ...prev,
          courseId,
          savedRevision: nextSavedRevision,
          lastSavedAt: Date.now(),
          status: allSaved ? 'saved' : 'unsaved',
          error: null,
        }));
      } catch (err) {
        commitCourseSync((prev) => ({
          ...prev,
          courseId,
          status: 'error',
          error: extractCourseSyncError(err),
        }));
        handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
      }
    },
    [user, isAdmin, commitCourseSync]
  );

  const deleteCourse = useCallback(
    async (courseId: string) => {
      if (!user || !isAdmin) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede eliminar cursos.'
        );
      }
      await assertPlatformAdminWrite('eliminar cursos', user);
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
    },
    [user, isAdmin, selectedCourseId]
  );

  const createCustomExercise = useCallback(
    async (
      input: Omit<CustomExcelExercise, 'id' | 'ownerId' | 'authorName' | 'createdAt' | 'updatedAt'>
    ): Promise<CustomExcelExercise> => {
      if (!user || !isAdmin) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede crear ejercicios.'
        );
      }
      const verifiedAdmin = await assertPlatformAdminWrite('crear ejercicios', user);
      const id = `ex_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const ownerId = verifiedAdmin.uid;
      const authorName = (verifiedAdmin.displayName || verifiedAdmin.email || 'Administrador').slice(0, 100);
      const localRecord: CustomExcelExercise = {
        id,
        ownerId,
        authorName,
        lessonId: input.lessonId,
        functionTag: input.functionTag.trim().slice(0, 60) || '=SI()',
        title: input.title.trim().slice(0, 140),
        prompt: input.prompt.trim().slice(0, 600),
        hint: input.hint.trim().slice(0, 400),
        targetCell: input.targetCell,
        solutionFormula: input.solutionFormula.trim().slice(0, 240),
        expectedResult: input.expectedResult.trim().slice(0, 120),
        initialSheet: input.initialSheet,
        published: input.published,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'customExercises', id), {
          id,
          ownerId: verifiedAdmin.uid,
          authorName,
          lessonId: localRecord.lessonId,
          functionTag: localRecord.functionTag,
          title: localRecord.title,
          prompt: localRecord.prompt,
          hint: localRecord.hint,
          targetCell: localRecord.targetCell,
          solutionFormula: localRecord.solutionFormula,
          expectedResult: localRecord.expectedResult,
          initialSheet: localRecord.initialSheet,
          published: localRecord.published,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.CREATE, `customExercises/${id}`);
        }
      }

      const nextLocal = [...loadLocalCustomExercises(), localRecord];
      saveLocalCustomExercises(nextLocal);
      setCustomExercises((prev) => [...prev.filter((x) => x.id !== id), localRecord]);

      return localRecord;
    },
    [user, isAdmin]
  );

  const deleteCustomExercise = useCallback(
    async (exerciseId: string) => {
      if (!user || !isAdmin) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede eliminar ejercicios.'
        );
      }
      await assertPlatformAdminWrite('eliminar ejercicios', user);
      try {
        await deleteDoc(doc(db, 'customExercises', exerciseId));
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `customExercises/${exerciseId}`);
        }
      }

      const nextLocal = loadLocalCustomExercises().filter((x) => x.id !== exerciseId);
      saveLocalCustomExercises(nextLocal);
      setCustomExercises((prev) => prev.filter((x) => x.id !== exerciseId));
    },
    [user, isAdmin]
  );

  const createForumThread = useCallback(
    async (courseId: string, title: string, body: string) => {
      if (!user) throw new Error('Authentication required');
      const id = `thr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'forumThreads', id), {
          id,
          courseId,
          authorId: user.uid,
          authorName: (user.displayName || user.email || 'Usuario').slice(0, 100),
          title: title.trim().slice(0, 160),
          body: body.trim().slice(0, 3000),
          pinned: false,
          resolved: false,
          upvotesCount: 0,
          repliesCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        sendWs({ type: 'FORUM_POSTED', courseId, title });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `forumThreads/${id}`);
      }
    },
    [user, sendWs]
  );

  const addForumReply = useCallback(
    async (thread: ForumThread, body: string) => {
      if (!user) throw new Error('Authentication required');
      const replyId = `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const isInstructorAnswer = isAdmin;
      const batch = writeBatch(db);
      batch.set(doc(db, 'forumThreads', thread.id, 'replies', replyId), {
        id: replyId,
        threadId: thread.id,
        courseId: thread.courseId,
        authorId: user.uid,
        authorName: (user.displayName || user.email || 'Usuario').slice(0, 100),
        body: body.trim().slice(0, 2000),
        isInstructorAnswer,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'forumThreads', thread.id), {
        id: thread.id,
        courseId: thread.courseId,
        authorId: thread.authorId,
        authorName: thread.authorName,
        title: thread.title,
        body: thread.body,
        pinned: thread.pinned ?? false,
        resolved: thread.resolved ?? false,
        upvotesCount: thread.upvotesCount ?? 0,
        repliesCount: (thread.repliesCount || 0) + 1,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      try {
        await batch.commit();
        sendWs({ type: 'FORUM_POSTED', courseId: thread.courseId, title: thread.title });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `forumThreads/${thread.id}/replies`);
      }
    },
    [user, courses, isAdmin, sendWs]
  );

  const upvoteForumThread = useCallback(
    async (thread: ForumThread) => {
      if (!user) throw new Error('Authentication required');
      try {
        await setDoc(doc(db, 'forumThreads', thread.id), {
          id: thread.id,
          courseId: thread.courseId,
          authorId: thread.authorId,
          authorName: thread.authorName,
          title: thread.title,
          body: thread.body,
          pinned: thread.pinned ?? false,
          resolved: thread.resolved ?? false,
          upvotesCount: (thread.upvotesCount || 0) + 1,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `forumThreads/${thread.id}`);
      }
    },
    [user]
  );

  const toggleForumThreadState = useCallback(
    async (thread: ForumThread, field: 'pinned' | 'resolved') => {
      if (!user) throw new Error('Authentication required');
      if (field === 'pinned') {
        await assertPlatformAdminWrite('fijar debates en el foro', user);
      } else if (!isAdmin && thread.authorId !== user.uid) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) o el autor puede cambiar el estado del debate.'
        );
      }
      try {
        await updateDoc(doc(db, 'forumThreads', thread.id), {
          [field]: !thread[field],
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `forumThreads/${thread.id}`);
      }
    },
    [user, isAdmin]
  );

  const createCalendarEvent = useCallback(
    async (ev: Omit<CalendarEvent, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Authentication required');
      const id = `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'calendarEvents', id), {
          ...ev,
          id,
          ownerId: user.uid,
          title: ev.title.trim().slice(0, 160),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `calendarEvents/${id}`);
      }
    },
    [user]
  );

  const toggleCalendarEventComplete = useCallback(
    async (ev: CalendarEvent) => {
      if (!user) throw new Error('Authentication required');
      if (!isAdmin && ev.ownerId !== user.uid) {
        throw new Error('Permiso denegado: no puedes modificar tareas de otro usuario.');
      }
      try {
        await updateDoc(doc(db, 'calendarEvents', ev.id), {
          completed: !ev.completed,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `calendarEvents/${ev.id}`);
      }
    },
    [user, isAdmin]
  );

  const deleteCalendarEvent = useCallback(
    async (eventId: string) => {
      if (!user) throw new Error('Authentication required');
      const target = calendarEvents.find((ev) => ev.id === eventId);
      if (target && !isAdmin && target.ownerId !== user.uid) {
        throw new Error('Permiso denegado: no puedes eliminar eventos de otro usuario.');
      }
      try {
        await deleteDoc(doc(db, 'calendarEvents', eventId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `calendarEvents/${eventId}`);
      }
    },
    [user, isAdmin, calendarEvents]
  );

  const updateNotificationPrefs = useCallback(
    async (patch: Partial<UserPrivateInfo>) => {
      if (!user) throw new Error('Authentication required');
      try {
        await updateDoc(doc(db, 'users', user.uid, 'private', 'info'), {
          ...patch,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/private/info`);
      }
    },
    [user]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const saveEncryptedNote = useCallback(
    async (titleHint: string, plaintext: string, courseId?: string) => {
      if (!user) throw new Error('Authentication required');
      const encrypted = await encryptTextE2EE(plaintext);
      const id = `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'encryptedNotes', id), {
          id,
          ownerId: user.uid,
          courseId: courseId || '',
          titleHint: titleHint.trim().slice(0, 120),
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          algorithm: encrypted.algorithm,
          keyFingerprint: encrypted.keyFingerprint,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `encryptedNotes/${id}`);
      }
    },
    [user]
  );

  const deleteEncryptedNote = useCallback(
    async (noteId: string) => {
      if (!user) throw new Error('Authentication required');
      const target = encryptedNotes.find((n) => n.id === noteId);
      if (target && !isAdmin && target.ownerId !== user.uid) {
        throw new Error('Permiso denegado: no puedes eliminar notas de otro usuario.');
      }
      try {
        await deleteDoc(doc(db, 'encryptedNotes', noteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `encryptedNotes/${noteId}`);
      }
    },
    [user, isAdmin, encryptedNotes]
  );

  const syncCloudBackup = useCallback(
    async (provider: CloudProvider, folder: string, autoBackup: boolean) => {
      if (!user) throw new Error('Authentication required');
      const bundle = JSON.stringify({
        exportedAt: new Date().toISOString(),
        uid: user.uid,
        enrollmentsCount: enrollments.length,
        certificatesCount: certificates.length,
        notesCount: encryptedNotes.length,
        calendarEvents,
      });
      const encryptedEnvelope = await encryptTextE2EE(bundle);
      const res = await fetch('/api/v1/cloud-storage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.uid,
          provider,
          folder,
          encryptedEnvelope,
        }),
      });
      if (!res.ok) throw new Error('Cloud sync failed');
      const result = (await res.json()) as { checksumSha256: string; syncedAt: string; bytes: number };
      await updateNotificationPrefs({
        cloudProvider: provider,
        cloudFolder: folder,
        cloudAutoBackup: autoBackup,
        cloudLastSyncedAt: result.syncedAt,
      });
      triggerPushAlert('sync', 'Respaldo en la nube completado', `${provider} · ${folder}`);
      return result;
    },
    [user, enrollments, certificates, encryptedNotes, calendarEvents, updateNotificationPrefs, triggerPushAlert]
  );

  const createApiKey = useCallback(
    async (label: string, webhookUrl?: string) => {
      if (!user) throw new Error('Authentication required');
      const rawKey = `cat_live_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyHash = await sha256Hex(rawKey);
      const id = `key_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const keyRecord: ApiIntegrationKey = {
        id,
        ownerId: user.uid,
        label: label.trim().slice(0, 80),
        keyPrefix: rawKey.slice(0, 14),
        keyHash,
        webhookUrl: webhookUrl?.trim().slice(0, 300) || '',
        active: true,
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'apiKeys', id), keyRecord);
        await fetch('/api/v1/webhooks/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            ownerId: user.uid,
            keyHash,
            label: keyRecord.label,
            webhookUrl: keyRecord.webhookUrl,
          }),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `apiKeys/${id}`);
      }
      return { rawKey, keyRecord };
    },
    [user]
  );

  const toggleApiKey = useCallback(
    async (keyRecord: ApiIntegrationKey) => {
      if (!user) throw new Error('Authentication required');
      if (!isAdmin && keyRecord.ownerId !== user.uid) {
        throw new Error('Permiso denegado: no puedes modificar claves de otro usuario.');
      }
      try {
        await updateDoc(doc(db, 'apiKeys', keyRecord.id), { active: !keyRecord.active });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `apiKeys/${keyRecord.id}`);
      }
    },
    [user, isAdmin]
  );

  const deleteApiKey = useCallback(
    async (keyId: string) => {
      if (!user) throw new Error('Authentication required');
      const target = apiKeys.find((k) => k.id === keyId);
      if (target && !isAdmin && target.ownerId !== user.uid) {
        throw new Error('Permiso denegado: no puedes eliminar claves API de otro usuario.');
      }
      try {
        await deleteDoc(doc(db, 'apiKeys', keyId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `apiKeys/${keyId}`);
      }
    },
    [user, isAdmin, apiKeys]
  );

  const submitAssignment = useCallback(
    async (courseId: string, lessonId: string, file: File, comment?: string): Promise<AssignmentSubmission> => {
      if (!user) throw new Error('Authentication required');
      const course = courses.find((c) => c.id === courseId);
      const lesson = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);

      const { url, name, size } = await uploadAssignmentSubmissionFile(courseId, lessonId, user.uid, file);

      if (url.length > 950000) {
        throw new Error('El archivo es demasiado grande para guardarse sin Storage. Usa un archivo menor a 700 KB.');
      }

      const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const trimmedComment = comment?.trim().slice(0, 2000);
      const submission: AssignmentSubmission = {
        id,
        courseId,
        courseTitle: (course?.title ?? courseId).slice(0, 140),
        lessonId,
        lessonTitle: (lesson?.title ?? lessonId).slice(0, 200),
        studentId: user.uid,
        studentName: (user.displayName || user.email || 'Estudiante').slice(0, 100),
        studentEmail: (user.email || '').slice(0, 200),
        fileUrl: url,
        fileName: name.slice(0, 260),
        fileSize: size,
        submittedAt: new Date().toISOString(),
        ...(trimmedComment ? { comment: trimmedComment } : {}),
        status: 'submitted',
        maxScore: Math.max(1, Math.min(1000, Math.round(lesson?.assignmentConfig?.maxScore ?? 100))),
      };

      try {
        await setDoc(doc(db, 'assignmentSubmissions', id), {
          ...submission,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        if (isFirestoreOfflineError(err)) {
          const updated = [...loadLocalSubmissions(), submission];
          saveLocalSubmissions(updated);
          setAssignmentSubmissions(updated);
        } else {
          handleFirestoreError(err, OperationType.CREATE, `assignmentSubmissions/${id}`);
        }
      }
      return submission;
    },
    [user, courses]
  );

  const gradeAssignment = useCallback(
    async (submissionId: string, grade: number, feedback: string, requestResubmit = false) => {
      if (!user) throw new Error('Authentication required');
      if (!isAdmin) throw new Error('Solo el administrador puede calificar entregas.');
      const patch = {
        grade,
        feedback: feedback.trim().slice(0, 2000),
        gradedAt: new Date().toISOString(),
        gradedBy: (user.email || user.uid).slice(0, 200),
        status: (requestResubmit ? 'resubmit_requested' : 'graded') as AssignmentSubmissionStatus,
        updatedAt: serverTimestamp(),
      };
      try {
        await updateDoc(doc(db, 'assignmentSubmissions', submissionId), patch);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `assignmentSubmissions/${submissionId}`);
      }
    },
    [user, isAdmin]
  );

  const deleteSubmission = useCallback(
    async (submissionId: string) => {
      if (!user) throw new Error('Authentication required');
      if (!isAdmin) throw new Error('Solo el administrador puede eliminar entregas.');
      try {
        await deleteDoc(doc(db, 'assignmentSubmissions', submissionId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `assignmentSubmissions/${submissionId}`);
      }
    },
    [user, isAdmin]
  );

  const normalizeGiftCardCode = (raw: string): string =>
    raw.trim().toUpperCase().replace(/\s+/g, '');

  const generateGiftCardCode = (): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += alphabet[bytes[i] % alphabet.length];
      p2 += alphabet[bytes[i + 4] % alphabet.length];
    }
    return `DBA-${p1}-${p2}`;
  };

  const createGiftCards = useCallback(
    async (input: {
      amountCents: number;
      currency: CurrencyCode;
      courseId?: string;
      courseTitle?: string;
      singleUse?: boolean;
      quantity?: number;
      customCode?: string;
      expiresAtIso?: string;
      note?: string;
    }): Promise<GiftCard[]> => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede generar Gift Cards.');
      }
      const verifiedAdmin = await assertPlatformAdminWrite('crear Gift Cards', user);

      const amountCents = Math.round(input.amountCents);
      if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 10000000) {
        throw new Error('El valor de la Gift Card debe ser entre $1.00 y $100,000.00.');
      }

      const quantity = Math.max(1, Math.min(20, Math.round(input.quantity ?? 1)));
      const singleUse = input.singleUse !== false;
      const customCode = input.customCode ? normalizeGiftCardCode(input.customCode) : '';

      if (customCode) {
        if (!/^[A-Z0-9_-]{6,64}$/.test(customCode)) {
          throw new Error('El código personalizado debe tener entre 6 y 64 caracteres (solo letras A-Z, números, "-" o "_").');
        }
        if (quantity > 1) {
          throw new Error('Para generar múltiples códigos en lote, deja el código personalizado vacío.');
        }
      }

      let expiresTimestamp: Timestamp | null = null;
      if (input.expiresAtIso && input.expiresAtIso.trim()) {
        const expDate = new Date(input.expiresAtIso);
        if (Number.isNaN(expDate.getTime()) || expDate.getTime() <= Date.now()) {
          throw new Error('La fecha de expiración debe ser válida y posterior al momento actual.');
        }
        expiresTimestamp = Timestamp.fromDate(expDate);
      }

      const codesToCreate: string[] = [];
      if (customCode) {
        const existingSnap = await getDoc(doc(db, 'giftCards', customCode));
        if (existingSnap.exists()) {
          throw new Error(`El código "${customCode}" ya existe. Elige otro código.`);
        }
        codesToCreate.push(customCode);
      } else {
        const seen = new Set<string>();
        while (codesToCreate.length < quantity) {
          const candidate = generateGiftCardCode();
          if (seen.has(candidate)) continue;
          const existingSnap = await getDoc(doc(db, 'giftCards', candidate));
          if (!existingSnap.exists()) {
            seen.add(candidate);
            codesToCreate.push(candidate);
          }
        }
      }

      const batch = writeBatch(db);
      const createdList: GiftCard[] = [];
      const cleanCourseId = input.courseId?.trim() || '';
      const cleanCourseTitle = input.courseTitle?.trim().slice(0, 140) || '';
      const cleanNote = input.note?.trim().slice(0, 200) || '';

      for (const code of codesToCreate) {
        const payload: Record<string, unknown> = {
          id: code,
          code,
          initialAmountCents: amountCents,
          remainingAmountCents: amountCents,
          currency: input.currency,
          courseId: cleanCourseId,
          ...(cleanCourseTitle ? { courseTitle: cleanCourseTitle } : {}),
          singleUse,
          status: 'active',
          active: true,
          redemptionCount: 0,
          ...(expiresTimestamp ? { expiresAt: expiresTimestamp } : {}),
          ...(cleanNote ? { note: cleanNote } : {}),
          createdBy: verifiedAdmin.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(doc(db, 'giftCards', code), payload);
        createdList.push({
          id: code,
          code,
          initialAmountCents: amountCents,
          remainingAmountCents: amountCents,
          currency: input.currency,
          courseId: cleanCourseId,
          courseTitle: cleanCourseTitle || undefined,
          singleUse,
          status: 'active',
          active: true,
          redemptionCount: 0,
          expiresAt: expiresTimestamp ?? undefined,
          note: cleanNote || undefined,
          createdBy: verifiedAdmin.uid,
        });
      }

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'giftCards');
      }

      return createdList;
    },
    [user, isAdmin]
  );

  const toggleGiftCardActive = useCallback(
    async (card: GiftCard) => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede modificar Gift Cards.');
      }
      await assertPlatformAdminWrite('actualizar Gift Card', user);
      if (card.remainingAmountCents <= 0) {
        throw new Error('Esta Gift Card ya fue canjeada por completo y no puede reactivarse.');
      }
      const nextActive = !card.active;
      try {
        await updateDoc(doc(db, 'giftCards', card.code), {
          active: nextActive,
          status: nextActive ? 'active' : 'disabled',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `giftCards/${card.code}`);
      }
    },
    [user, isAdmin]
  );

  const deleteGiftCard = useCallback(
    async (cardCode: string) => {
      if (!user || !isAdmin) {
        throw new Error('Solo el administrador autorizado puede eliminar Gift Cards.');
      }
      await assertPlatformAdminWrite('eliminar Gift Card', user);
      try {
        await deleteDoc(doc(db, 'giftCards', cardCode));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `giftCards/${cardCode}`);
      }
    },
    [user, isAdmin]
  );

  const evaluateGiftCardData = useCallback(
    (card: GiftCard | null, course?: Course | null): GiftCardValidationResult => {
      const baseInvalid = (
        reason: string,
        errorCode: GiftCardValidationErrorCode
      ): GiftCardValidationResult => ({
        valid: false,
        coveredCents: 0,
        remainingToPayCents: course ? course.priceCents : 0,
        remainingCardBalanceAfterCents: 0,
        coversFullCourse: false,
        reason,
        errorCode,
      });

      if (!card) {
        return baseInvalid(
          'Este código no existe en el sistema. Verifica que esté escrito correctamente.',
          'not_found'
        );
      }

      if (card.status === 'redeemed' || card.remainingAmountCents <= 0) {
        return baseInvalid(
          'Esta Gift Card ya fue utilizada y no tiene saldo disponible.',
          'used'
        );
      }
      if (!card.active || card.status === 'disabled') {
        return baseInvalid(
          'Esta Gift Card fue desactivada por el administrador.',
          'disabled'
        );
      }

      const expiresMs = toEpochMs(card.expiresAt);
      if (expiresMs !== null && Date.now() > expiresMs) {
        return baseInvalid(
          'Esta Gift Card ha expirado y ya no puede canjearse.',
          'expired'
        );
      }

      if (course) {
        if (card.courseId && card.courseId !== course.id) {
          return baseInvalid(
            `Esta Gift Card es exclusiva para el curso "${card.courseTitle || card.courseId}".`,
            'course_mismatch'
          );
        }
        if (card.currency !== course.currency) {
          return baseInvalid(
            `Esta Gift Card está emitida en ${card.currency}, pero el curso está en ${course.currency}.`,
            'currency_mismatch'
          );
        }
        if (enrollments.some((e) => e.courseId === course.id)) {
          return baseInvalid('Ya estás inscrito en este curso.', 'already_enrolled');
        }
        if (course.priceCents <= 0) {
          return baseInvalid(
            'Este curso es gratuito; puedes inscribirte directamente sin gastar tu Gift Card.',
            'free_course'
          );
        }

        const coveredCents = Math.min(card.remainingAmountCents, course.priceCents);
        const remainingToPayCents = Math.max(0, course.priceCents - coveredCents);
        const remainingCardBalanceAfterCents = card.singleUse
          ? 0
          : Math.max(0, card.remainingAmountCents - coveredCents);

        return {
          valid: true,
          card,
          coveredCents,
          remainingToPayCents,
          remainingCardBalanceAfterCents,
          coversFullCourse: remainingToPayCents === 0,
        };
      }

      return {
        valid: true,
        card,
        coveredCents: card.remainingAmountCents,
        remainingToPayCents: 0,
        remainingCardBalanceAfterCents: 0,
        coversFullCourse: true,
      };
    },
    [enrollments]
  );

  const validateGiftCard = useCallback(
    async (rawCode: string, course?: Course | null): Promise<GiftCardValidationResult> => {
      const baseInvalid = (
        reason: string,
        errorCode: GiftCardValidationErrorCode
      ): GiftCardValidationResult => ({
        valid: false,
        coveredCents: 0,
        remainingToPayCents: course ? course.priceCents : 0,
        remainingCardBalanceAfterCents: 0,
        coversFullCourse: false,
        reason,
        errorCode,
      });

      if (!user) {
        return baseInvalid(
          'Inicia sesión con Google para validar y canjear una Gift Card.',
          'auth_required'
        );
      }

      const code = normalizeGiftCardCode(rawCode);
      if (!/^[A-Z0-9_-]{6,64}$/.test(code)) {
        return baseInvalid(
          'El código debe tener al menos 6 caracteres (letras y números, ej: DBA-XXXX-XXXX).',
          'invalid_format'
        );
      }

      let snap;
      try {
        snap = await getDoc(doc(db, 'giftCards', code));
      } catch (err) {
        if (isFirestoreOfflineError(err)) {
          return baseInvalid(
            'Sin conexión con el servidor para verificar el código.',
            'network'
          );
        }
        const fbCode = (err as { code?: string })?.code;
        if (fbCode === 'permission-denied') {
          handleFirestoreError(err, OperationType.GET, `giftCards/${code}`);
        }
        return baseInvalid('No se pudo verificar el código de Gift Card.', 'network');
      }

      return evaluateGiftCardData(snap.exists() ? (snap.data() as GiftCard) : null, course);
    },
    [user, evaluateGiftCardData]
  );

  const subscribeToGiftCard = useCallback(
    (
      rawCode: string,
      course: Course | null | undefined,
      onUpdate: (result: GiftCardValidationResult) => void
    ): (() => void) => {
      const baseInvalid = (
        reason: string,
        errorCode: GiftCardValidationErrorCode
      ): GiftCardValidationResult => ({
        valid: false,
        coveredCents: 0,
        remainingToPayCents: course ? course.priceCents : 0,
        remainingCardBalanceAfterCents: 0,
        coversFullCourse: false,
        reason,
        errorCode,
      });

      if (!user) {
        onUpdate(
          baseInvalid(
            'Inicia sesión con Google para validar y canjear una Gift Card.',
            'auth_required'
          )
        );
        return () => {};
      }

      const code = normalizeGiftCardCode(rawCode);
      if (!/^[A-Z0-9_-]{6,64}$/.test(code)) {
        onUpdate(
          baseInvalid(
            'El código debe tener al menos 6 caracteres (letras y números, ej: DBA-XXXX-XXXX).',
            'invalid_format'
          )
        );
        return () => {};
      }

      const unsub = onSnapshot(
        doc(db, 'giftCards', code),
        (snap) => {
          onUpdate(evaluateGiftCardData(snap.exists() ? (snap.data() as GiftCard) : null, course));
        },
        (err) => {
          if (isFirestoreOfflineError(err)) {
            onUpdate(
              baseInvalid('Sin conexión con el servidor para verificar el código.', 'network')
            );
            return;
          }
          onUpdate(baseInvalid('No se pudo verificar el código de Gift Card.', 'network'));
        }
      );

      return unsub;
    },
    [user, evaluateGiftCardData]
  );

  const redeemGiftCardForCourse = useCallback(
    async (
      rawCode: string,
      course: Course,
      partialGateway: PaymentGateway = 'lemonsqueezy',
      options?: { externalPaymentId?: string; externalTransactionRef?: string }
    ): Promise<{ payment: PaymentRecord; redemption: GiftCardRedemption }> => {
      if (!user) throw new Error('Inicia sesión para canjear una Gift Card.');
      if (!user.emailVerified) {
        throw new Error('Tu cuenta requiere correo verificado (o acceso con Google) para canjear Gift Cards.');
      }

      // Validar prerrequisitos estrictos igual que en checkout normal
      if (course.prerequisites && course.prerequisites.length > 0 && !isAdmin) {
        const unmet = course.prerequisites.filter((prereqId) => {
          const enr = enrollments.find((e) => e.courseId === prereqId);
          const hasCert = certificates.some((c) => c.courseId === prereqId);
          return !((enr && enr.progressPercent >= 100) || hasCert);
        });
        if (unmet.length > 0) {
          const prereqCourse = courses.find((c) => c.id === unmet[0]);
          throw new Error(
            `Prerrequisito obligatorio no completado: Debes completar y aprobar primero "${prereqCourse?.title || unmet[0]}".`
          );
        }
      }

      const code = normalizeGiftCardCode(rawCode);
      if (!/^[A-Z0-9_-]{6,64}$/.test(code)) {
        throw new Error('Formato de código inválido.');
      }

      // Asegurar que el documento del curso exista en Firestore antes de la transacción
      const courseRef = doc(db, 'courses', course.id);
      const courseSnap = await getDoc(courseRef);
      let resolvedInstructorId =
        course.instructorId === 'platform-faculty' ? user.uid : course.instructorId;
      let authoritativePriceCents = course.priceCents;
      let authoritativeCurrency = course.currency;

      if (!courseSnap.exists()) {
        if (isAdmin && user.emailVerified) {
          await assertPlatformAdminWrite('registrar curso en canje', user);
          await setDoc(courseRef, {
            ...course,
            instructorId: resolvedInstructorId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          throw new Error(
            'El curso aún no está sincronizado en Firestore. Solicita al administrador que inicie sesión para publicarlo.'
          );
        }
      } else {
        const cData = courseSnap.data() as Course;
        resolvedInstructorId = String(cData.instructorId || resolvedInstructorId);
        authoritativePriceCents = Math.max(0, Math.round(Number(cData.priceCents ?? course.priceCents)));
        authoritativeCurrency =
          cData.currency === 'DOP' || cData.currency === 'USD' || cData.currency === 'EUR' || cData.currency === 'MXN'
            ? cData.currency
            : 'DOP';
      }

      if (authoritativePriceCents <= 0) {
        throw new Error('Este curso es gratuito; inscríbete directamente sin gastar tu Gift Card.');
      }

      const giftCardRef = doc(db, 'giftCards', code);
      const enrollmentId = `${course.id}_${user.uid}`;
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);

      let txResult: { payment: PaymentRecord; redemption: GiftCardRedemption };
      try {
        txResult = await runTransaction(db, async (tx) => {
        const [cardSnap, enrSnap] = await Promise.all([tx.get(giftCardRef), tx.get(enrollmentRef)]);

        if (enrSnap.exists()) {
          throw new Error('Ya estás inscrito en este curso.');
        }
        if (!cardSnap.exists()) {
          throw new Error('Código de Gift Card no encontrado.');
        }

        const card = cardSnap.data() as GiftCard;
        if (!card.active || card.status !== 'active') {
          throw new Error('Esta Gift Card está desactivada o ya no está disponible.');
        }
        if (card.remainingAmountCents <= 0) {
          throw new Error('Esta Gift Card ya no tiene saldo disponible.');
        }
        const expMs = toEpochMs(card.expiresAt);
        if (expMs !== null && Date.now() > expMs) {
          throw new Error('Esta Gift Card ha expirado.');
        }
        if (card.courseId && card.courseId !== course.id) {
          throw new Error(`Esta Gift Card solo aplica al curso "${card.courseTitle || card.courseId}".`);
        }
        if (card.currency !== authoritativeCurrency) {
          throw new Error(`Moneda incompatible: Gift Card en ${card.currency} vs curso en ${authoritativeCurrency}.`);
        }

        const appliedCents = Math.min(card.remainingAmountCents, authoritativePriceCents);
        const remainingPaidCents = Math.max(0, authoritativePriceCents - appliedCents);
        const nextRemainingCents = card.singleUse
          ? 0
          : Math.max(0, card.remainingAmountCents - appliedCents);
        const nextStatus = nextRemainingCents === 0 ? 'redeemed' : 'active';
        const nextRedemptionNumber = (card.redemptionCount || 0) + 1;

        const redemptionId = `${code}_${nextRedemptionNumber}`;
        const paymentId =
          options?.externalPaymentId && /^[a-zA-Z0-9_-]{4,128}$/.test(options.externalPaymentId)
            ? options.externalPaymentId
            : `pay_gc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const transactionRef =
          options?.externalTransactionRef && options.externalTransactionRef.length >= 4
            ? options.externalTransactionRef.slice(0, 100)
            : `gift_${code.slice(0, 14)}_${nextRedemptionNumber}`;

        const studentName = (user.displayName || user.email || 'Estudiante').slice(0, 100);
        const studentEmail = (user.email || '').slice(0, 200);
        const gateway: PaymentGateway = remainingPaidCents === 0 ? 'gift_card' : partialGateway;

        const paymentPayload: PaymentRecord = {
          id: paymentId,
          courseId: course.id,
          courseTitle: course.title.slice(0, 140),
          studentId: user.uid,
          instructorId: resolvedInstructorId,
          amountCents: remainingPaidCents,
          originalAmountCents: authoritativePriceCents,
          discountCents: appliedCents,
          couponCode: code,
          discountSource: 'gift_card',
          currency: authoritativeCurrency,
          gateway,
          status: 'succeeded',
          transactionRef,
          createdAt: serverTimestamp(),
        };

        const redemptionPayload: GiftCardRedemption = {
          id: redemptionId,
          cardCode: code,
          redemptionNumber: nextRedemptionNumber,
          studentId: user.uid,
          studentName,
          ...(studentEmail ? { studentEmail } : {}),
          courseId: course.id,
          courseTitle: course.title.slice(0, 140),
          amountAppliedCents: appliedCents,
          coursePriceCents: authoritativePriceCents,
          remainingPaidCents,
          currency: authoritativeCurrency,
          paymentId,
          redeemedAt: serverTimestamp(),
        };

        tx.update(giftCardRef, {
          remainingAmountCents: nextRemainingCents,
          status: nextStatus,
          redeemedBy: user.uid,
          redeemedAt: serverTimestamp(),
          redemptionCount: nextRedemptionNumber,
          updatedAt: serverTimestamp(),
        });

        tx.set(doc(db, 'giftCardRedemptions', redemptionId), redemptionPayload);
        tx.set(doc(db, 'payments', paymentId), paymentPayload);
        tx.set(enrollmentRef, {
          id: enrollmentId,
          courseId: course.id,
          courseTitle: course.title.slice(0, 140),
          studentId: user.uid,
          studentName,
          instructorId: resolvedInstructorId,
          completedModuleIds: [],
          completedLessonIds: [],
          progressPercent: 0,
          studyMinutes: 0,
          status: 'active',
          enrolledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { payment: paymentPayload, redemption: redemptionPayload };
      });
      } catch (err) {
        const fbCode = (err as { code?: string })?.code;
        if (fbCode === 'permission-denied') {
          handleFirestoreError(err, OperationType.WRITE, `giftCards/${code}`);
        }
        throw err;
      }

      // Best-effort calendar deadline event
      try {
        const deadlineId = `cal_${course.id}_${Date.now().toString(36)}`;
        await setDoc(doc(db, 'calendarEvents', deadlineId), {
          id: deadlineId,
          ownerId: user.uid,
          courseId: course.id,
          courseTitle: course.title.slice(0, 140),
          title: `Completar Módulo 1: ${course.title.slice(0, 80)}`,
          type: 'deadline',
          dueAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed: false,
          priority: 'medium',
          reminderMinutes: privateInfo?.deadlineLeadMinutes ?? 60,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking calendar sync
      }

      sendWs({
        type: 'GIFT_CARD_REDEEMED',
        cardCode: code,
        courseId: course.id,
        courseTitle: course.title.slice(0, 140),
        instructorId: resolvedInstructorId,
        amountAppliedCents: txResult.redemption.amountAppliedCents,
        currency: authoritativeCurrency,
      });

      triggerPushAlert(
        'payment',
        'Gift Card canjeada con éxito',
        `${course.title} · Código ${code}`
      );

      return txResult;
    },
    [user, isAdmin, enrollments, certificates, courses, privateInfo, sendWs, triggerPushAlert]
  );

  const redeemGiftCardCode = useCallback(
    async (
      rawCode: string,
      targetCourse?: Course | null
    ): Promise<{
      success: boolean;
      course: Course;
      payment: PaymentRecord;
      redemption: GiftCardRedemption;
    }> => {
      const validation = await validateGiftCard(rawCode, targetCourse || null);
      if (!validation.valid || !validation.card) {
        throw new Error(validation.reason || 'Código de Gift Card inválido.');
      }

      const card = validation.card;
      let resolvedCourse = targetCourse || null;

      if (!resolvedCourse) {
        if (!card.courseId) {
          throw new Error(
            'Esta Gift Card aplica a cualquier curso del catálogo; selecciona el curso al que deseas inscribirte.'
          );
        }
        resolvedCourse = courses.find((c) => c.id === card.courseId) || null;
        if (!resolvedCourse) {
          try {
            const snap = await getDoc(doc(db, 'courses', card.courseId));
            if (snap.exists()) {
              resolvedCourse = snap.data() as Course;
            }
          } catch (err) {
            if (!isFirestoreOfflineError(err)) {
              handleFirestoreError(err, OperationType.GET, `courses/${card.courseId}`);
            }
          }
        }
        if (!resolvedCourse) {
          throw new Error(
            `No se encontró el curso asociado a esta Gift Card (${card.courseTitle || card.courseId}).`
          );
        }
      }

      if (card.remainingAmountCents < resolvedCourse.priceCents) {
        throw new Error(
          `El saldo de la Gift Card (${(card.remainingAmountCents / 100).toFixed(2)} ${card.currency}) no cubre el total del curso (${(resolvedCourse.priceCents / 100).toFixed(2)} ${resolvedCourse.currency}). Aplica el código desde la ventana de pago para cubrir la diferencia.`
        );
      }

      const result = await redeemGiftCardForCourse(card.code, resolvedCourse);
      return {
        success: true,
        course: resolvedCourse,
        payment: result.payment,
        redemption: result.redemption,
      };
    },
    [validateGiftCard, courses, redeemGiftCardForCourse]
  );

  const getLemonSqueezyStatus = useCallback(async (): Promise<LemonSqueezyStatus> => {
    const resp = await fetch('/api/v1/payments/lemonsqueezy/status');
    if (!resp.ok) {
      throw new Error('No se pudo consultar el estado de Lemon Squeezy.');
    }
    return (await resp.json()) as LemonSqueezyStatus;
  }, []);

  const createLemonSqueezyCheckout = useCallback(
    async (
      course: Course,
      options?: { couponCode?: string; giftCardCode?: string }
    ): Promise<LemonSqueezyCheckoutSession> => {
      if (!user) throw new Error('Inicia sesión para continuar con Lemon Squeezy.');

      if (course.prerequisites && course.prerequisites.length > 0 && !isAdmin) {
        const unmet = course.prerequisites.filter((prereqId) => {
          const enr = enrollments.find((e) => e.courseId === prereqId);
          const hasCert = certificates.some((c) => c.courseId === prereqId);
          return !((enr && enr.progressPercent >= 100) || hasCert);
        });
        if (unmet.length > 0) {
          const prereqCourse = courses.find((c) => c.id === unmet[0]);
          throw new Error(
            `Prerrequisito obligatorio no completado: Debes completar primero "${prereqCourse?.title || unmet[0]}".`
          );
        }
      }

      const courseRef = doc(db, 'courses', course.id);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) {
        if (isAdmin && user.emailVerified) {
          await assertPlatformAdminWrite('registrar curso antes de Lemon Squeezy checkout', user);
          await setDoc(courseRef, {
            ...course,
            instructorId: course.instructorId === 'platform-faculty' ? user.uid : course.instructorId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          throw new Error(
            'El curso aún no está publicado en Firestore. Solicita al administrador que sincronice el catálogo.'
          );
        }
      }

      const idToken = await user.getIdToken();
      const resp = await fetch('/api/v1/payments/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: options?.couponCode,
          giftCardCode: options?.giftCardCode,
          customerName: user.displayName || undefined,
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as LemonSqueezyCheckoutSession & { error?: string };
      if (!resp.ok) {
        throw new Error(json.error || 'No se pudo iniciar la pasarela Lemon Squeezy.');
      }
      return json;
    },
    [user, isAdmin, enrollments, certificates, courses]
  );

  const verifyAndCompleteLemonSqueezyCheckout = useCallback(
    async (
      paymentId: string,
      courseId: string,
      orderId?: string
    ): Promise<{
      verified: boolean;
      status: 'paid' | 'pending' | 'refunded';
      payment?: PaymentRecord;
      message?: string;
    }> => {
      if (!user) {
        throw new Error('Inicia sesión para verificar tu pago de Lemon Squeezy.');
      }

      const idToken = await user.getIdToken();
      const url = new URL('/api/v1/payments/lemonsqueezy/verify', window.location.origin);
      url.searchParams.set('paymentId', paymentId);
      url.searchParams.set('courseId', courseId);
      if (orderId) url.searchParams.set('orderId', orderId);

      const resp = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const verification = (await resp.json().catch(() => ({}))) as LemonSqueezyVerificationResult & {
        error?: string;
      };
      if (!resp.ok) {
        throw new Error(verification.error || 'No se pudo verificar la orden en Lemon Squeezy.');
      }

      if (!verification.verified || verification.status !== 'paid') {
        return {
          verified: false,
          status: verification.status || 'pending',
          message: verification.message,
        };
      }

      const targetCourseId = verification.courseId || courseId;
      let targetCourse = coursesRef.current.find((c) => c.id === targetCourseId) || null;
      if (!targetCourse) {
        const snap = await getDoc(doc(db, 'courses', targetCourseId));
        if (snap.exists()) {
          targetCourse = snap.data() as Course;
        }
      }
      if (!targetCourse) {
        throw new Error('Curso asociado al pago no encontrado.');
      }

      const existingEnr = enrollments.find((e) => e.courseId === targetCourseId);
      const existingPay = payments.find((p) => p.id === paymentId || p.courseId === targetCourseId);
      if (existingEnr && existingPay) {
        return { verified: true, status: 'paid', payment: existingPay };
      }

      let recordedPayment: PaymentRecord;
      if (verification.giftCardCode) {
        const res = await redeemGiftCardForCourse(
          verification.giftCardCode,
          targetCourse,
          'lemonsqueezy',
          {
            externalPaymentId: verification.paymentId,
            externalTransactionRef: verification.transactionRef,
          }
        );
        recordedPayment = res.payment;
      } else {
        recordedPayment = await enrollWithPayment(targetCourse, 'lemonsqueezy', {
          couponCode: verification.couponCode,
          externalPaymentId: verification.paymentId,
          externalTransactionRef: verification.transactionRef,
        });
      }

      try {
        sessionStorage.removeItem('dba_pending_ls_checkout');
      } catch {
        // Ignore sessionStorage errors
      }

      return {
        verified: true,
        status: 'paid',
        payment: recordedPayment,
      };
    },
    [user, enrollments, payments, enrollWithPayment, redeemGiftCardForCourse]
  );

  useEffect(() => {
    if (!authReady || !user || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('ls_checkout') !== 'success') return;

    const courseId = (params.get('course_id') || '').trim();
    let paymentId = (params.get('payment_id') || '').trim();
    const orderId = (params.get('order_id') || '').trim() || undefined;

    if (!paymentId) {
      try {
        const stored = sessionStorage.getItem('dba_pending_ls_checkout');
        if (stored) {
          const parsed = JSON.parse(stored) as { paymentId?: string; courseId?: string };
          if (parsed.paymentId && (!courseId || parsed.courseId === courseId)) {
            paymentId = parsed.paymentId;
          }
        }
      } catch {
        // Ignore storage error
      }
    }

    if (!courseId || !paymentId) return;
    const dedupeKey = `${paymentId}:${courseId}`;
    if (handledLemonReturnRef.current === dedupeKey) return;
    handledLemonReturnRef.current = dedupeKey;

    setLemonSqueezyBanner({
      status: 'verifying',
      message: 'Verificando tu pago con Lemon Squeezy...',
    });

    void (async () => {
      try {
        const res = await verifyAndCompleteLemonSqueezyCheckout(paymentId, courseId, orderId);
        window.history.replaceState({}, '', window.location.pathname);
        if (res.verified) {
          setSelectedCourseId(courseId);
          setActiveView('learning');
          setLemonSqueezyBanner({
            status: 'success',
            message: '¡Pago confirmado en Lemon Squeezy! Tu curso ya está desbloqueado.',
          });
        } else {
          setLemonSqueezyBanner({
            status: 'pending',
            message:
              res.message ||
              'Tu pago en Lemon Squeezy aún está en confirmación. Vuelve a intentar en unos segundos.',
          });
        }
      } catch (err) {
        setLemonSqueezyBanner({
          status: 'error',
          message: err instanceof Error ? err.message : 'No se pudo verificar el pago de Lemon Squeezy.',
        });
      }
    })();
  }, [authReady, user, verifyAndCompleteLemonSqueezyCheckout]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value: PlatformContextValue = {
    user,
    authReady,
    isAdmin,
    profile,
    privateInfo,
    theme,
    language,
    t,
    activeView,
    setActiveView,
    zenMode,
    setZenMode,
    toggleZenMode,
    selectedCourseId,
    setSelectedCourseId,
    workspaceRole,
    setWorkspaceRole,
    courses,
    customExercises,
    enrollments,
    instructorEnrollments,
    payments,
    instructorPayments,
    certificates,
    instructorCertificates,
    forumThreads,
    calendarEvents,
    encryptedNotes,
    apiKeys,
    notifications,
    unreadCount,
    connectedDevicesCount,
    wsConnected,
    e2eeFingerprint,
    authError,
    clearAuthError,
    toggleTheme,
    setLanguage,
    signInWithGoogle,
    signInWithEmail,
    signInAsAdmin,
    logout,
    enrollWithPayment,
    getLemonSqueezyStatus,
    createLemonSqueezyCheckout,
    verifyAndCompleteLemonSqueezyCheckout,
    lemonSqueezyBanner,
    clearLemonSqueezyBanner,
    completeLesson,
    courseSyncState,
    getCourseSyncSnapshot,
    initCourseSync,
    markCourseUnsaved,
    setCourseSyncError,
    resetCourseSync,
    createCourse,
    updateCourse,
    deleteCourse,
    createCustomExercise,
    deleteCustomExercise,
    createForumThread,
    addForumReply,
    upvoteForumThread,
    toggleForumThreadState,
    createCalendarEvent,
    toggleCalendarEventComplete,
    deleteCalendarEvent,
    updateNotificationPrefs,
    triggerPushAlert,
    markAllNotificationsRead,
    saveEncryptedNote,
    deleteEncryptedNote,
    syncCloudBackup,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
    refreshVaultFingerprint,
    assignmentSubmissions,
    submitAssignment,
    gradeAssignment,
    deleteSubmission,
    giftCards,
    giftCardRedemptions,
    createGiftCards,
    toggleGiftCardActive,
    deleteGiftCard,
    validateGiftCard,
    subscribeToGiftCard,
    redeemGiftCardForCourse,
    redeemGiftCardCode,
    coupons,
    createCoupon,
    toggleCouponActive,
    deleteCoupon,
    validateCoupon,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
