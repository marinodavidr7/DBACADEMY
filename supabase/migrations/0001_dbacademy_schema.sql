-- DBACADEMY — migración inicial a Supabase
-- Fuente actual: Firestore. Mapeo de colecciones -> tablas:
--   users -> users (+ users_private)
--   courses -> courses
--   enrollments -> enrollments
--   payments -> payments
--   certificates -> certificates
--   forumThreads -> forum_threads, forumReplies -> forum_replies
--   calendarEvents -> calendar_events
--   encryptedNotes -> encrypted_notes
--   apiKeys -> api_keys
--   customExercises -> custom_exercises
--   assignmentSubmissions -> assignment_submissions
--   giftCards -> gift_cards, giftCardRedemptions -> gift_card_redemptions
--   coupons -> coupons, couponRedemptions -> coupon_redemptions
--   referrals -> referrals, settings.referrals -> referral_settings
-- NOTA: arrays/objetos anidados de Firestore se modelan como JSONB v1;
--       las FKs simples se cuelgan de users/courses cuando existen.

-- ------------------------------ users ------------------------------

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  preferred_language TEXT NOT NULL DEFAULT 'es',
  preferred_theme TEXT NOT NULL DEFAULT 'light',
  e2ee_key_fingerprint TEXT,
  active_devices_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users_private (
  uid TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_deadlines BOOLEAN NOT NULL DEFAULT true,
  notify_forum_replies BOOLEAN NOT NULL DEFAULT true,
  notify_payments BOOLEAN NOT NULL DEFAULT true,
  notify_certificates BOOLEAN NOT NULL DEFAULT true,
  deadline_lead_minutes INTEGER NOT NULL DEFAULT 30,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  cloud_provider TEXT NOT NULL DEFAULT 'none',
  cloud_folder TEXT,
  cloud_auto_backup BOOLEAN NOT NULL DEFAULT false,
  cloud_last_synced_at TEXT,
  updated_at TIMESTAMPTZ
);

-- ------------------------------ courses ------------------------------

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  price_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  cover_image TEXT NOT NULL DEFAULT '',
  instructor_id TEXT,
  instructor_name TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  modules_count INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  modules JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- ------------------------------ enrollments ------------------------------

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  course_title TEXT NOT NULL DEFAULT '',
  student_id TEXT NOT NULL REFERENCES users(uid),
  student_name TEXT NOT NULL DEFAULT '',
  student_email TEXT,
  instructor_id TEXT,
  completed_module_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  study_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  enrolled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS enrollments_student_idx ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON enrollments(course_id);

-- ------------------------------ payments ------------------------------

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  course_title TEXT NOT NULL DEFAULT '',
  student_id TEXT NOT NULL REFERENCES users(uid),
  instructor_id TEXT,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  original_amount_cents BIGINT,
  discount_cents BIGINT,
  coupon_code TEXT,
  discount_source TEXT CHECK (discount_source IN ('none', 'coupon', 'referral_welcome', 'gift_card')),
  currency TEXT NOT NULL DEFAULT 'USD',
  gateway TEXT NOT NULL DEFAULT 'free' CHECK (gateway IN ('lemonsqueezy', 'stripe', 'mercadopago', 'paypal', 'free', 'gift_card')),
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'refunded')),
  transaction_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS payments_student_idx ON payments(student_id);

-- ------------------------------ certificates ------------------------------

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  verification_code TEXT UNIQUE NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id),
  course_title TEXT NOT NULL DEFAULT '',
  student_id TEXT NOT NULL REFERENCES users(uid),
  student_name TEXT NOT NULL DEFAULT '',
  instructor_id TEXT,
  instructor_name TEXT NOT NULL DEFAULT '',
  completion_percent INTEGER NOT NULL DEFAULT 0,
  hash_signature TEXT NOT NULL,
  issued_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS certificates_student_idx ON certificates(student_id);

-- ------------------------------ forum ------------------------------

CREATE TABLE IF NOT EXISTS forum_threads (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  author_id TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  course_id TEXT,
  author_id TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  is_instructor_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS forum_replies_thread_idx ON forum_replies(thread_id);

-- ------------------------------ calendar ------------------------------

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  course_id TEXT,
  course_title TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'deadline' CHECK (type IN ('deadline', 'live_session', 'task', 'exam')),
  due_at_iso TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  reminder_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS calendar_events_owner_idx ON calendar_events(owner_id);

-- ------------------------------ encrypted notes ------------------------------

CREATE TABLE IF NOT EXISTS encrypted_notes (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  course_id TEXT,
  title_hint TEXT NOT NULL DEFAULT '',
  ciphertext TEXT NOT NULL DEFAULT '',
  iv TEXT NOT NULL DEFAULT '',
  algorithm TEXT NOT NULL DEFAULT 'AES-GCM-256',
  key_fingerprint TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS encrypted_notes_owner_idx ON encrypted_notes(owner_id);

-- ------------------------------ api keys ------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  label TEXT NOT NULL DEFAULT '',
  key_prefix TEXT NOT NULL DEFAULT '',
  key_hash TEXT NOT NULL DEFAULT '',
  webhook_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ
);

-- ------------------------------ custom exercises ------------------------------

CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  lesson_id TEXT,
  function_tag TEXT,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  hint TEXT NOT NULL DEFAULT '',
  target_cell TEXT,
  solution_formula TEXT,
  expected_result TEXT,
  initial_sheet JSONB,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- ------------------------------ assignment submissions ------------------------------

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  course_title TEXT NOT NULL DEFAULT '',
  lesson_id TEXT,
  lesson_title TEXT,
  student_id TEXT,
  student_name TEXT NOT NULL DEFAULT '',
  student_email TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_size BIGINT,
  submitted_at TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmit_requested')),
  grade REAL,
  max_score INTEGER NOT NULL DEFAULT 100,
  feedback TEXT,
  graded_at TEXT,
  graded_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS assignment_submissions_student_idx ON assignment_submissions(student_id);

-- ------------------------------ gift cards ------------------------------

CREATE TABLE IF NOT EXISTS gift_cards (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  initial_amount_cents BIGINT NOT NULL DEFAULT 0,
  remaining_amount_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  course_id TEXT,
  course_title TEXT,
  single_use BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'disabled')),
  active BOOLEAN NOT NULL DEFAULT true,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  note TEXT,
  redeemed_by TEXT,
  redeemed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id TEXT PRIMARY KEY,
  card_code TEXT NOT NULL,
  redemption_number INTEGER NOT NULL,
  student_id TEXT,
  student_name TEXT,
  student_email TEXT,
  course_id TEXT,
  course_title TEXT,
  amount_applied_cents BIGINT NOT NULL DEFAULT 0,
  course_price_cents BIGINT,
  remaining_paid_cents BIGINT,
  currency TEXT,
  payment_id TEXT,
  redeemed_at TIMESTAMPTZ
);

-- ------------------------------ coupons ------------------------------

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'fixed')),
  value INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'courses')),
  course_ids JSONB DEFAULT '[]'::jsonb,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_redemptions INTEGER,
  max_per_user INTEGER,
  min_purchase_cents INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_code TEXT,
  redemption_number INTEGER,
  user_id TEXT,
  course_id TEXT,
  order_id TEXT,
  discount_cents BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
  created_at TIMESTAMPTZ
);

-- ------------------------------ referrals ------------------------------

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT,
  referred_id TEXT,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'rejected', 'refunded')),
  reward_type TEXT NOT NULL DEFAULT 'welcome_discount' CHECK (reward_type IN ('welcome_discount', 'referrer_credit')),
  reward_value REAL,
  created_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS referral_settings (
  id TEXT PRIMARY KEY DEFAULT 'referrals',
  welcome_discount_percent INTEGER NOT NULL DEFAULT 0,
  referrer_reward_percent INTEGER NOT NULL DEFAULT 0,
  referrer_reward_min_cents INTEGER,
  retention_days INTEGER NOT NULL DEFAULT 0,
  max_rewards_per_referrer_per_month INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ
);

-- ------------------------------ settings (admin del servidor) ------------------------------

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ
);

COMMENT ON TABLE courses IS 'Firestore: coleccion courses (documento id)';
COMMENT ON TABLE enrollments IS 'Firestore: coleccion enrollments';
COMMENT ON TABLE users IS 'Firestore: coleccion users';
