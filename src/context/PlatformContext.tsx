import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
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
import { SEED_COURSES } from '../data/seedCourses';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { translations, type TranslationKeys } from '../i18n/translations';
import type {
  ApiIntegrationKey,
  AppView,
  CalendarEvent,
  Certificate,
  CloudProvider,
  Course,
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

const ADMIN_EMAIL = 'marinodavidr7@gmail.com';

export type PlatformUser =
  | User
  | {
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
      emailVerified: boolean;
      isAnonymous: boolean;
    };

export const ADMIN_USER: PlatformUser = {
  uid: 'admin_david_marinodavidr7',
  email: ADMIN_EMAIL,
  displayName: 'David (Administrador)',
  emailVerified: true,
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  isAnonymous: false,
};

const getDeletedCourseIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('catedra_deleted_course_ids');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

const getStoredCustomCourses = (): Course[] => {
  try {
    const raw = localStorage.getItem('catedra_custom_courses');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const getStoredEditedCourses = (): Record<string, Partial<Course>> => {
  try {
    const raw = localStorage.getItem('catedra_edited_courses');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const reconcileCourses = (incoming: Course[]): Course[] => {
  const deleted = getDeletedCourseIds();
  const custom = getStoredCustomCourses();
  const edited = getStoredEditedCourses();

  const baseMap = new Map<string, Course>();
  for (const c of incoming) {
    if (!deleted.has(c.id)) {
      baseMap.set(c.id, c);
    }
  }

  for (const c of custom) {
    if (!deleted.has(c.id)) {
      baseMap.set(c.id, c);
    }
  }

  return Array.from(baseMap.values()).map((c) => {
    if (edited[c.id]) {
      return { ...c, ...edited[c.id] };
    }
    return c;
  });
};

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
  user: PlatformUser | null;
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
  toggleTheme: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signInAsDemo: () => Promise<void>;
  signInAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  enrollWithPayment: (course: Course, gateway: PaymentGateway) => Promise<PaymentRecord>;
  completeLesson: (course: Course, lessonId: string, minutesSpent?: number) => Promise<{ progressPercent: number; certificateIssued?: Certificate }>;
  createCourse: (courseInput: Omit<Course, 'id' | 'instructorId' | 'instructorName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCourse: (courseId: string, patch: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
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
  const [user, setUser] = useState<PlatformUser | null>(() => {
    try {
      if (localStorage.getItem('catedra_auth_mode') === 'demo') {
        return {
          uid: 'demo_student_guest',
          email: null,
          displayName: 'Estudiante Demo',
          emailVerified: false,
          photoURL: null,
          isAnonymous: true,
        };
      }
      localStorage.setItem('catedra_auth_mode', 'admin');
    } catch {}
    return ADMIN_USER;
  });
  const [authReady, setAuthReady] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(() => ({
    uid: ADMIN_USER.uid,
    displayName: ADMIN_USER.displayName!,
    photoURL: ADMIN_USER.photoURL!,
    role: 'instructor',
    preferredLanguage: 'es',
    preferredTheme: 'dark',
  }));
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

  const [activeView, setActiveView] = useState<AppView>('instructor');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<'student' | 'instructor'>('instructor');

  const [courses, setCourses] = useState<Course[]>(() => reconcileCourses(SEED_COURSES));
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [instructorEnrollments, setInstructorEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [instructorPayments, setInstructorPayments] = useState<PaymentRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedNote[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiIntegrationKey[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState(1);
  const [wsConnected, setWsConnected] = useState(false);
  const [e2eeFingerprint, setE2eeFingerprint] = useState('');

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
    () => Boolean(user?.emailVerified && user?.email === ADMIN_EMAIL),
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
    try {
      const authMode = localStorage.getItem('catedra_auth_mode');
      if (authMode === 'admin') {
        setUser(ADMIN_USER);
        setProfile({
          uid: ADMIN_USER.uid,
          displayName: ADMIN_USER.displayName!,
          photoURL: ADMIN_USER.photoURL!,
          role: 'instructor',
          preferredLanguage: (localStorage.getItem('catedra_lang') as Language) || 'es',
          preferredTheme: (localStorage.getItem('catedra_theme') as ThemeMode) || 'dark',
        });
        setWorkspaceRole('instructor');
        setAuthReady(true);
      } else if (authMode === 'demo') {
        const demoUser: PlatformUser = {
          uid: 'demo_student_guest',
          email: null,
          displayName: 'Estudiante Demo',
          emailVerified: false,
          photoURL: null,
          isAnonymous: true,
        };
        setUser(demoUser);
        setProfile({
          uid: demoUser.uid,
          displayName: demoUser.displayName!,
          photoURL: '',
          role: 'student',
          preferredLanguage: (localStorage.getItem('catedra_lang') as Language) || 'es',
          preferredTheme: (localStorage.getItem('catedra_theme') as ThemeMode) || 'dark',
        });
        setWorkspaceRole('student');
        setAuthReady(true);
      }
    } catch {}

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (localStorage.getItem('catedra_auth_mode')) {
          return;
        }
      } catch {}

      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
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

      try {
        const { fingerprint } = await getOrCreateVaultKey();
        setE2eeFingerprint(fingerprint);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName: (firebaseUser.displayName || firebaseUser.email || (firebaseUser.isAnonymous ? 'Usuario Demo' : 'Estudiante')).slice(0, 100),
            photoURL: (firebaseUser.photoURL || '').slice(0, 500),
            role: 'student',
            preferredLanguage: language,
            preferredTheme: theme,
            e2eeKeyFingerprint: fingerprint,
            activeDevicesCount: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const privRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
        const privSnap = await getDoc(privRef);
        if (!privSnap.exists()) {
          await setDoc(privRef, {
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
          });
        }

        // Seed any missing curated courses into Firestore
        const existingCourses = await getDocs(query(collection(db, 'courses'), where('published', '==', true)));
        const existingIds = new Set(existingCourses.docs.map((d) => d.id));
        const missingCourses = SEED_COURSES.filter((c) => !existingIds.has(c.id));
        if (missingCourses.length > 0) {
          const batch = writeBatch(db);
          for (const course of missingCourses) {
            batch.set(doc(db, 'courses', course.id), {
              ...course,
              instructorId: firebaseUser.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
      }
    });
    return () => unsub();
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

  // Firestore real-time listeners
  useEffect(() => {
    const coursesQuery = query(collection(db, 'courses'), where('published', '==', true));
    const unsubPublicCourses = onSnapshot(
      coursesQuery,
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => d.data() as Course);
          const loadedIds = new Set(loaded.map((c) => c.id));
          const merged = [
            ...loaded,
            ...SEED_COURSES.filter((s) => !loadedIds.has(s.id)),
          ];
          setCourses(reconcileCourses(merged));
        } else {
          setCourses(reconcileCourses(SEED_COURSES));
        }
      },
      (err) => {
        console.warn('Public courses listener fallback:', err.message);
        setCourses(reconcileCourses(SEED_COURSES));
      }
    );
    return () => unsubPublicCourses();
  }, []);

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

    const instEnrollQuery = isAdmin
      ? collection(db, 'enrollments')
      : query(collection(db, 'enrollments'), where('instructorId', '==', user.uid));
    unsubs.push(
      onSnapshot(
        instEnrollQuery,
        (snap) => setInstructorEnrollments(snap.docs.map((d) => d.data() as Enrollment)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'enrollments/instructor')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'payments'), where('studentId', '==', user.uid)),
        (snap) => setPayments(snap.docs.map((d) => d.data() as PaymentRecord)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
      )
    );

    const instPayQuery = isAdmin
      ? collection(db, 'payments')
      : query(collection(db, 'payments'), where('instructorId', '==', user.uid));
    unsubs.push(
      onSnapshot(
        instPayQuery,
        (snap) => setInstructorPayments(snap.docs.map((d) => d.data() as PaymentRecord)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments/instructor')
      )
    );

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
        (snap) => setForumThreads(snap.docs.map((d) => d.data() as ForumThread)),
        (err) => handleFirestoreError(err, OperationType.LIST, 'forumThreads')
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
    try {
      localStorage.removeItem('catedra_auth_mode');
    } catch {}
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(
    async (emailInput: string, passInput: string): Promise<{ success: boolean; message?: string }> => {
      const cleanEmail = emailInput.trim().toLowerCase();

      // Credenciales de Administrador Local / Maestro
      if (cleanEmail === ADMIN_EMAIL && passInput === '@David8734') {
        try {
          localStorage.setItem('catedra_auth_mode', 'admin');
        } catch {}
        setUser(ADMIN_USER);
        setProfile({
          uid: ADMIN_USER.uid,
          displayName: ADMIN_USER.displayName!,
          photoURL: ADMIN_USER.photoURL!,
          role: 'instructor',
          preferredLanguage: language,
          preferredTheme: theme,
        });
        setWorkspaceRole('instructor');
        setActiveView('instructor');
        triggerPushAlert('sync', 'Acceso Administrador', `Sesión iniciada con éxito como ${ADMIN_USER.email}`);
        return { success: true };
      }

      // Intento estándar en Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, passInput);
        try {
          localStorage.removeItem('catedra_auth_mode');
        } catch {}
        return { success: true };
      } catch (err: unknown) {
        // Si no existe, intentar crear usuario
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, passInput);
          try {
            localStorage.removeItem('catedra_auth_mode');
          } catch {}
          return { success: true };
        } catch (createErr: unknown) {
          const msg = err instanceof Error ? err.message : 'Error de autenticación';
          return { success: false, message: msg };
        }
      }
    },
    [language, theme, triggerPushAlert]
  );

  const signInAsDemo = useCallback(async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('Firebase anonymous sign in unavailable, using local demo user:', err);
      const demoUser: PlatformUser = {
        uid: 'demo_student_guest',
        email: null,
        displayName: 'Estudiante Demo',
        emailVerified: false,
        photoURL: null,
        isAnonymous: true,
      };
      try {
        localStorage.setItem('catedra_auth_mode', 'demo');
      } catch {}
      setUser(demoUser);
      setProfile({
        uid: demoUser.uid,
        displayName: demoUser.displayName!,
        photoURL: '',
        role: 'student',
        preferredLanguage: language,
        preferredTheme: theme,
      });
      setWorkspaceRole('student');
      triggerPushAlert('sync', 'Modo Demo', 'Has iniciado sesión como Estudiante Demo.');
    }
  }, [language, theme, triggerPushAlert]);

  const signInAsAdmin = useCallback(async () => {
    try {
      localStorage.setItem('catedra_auth_mode', 'admin');
    } catch {}
    setUser(ADMIN_USER);
    setProfile({
      uid: ADMIN_USER.uid,
      displayName: ADMIN_USER.displayName!,
      photoURL: ADMIN_USER.photoURL!,
      role: 'instructor',
      preferredLanguage: language,
      preferredTheme: theme,
    });
    setWorkspaceRole('instructor');
    setActiveView('instructor');
    triggerPushAlert('sync', 'Acceso Administrador', 'Has iniciado sesión como Administrador de la plataforma.');
  }, [language, theme, triggerPushAlert]);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('catedra_auth_mode');
    } catch {}
    setUser(null);
    setProfile(null);
    setPrivateInfo(null);
    try {
      await signOut(auth);
    } catch {}
    setActiveView('catalog');
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
    async (course: Course, gateway: PaymentGateway): Promise<PaymentRecord> => {
      if (!user) throw new Error('Authentication required');
      const res = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          studentId: user.uid,
          instructorId: course.instructorId,
          amountCents: course.priceCents,
          currency: course.currency,
          gateway,
        }),
      });
      if (!res.ok) throw new Error('Payment authorization failed');
      const receipt = (await res.json()) as {
        paymentId: string;
        transactionRef: string;
        status: 'succeeded';
      };

      // Ensure the course document exists in Firestore before enrollment/payment rules check exists()
      const courseRef = doc(db, 'courses', course.id);
      const courseSnap = await getDoc(courseRef);
      let resolvedInstructorId =
        course.instructorId === 'platform-faculty' ? user.uid : course.instructorId;
      if (!courseSnap.exists()) {
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
        resolvedInstructorId = String(courseSnap.data()?.instructorId || resolvedInstructorId);
      }

      const enrollmentId = `${course.id}_${user.uid}`;
      const batch = writeBatch(db);
      const paymentPayload: PaymentRecord = {
        id: receipt.paymentId,
        courseId: course.id,
        courseTitle: course.title.slice(0, 140),
        studentId: user.uid,
        instructorId: resolvedInstructorId,
        amountCents: course.priceCents,
        currency: course.currency,
        gateway,
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
        `${course.title} (${gateway.toUpperCase()} · ${receipt.transactionRef})`
      );
      return paymentPayload;
    },
    [user, privateInfo, triggerPushAlert, t]
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
      if (!current) throw new Error('Enrollment not found');

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
      if (!user) throw new Error('Authentication required');
      const id = `crs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newCourse: Course = {
        ...courseInput,
        id,
        instructorId: user.uid,
        instructorName: (user.displayName || user.email || 'Profesor').slice(0, 100),
        published: true,
      };

      try {
        const custom = getStoredCustomCourses();
        const updated = [newCourse, ...custom.filter((c) => c.id !== id)];
        localStorage.setItem('catedra_custom_courses', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save custom course to localStorage', e);
      }

      setCourses((prev) => reconcileCourses([newCourse, ...prev.filter((c) => c.id !== id)]));

      try {
        await setDoc(doc(db, 'courses', id), {
          ...newCourse,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore createCourse fallback to local storage:', err);
      }

      triggerPushAlert('sync', 'Curso publicado', `El curso "${newCourse.title}" ha sido publicado correctamente.`);
    },
    [user, triggerPushAlert]
  );

  const updateCourse = useCallback(
    async (courseId: string, patch: Partial<Course>) => {
      if (!user) throw new Error('Authentication required');

      try {
        const edited = getStoredEditedCourses();
        edited[courseId] = { ...(edited[courseId] || {}), ...patch };
        localStorage.setItem('catedra_edited_courses', JSON.stringify(edited));

        const custom = getStoredCustomCourses();
        const idx = custom.findIndex((c) => c.id === courseId);
        if (idx !== -1) {
          custom[idx] = { ...custom[idx], ...patch };
          localStorage.setItem('catedra_custom_courses', JSON.stringify(custom));
        }
      } catch (e) {
        console.warn('Could not save edited course to localStorage', e);
      }

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, ...patch } : c))
      );

      try {
        await updateDoc(doc(db, 'courses', courseId), {
          ...patch,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore updateCourse fallback to local storage:', err);
      }

      triggerPushAlert('sync', 'Curso actualizado', 'Los cambios del curso han sido guardados con éxito.');
    },
    [user, triggerPushAlert]
  );

  const deleteCourse = useCallback(
    async (courseId: string) => {
      if (!user) throw new Error('Authentication required');

      try {
        const deleted = getDeletedCourseIds();
        deleted.add(courseId);
        localStorage.setItem('catedra_deleted_course_ids', JSON.stringify(Array.from(deleted)));

        const custom = getStoredCustomCourses().filter((c) => c.id !== courseId);
        localStorage.setItem('catedra_custom_courses', JSON.stringify(custom));

        const edited = getStoredEditedCourses();
        delete edited[courseId];
        localStorage.setItem('catedra_edited_courses', JSON.stringify(edited));
      } catch (e) {
        console.warn('Could not update localStorage on deleteCourse', e);
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
      }

      try {
        await deleteDoc(doc(db, 'courses', courseId));
      } catch (err) {
        console.warn('Firestore deleteCourse fallback to local storage:', err);
      }

      triggerPushAlert('sync', 'Curso eliminado', 'El curso fue eliminado permanentemente.');
    },
    [user, selectedCourseId, triggerPushAlert]
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
      const course = courses.find((c) => c.id === thread.courseId);
      const isInstructorAnswer = Boolean(course && (course.instructorId === user.uid || isAdmin));
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
      batch.update(doc(db, 'forumThreads', thread.id), {
        repliesCount: (thread.repliesCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
      try {
        await batch.commit();
        sendWs({ type: 'FORUM_POSTED', courseId: thread.courseId, title: thread.title });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `forumThreads/${thread.id}/replies`);
      }
    },
    [user, courses, isAdmin, sendWs]
  );

  const upvoteForumThread = useCallback(async (thread: ForumThread) => {
    try {
      await updateDoc(doc(db, 'forumThreads', thread.id), {
        upvotesCount: (thread.upvotesCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `forumThreads/${thread.id}`);
    }
  }, []);

  const toggleForumThreadState = useCallback(
    async (thread: ForumThread, field: 'pinned' | 'resolved') => {
      try {
        await updateDoc(doc(db, 'forumThreads', thread.id), {
          [field]: !thread[field],
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `forumThreads/${thread.id}`);
      }
    },
    []
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

  const toggleCalendarEventComplete = useCallback(async (ev: CalendarEvent) => {
    try {
      await updateDoc(doc(db, 'calendarEvents', ev.id), {
        completed: !ev.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `calendarEvents/${ev.id}`);
    }
  }, []);

  const deleteCalendarEvent = useCallback(async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'calendarEvents', eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `calendarEvents/${eventId}`);
    }
  }, []);

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

  const deleteEncryptedNote = useCallback(async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'encryptedNotes', noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `encryptedNotes/${noteId}`);
    }
  }, []);

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

  const toggleApiKey = useCallback(async (keyRecord: ApiIntegrationKey) => {
    try {
      await updateDoc(doc(db, 'apiKeys', keyRecord.id), { active: !keyRecord.active });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apiKeys/${keyRecord.id}`);
    }
  }, []);

  const deleteApiKey = useCallback(async (keyId: string) => {
    try {
      await deleteDoc(doc(db, 'apiKeys', keyId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `apiKeys/${keyId}`);
    }
  }, []);

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
    toggleTheme,
    setLanguage,
    signInWithGoogle,
    signInWithEmail,
    signInAsDemo,
    signInAsAdmin,
    logout,
    enrollWithPayment,
    completeLesson,
    createCourse,
    updateCourse,
    deleteCourse,
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
