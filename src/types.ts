export type Language = 'es' | 'en' | 'fr' | 'pt';
export type ThemeMode = 'light' | 'dark';
export type UserRole = 'student' | 'instructor';
export type CurrencyCode = 'DOP' | 'USD' | 'EUR' | 'MXN';
export type PaymentGateway = 'lemonsqueezy' | 'stripe' | 'mercadopago' | 'paypal' | 'free' | 'gift_card';
export type CloudProvider = 'none' | 'google_drive' | 'dropbox' | 'aws_s3' | 'gcs';

export type AppView =
  | 'landing'
  | 'catalog'
  | 'course-detail'
  | 'learning'
  | 'instructor'
  | 'landing-editor'
  | 'forums'
  | 'certificates'
  | 'calendar'
  | 'security'
  | 'integrations'
  | 'gift-store'
  | 'account'
  | 'legal'
  | 'themes';

export type CourseMaterialType = 'pdf' | 'video' | 'doc' | 'spreadsheet' | 'image' | 'zip' | 'other';

export interface CourseMaterial {
  id: string;
  name: string;        // nombre de archivo original
  url: string;         // URL de descarga (Firebase Storage o enlace externo)
  type: CourseMaterialType;
  description?: string; // descripción técnica o pie explicativo para galería
  sizeByte: number;    // tamaño en bytes, 0 si es enlace externo
  uploadedAt: string;  // ISO 8601
}

export type CourseLessonType = 'text' | 'video' | 'excel' | 'quiz';

export interface LessonAssignmentConfig {
  enabled: boolean;
  title?: string;
  instructions?: string;
  dueDate?: string; // ISO string
  maxScore?: number; // default 100
  allowedFileTypes?: string | string[]; // e.g. '.xlsx,.pdf,.docx,.zip' or ['.xlsx', '.pdf']
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  content: string;
  materials?: CourseMaterial[]; // ← archivos adjuntos a la lección
  type?: CourseLessonType; // ← opcional para compatibilidad con cursos existentes
  videoUrl?: string;
  allowSeeking?: boolean;
  requiredWatchPercent?: number;
  allowSpeedChange?: boolean;
  status?: 'draft' | 'published';
  tags?: string[];
  assignmentConfig?: LessonAssignmentConfig;
}

export interface CourseQuizOption {
  id: string;
  text: string;
}

export interface CourseQuizQuestion {
  id: string;
  prompt: string;
  explanation: string;
  multiple: boolean;
  options: CourseQuizOption[];
  correctIndexes: number[];
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  lessons: CourseLesson[];
  quizQuestion: string;
  quizOptions: string[];
  quizCorrectIndex: number;
  // ← Evaluación ampliada (opcional). Si existe, el editor la usa; si no,
  // se migra desde quizQuestion/quizOptions/quizCorrectIndex.
  questions?: CourseQuizQuestion[];
  quizEnabled?: boolean;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  priceCents: number;
  currency: CurrencyCode;
  coverImage: string;
  instructorId: string;
  instructorName: string;
  published: boolean;
  modulesCount: number;
  totalLessons: number;
  modules: CourseModule[];
  prerequisites?: string[];
  technologies?: string[];
  tags?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CourseSyncStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export interface CourseSyncState {
  courseId: string | null;
  status: CourseSyncStatus;
  dirtyRevision: number;
  savedRevision: number;
  lastSavedAt: number | null;
  error: string | null;
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
  studentEmail?: string;
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
  originalAmountCents?: number;
  discountCents?: number;
  couponCode?: string;
  discountSource?: 'none' | 'coupon' | 'referral_welcome' | 'gift_card';
  currency: CurrencyCode;
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
  instructorSignatureUrl?: string;
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

export interface CustomExcelExercise {
  id: string;
  ownerId: string;
  authorName: string;
  lessonId: string;
  functionTag: string;
  title: string;
  prompt: string;
  hint: string;
  targetCell: string;
  solutionFormula: string;
  expectedResult: string;
  initialSheet: Record<string, string | number>;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CouponType = 'percent' | 'fixed';
export type CouponAppliesTo = 'all' | 'courses';
export type CouponRedemptionStatus = 'pending' | 'confirmed' | 'refunded';
export type ReferralStatus = 'pending' | 'qualified' | 'rewarded' | 'rejected' | 'refunded';
export type RewardType = 'welcome_discount' | 'referrer_credit';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  currency: CurrencyCode;
  appliesTo: CouponAppliesTo;
  courseIds: string[];
  startsAt?: unknown;
  expiresAt?: unknown;
  maxRedemptions?: number;
  maxPerUser: number;
  minPurchaseCents?: number;
  redemptionCount: number;
  active: boolean;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CouponRedemption {
  id: string;
  couponCode: string;
  redemptionNumber?: number;
  userId: string;
  courseId: string;
  orderId?: string;
  discountCents: number;
  status: CouponRedemptionStatus;
  createdAt: unknown;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  orderId?: string;
  status: ReferralStatus;
  rewardType: RewardType;
  rewardValue: number;
  createdAt: unknown;
  qualifiedAt?: unknown;
  rewardedAt?: unknown;
}

export interface ReferralSettings {
  id: string;
  welcomeDiscountPercent: number;
  referrerRewardPercent: number;
  referrerRewardMinCents?: number;
  retentionDays: number;
  maxRewardsPerReferrerPerMonth: number;
  active: boolean;
  updatedAt: unknown;
}

export interface CouponValidationResult {
  valid: boolean;
  originalPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  currency: CurrencyCode;
  reason?: string;
  coupon?: Coupon;
}

export type AssignmentSubmissionStatus = 'submitted' | 'graded' | 'resubmit_requested';

export interface AssignmentSubmission {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submittedAt: string; // ISO date string
  comment?: string;
  status: AssignmentSubmissionStatus;
  grade?: number; // e.g. 95 (out of maxScore)
  maxScore: number; // default 100
  feedback?: string;
  gradedAt?: string; // ISO date string
  gradedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type GiftCardStatus = 'active' | 'redeemed' | 'disabled';

export interface GiftCard {
  id: string;
  code: string;
  initialAmountCents: number;
  remainingAmountCents: number;
  currency: CurrencyCode;
  courseId?: string;
  courseTitle?: string;
  singleUse: boolean;
  status: GiftCardStatus;
  active: boolean;
  redemptionCount: number;
  expiresAt?: unknown;
  note?: string;
  redeemedBy?: string;
  redeemedAt?: unknown;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GiftCardRedemption {
  id: string;
  cardCode: string;
  redemptionNumber: number;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  amountAppliedCents: number;
  coursePriceCents: number;
  remainingPaidCents: number;
  currency: CurrencyCode;
  paymentId: string;
  redeemedAt?: unknown;
}

export type GiftCardValidationErrorCode =
  | 'not_found'
  | 'used'
  | 'expired'
  | 'disabled'
  | 'invalid_format'
  | 'course_mismatch'
  | 'currency_mismatch'
  | 'already_enrolled'
  | 'free_course'
  | 'auth_required'
  | 'network';

export interface GiftCardValidationResult {
  valid: boolean;
  card?: GiftCard;
  coveredCents: number;
  remainingToPayCents: number;
  remainingCardBalanceAfterCents: number;
  coversFullCourse: boolean;
  reason?: string;
  errorCode?: GiftCardValidationErrorCode;
}

export interface LemonSqueezyStatus {
  configured: boolean;
  webhookConfigured: boolean;
  testMode: boolean;
  providerUrl: string;
  storeCurrency: string;
  missingKeys: string[];
}

export interface LemonSqueezyCheckoutSession {
  freeBypass?: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  paymentId: string;
  courseId: string;
  amountCents: number;
  originalAmountCents: number;
  discountCents: number;
  currency: CurrencyCode;
  couponCode?: string;
  giftCardCode?: string;
  testMode?: boolean;
}

export interface LemonSqueezyVerificationResult {
  verified: boolean;
  status: 'paid' | 'pending' | 'refunded';
  paymentId: string;
  courseId: string;
  courseTitle?: string;
  instructorId?: string;
  transactionRef?: string;
  amountCents?: number;
  originalAmountCents?: number;
  discountCents?: number;
  discountSource?: 'none' | 'coupon' | 'gift_card';
  couponCode?: string;
  giftCardCode?: string;
  currency?: CurrencyCode;
  receiptUrl?: string;
  message?: string;
}

