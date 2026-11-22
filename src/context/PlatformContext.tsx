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
  serverTimestamp,
  setDoc,
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
  CalendarEvent,
  Certificate,
  CloudProvider,
  Course,
  CustomExcelExercise,
  EncryptedNote,
  Enrollment,
  ForumThread,
  InAppNotification,
  Language,
  PaymentGateway,
  PaymentRecord,
  ThemeMode,
  UserPrivateInfo,
  UserProfile,
} from '../types';
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

function mergeSeedLessonsIntoCourse(course: Course): { course: Course; changed: boolean } {
  if (course.id !== EXCEL_BASICO_COURSE.id) {
    return { course, changed: false };
  }
  let changed = false;
  const existingModules = Array.isArray(course.modules) ? [...course.modules] : [];
  const nextModules = existingModules.map((mod) => {
    const seedMod = EXCEL_BASICO_COURSE.modules.find((sm) => sm.id === mod.id);
    if (!seedMod) return mod;
    const existingLessonIds = new Set((mod.lessons || []).map((l) => l.id));
    const missingLessons = seedMod.lessons.filter((sl) => !existingLessonIds.has(sl.id));
    if (missingLessons.length === 0) return mod;
    changed = true;
    const seedOrderMap = new Map(seedMod.lessons.map((sl, idx) => [sl.id, idx]));
    const mergedLessons = [...(mod.lessons || []), ...missingLessons].sort(
      (a, b) => (seedOrderMap.get(a.id) ?? 999) - (seedOrderMap.get(b.id) ?? 999)
    );
    return {
      ...mod,
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
  forumThreads: ForumThread[];
  calendarEvents: CalendarEvent[];
  encryptedNotes: EncryptedNote[];
  apiKeys: ApiIntegrationKey[];
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
    options?: { couponCode?: string; referralWelcome?: boolean; testMode?: boolean }
  ) => Promise<PaymentRecord>;
  completeLesson: (course: Course, lessonId: string, minutesSpent?: number) => Promise<{ progressPercent: number; certificateIssued?: Certificate }>;
  createCourse: (courseInput: Omit<Course, 'id' | 'instructorId' | 'instructorName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCourse: (courseId: string, patch: Partial<Course>) => Promise<void>;
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

  const [activeView, setActiveView] = useState<AppView>('landing');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<'student' | 'instructor'>('student');

  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const [customExercises, setCustomExercises] = useState<CustomExcelExercise[]>(() =>
    loadLocalCustomExercises()
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [instructorEnrollments, setInstructorEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [instructorPayments, setInstructorPayments] = useState<PaymentRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>(SEED_FORUM_THREADS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedNote[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiIntegrationKey[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState(1);
  const [wsConnected, setWsConnected] = useState(false);
  const [e2eeFingerprint, setE2eeFingerprint] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const clearAuthError = useCallback(() => setAuthError(null), []);

  const wsRef = useRef<WebSocket | null>(null);
  const notifiedDeadlineIdsRef = useRef<Set<string>>(new Set());

  const toggleZenMode = useCallback(() => {
    setZenMode((prev) => !prev);
  }, []);

  useEffect(() => {
    if (activeView !== 'learning' && zenMode) {
      setZenMode(false);
    }
  }, [activeView, zenMode]);

  const isAdmin = useMemo(
    () => Boolean(user?.emailVerified && isAdminEmail(user?.email)),
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
        const snap = await withRetry(() => getDoc(userRef));
        if (!snap.exists()) {
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
        }

        const privRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
        const privSnap = await withRetry(() => getDoc(privRef));
        if (!privSnap.exists()) {
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
        }

        const isCurrentAdmin = Boolean(
          firebaseUser.emailVerified && isAdminEmail(firebaseUser.email)
        );
        const alreadyCleaned = localStorage.getItem('db_academy_non_excel_cleaned_v1') === '1';

        if (isCurrentAdmin) {
          // Solo el administrador único puede sembrar, limpiar o actualizar cursos en Firestore
          const existingCourses = await withRetry(() => getDocs(collection(db, 'courses')));
          const existingIds = new Set(existingCourses.docs.map((d) => d.id));
          const missingCourses = SEED_COURSES.filter((c) => !existingIds.has(c.id));
          const coursesToDelete = existingCourses.docs.filter((d) => {
            if (SEED_COURSES.some((s) => s.id === d.id)) return false;
            return REMOVED_SEED_COURSE_IDS.includes(d.id) || !alreadyCleaned;
          });

          const existingExcelSnap = existingCourses.docs.find(
            (d) => d.id === EXCEL_BASICO_COURSE.id
          );
          const excelMergeResult = existingExcelSnap
            ? mergeSeedLessonsIntoCourse(existingExcelSnap.data() as Course)
            : null;
          const canUpdateExistingExcel = Boolean(existingExcelSnap && excelMergeResult?.changed);

          if (missingCourses.length > 0 || coursesToDelete.length > 0 || canUpdateExistingExcel) {
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
            if (canUpdateExistingExcel && excelMergeResult) {
              batch.update(doc(db, 'courses', EXCEL_BASICO_COURSE.id), {
                modulesCount: excelMergeResult.course.modulesCount,
                totalLessons: excelMergeResult.course.totalLessons,
                modules: excelMergeResult.course.modules,
                updatedAt: serverTimestamp(),
              });
            }
            await withRetry(() => batch.commit());
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
        // Cursos de Excel gratis por ahora: forzar priceCents = 0 sin importar Firestore
        const cursosGratis = merged.map((c) =>
          ['excel-basico-05', 'excel-intermedio-01', 'excel-avanzado-01'].includes(c.id)
            ? { ...c, priceCents: 0 }
            : c
        );
        setCourses(cursosGratis);
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

  const enrollWithPayment = useCallback(
    async (
      course: Course,
      gateway: PaymentGateway,
      options?: { couponCode?: string; referralWelcome?: boolean; testMode?: boolean }
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

      const couponCode = options?.couponCode?.trim().toUpperCase() || '';
      const referralWelcome = options?.referralWelcome === true;
      const testMode = options?.testMode === true;

      // Cursos gratis sin cupón/referido: inscripción directa
      let receipt: {
        paymentId: string;
        transactionRef: string;
        status: 'succeeded';
        amountCents?: number;
        originalAmountCents?: number;
        discountCents?: number;
        couponCode?: string;
        discountSource?: 'none' | 'coupon' | 'referral_welcome';
      };

      if (course.priceCents === 0 && !couponCode && !referralWelcome) {
        receipt = {
          paymentId: `free_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
          transactionRef: `gratis_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
          status: 'succeeded',
          amountCents: 0,
          originalAmountCents: 0,
          discountCents: 0,
        };
      } else {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/v1/payments/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            courseId: course.id,
            gateway,
            couponCode: couponCode || undefined,
            referralWelcome,
            testMode,
          }),
        });
        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || 'Payment authorization failed');
        }
        receipt = (await res.json()) as typeof receipt;
      }

      // Ensure the course document exists in Firestore before enrollment/payment rules check exists()
      const courseRef = doc(db, 'courses', course.id);
      const courseSnap = await getDoc(courseRef);
      let resolvedInstructorId =
        course.instructorId === 'platform-faculty' ? user.uid : course.instructorId;
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
        resolvedInstructorId = String(courseSnap.data()?.instructorId || resolvedInstructorId);
      }

      const enrollmentId = `${course.id}_${user.uid}`;
      const batch = writeBatch(db);
      const finalAmount = typeof receipt.amountCents === 'number' ? receipt.amountCents : course.priceCents;
      const paymentPayload: PaymentRecord = {
        id: receipt.paymentId,
        courseId: course.id,
        courseTitle: course.title.slice(0, 140),
        studentId: user.uid,
        instructorId: resolvedInstructorId,
        amountCents: finalAmount,
        originalAmountCents: typeof receipt.originalAmountCents === 'number' ? receipt.originalAmountCents : course.priceCents,
        discountCents: typeof receipt.discountCents === 'number' ? receipt.discountCents : 0,
        couponCode: receipt.couponCode,
        discountSource: receipt.discountSource,
        currency: course.currency,
        gateway: finalAmount === 0 ? 'free' : gateway,
        status: 'succeeded',
        transactionRef: receipt.transactionRef,
        createdAt: serverTimestamp(),
      };
      batch.set(doc(db, 'payments', receipt.paymentId), paymentPayload);
      batch.set(doc(db, 'enrollments', enrollmentId), {
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
      });
      // Also create a default deadline task synced with calendar
      const deadlineId = `cal_${course.id}_${Date.now().toString(36)}`;
      batch.set(doc(db, 'calendarEvents', deadlineId), {
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

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'payments+enrollments');
      }

      triggerPushAlert(
        'payment',
        t('paymentSuccess'),
        course.priceCents === 0
          ? `${course.title} (Inscripción gratuita)`
          : `${course.title} (${gateway.toUpperCase()} · ${receipt.transactionRef})`
      );
      return paymentPayload;
    },
    [user, isAdmin, privateInfo, triggerPushAlert, t]
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
      courseInput: Omit<Course, 'id' | 'instructorId' | 'instructorName' | 'createdAt' | 'updatedAt'>
    ) => {
      if (!user || !isAdmin) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede crear cursos.'
        );
      }
      const verifiedAdmin = await assertPlatformAdminWrite('crear cursos', user);
      const id = `crs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        await setDoc(doc(db, 'courses', id), {
          ...courseInput,
          id,
          instructorId: verifiedAdmin.uid,
          instructorName: (verifiedAdmin.displayName || verifiedAdmin.email || 'Profesor').slice(0, 100),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `courses/${id}`);
      }
    },
    [user, isAdmin]
  );

  const updateCourse = useCallback(
    async (courseId: string, patch: Partial<Course>) => {
      if (!user || !isAdmin) {
        throw new Error(
          'Solo el administrador autorizado (Marinodavidr7@gmail.com) puede editar cursos.'
        );
      }
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
      if (patch.currency === 'USD' || patch.currency === 'EUR' || patch.currency === 'MXN') {
        allowedPatch.currency = patch.currency;
      }
      if (typeof patch.coverImage === 'string') {
        allowedPatch.coverImage = patch.coverImage.slice(0, 500);
      }
      if (typeof patch.instructorName === 'string') {
        allowedPatch.instructorName = patch.instructorName.trim().slice(0, 100);
      }
      if (typeof patch.published === 'boolean') allowedPatch.published = patch.published;

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

      try {
        const snap = await getDoc(courseRef);
        if (snap.exists()) {
          await updateDoc(courseRef, {
            ...allowedPatch,
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingLocal = courses.find((c) => c.id === courseId);
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
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
      }
    },
    [user, isAdmin, courses]
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
    completeLesson,
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
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
