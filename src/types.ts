export type Language = 'es' | 'en' | 'fr' | 'pt';
export type ThemeMode = 'light' | 'dark';
export type UserRole = 'student' | 'instructor';
export type PaymentGateway = 'stripe' | 'mercadopago' | 'paypal';
export type CloudProvider = 'none' | 'google_drive' | 'dropbox' | 'aws_s3' | 'gcs';

export type AppView =
  | 'catalog'
  | 'learning'
  | 'instructor'
  | 'forums'
  | 'certificates'
  | 'calendar'
  | 'security'
  | 'integrations';

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  content: string;
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  lessons: CourseLesson[];
  quizQuestion: string;
  quizOptions: string[];
  quizCorrectIndex: number;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  priceCents: number;
  currency: 'USD' | 'EUR' | 'MXN';
  coverImage: string;
  instructorId: string;
  instructorName: string;
  published: boolean;
  modulesCount: number;
  totalLessons: number;
  modules: CourseModule[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  preferredLanguage: Language;
  preferredTheme: ThemeMode;
  e2eeKeyFingerprint?: string;
  activeDevicesCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  pushEnabled: boolean;
  notifyDeadlines: boolean;
  notifyForumReplies: boolean;
  notifyPayments: boolean;
  notifyCertificates: boolean;
  deadlineLeadMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  cloudProvider: CloudProvider;
  cloudFolder: string;
  cloudAutoBackup: boolean;
  cloudLastSyncedAt: string;
  updatedAt?: unknown;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  completedModuleIds: string[];
  completedLessonIds: string[];
  progressPercent: number;
  studyMinutes: number;
  status: 'active' | 'completed';
  enrolledAt?: unknown;
  updatedAt?: unknown;
}

export interface PaymentRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  instructorId: string;
  amountCents: number;
  currency: 'USD' | 'EUR' | 'MXN';
  gateway: PaymentGateway;
  status: 'succeeded' | 'refunded';
  transactionRef: string;
  createdAt?: unknown;
}

export interface Certificate {
  id: string;
  verificationCode: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  completionPercent: number;
  hashSignature: string;
  issuedAt?: unknown;
}

export interface ForumThread {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  pinned: boolean;
  resolved: boolean;
  upvotesCount: number;
  repliesCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ForumReply {
  id: string;
  threadId: string;
  courseId: string;
  authorId: string;
  authorName: string;
  body: string;
  isInstructorAnswer: boolean;
  createdAt?: unknown;
}

export interface CalendarEvent {
  id: string;
  ownerId: string;
  courseId?: string;
  courseTitle?: string;
  title: string;
  type: 'deadline' | 'live_session' | 'task' | 'exam';
  dueAtIso: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  reminderMinutes: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EncryptedNote {
  id: string;
  ownerId: string;
  courseId?: string;
  titleHint: string;
  ciphertext: string;
  iv: string;
  algorithm: 'AES-GCM-256';
  keyFingerprint: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ApiIntegrationKey {
  id: string;
  ownerId: string;
  label: string;
  keyPrefix: string;
  keyHash: string;
  webhookUrl?: string;
  active: boolean;
  createdAt?: unknown;
}

export interface InAppNotification {
  id: string;
  category: 'deadline' | 'forum' | 'payment' | 'certificate' | 'sync';
  title: string;
  message: string;
  createdAtIso: string;
  read: boolean;
}
