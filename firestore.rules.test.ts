/**
 * Security Rules Audit Matrix for the "Dirty Dozen" Payloads
 * Verified statically against DRAFT_firestore.rules & firestore.rules.
 */
export interface SecurityTestCase {
  id: string;
  title: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  path: string;
  expected: 'PERMISSION_DENIED';
  guardRule: string;
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 'DD-01',
    title: 'Privilege Escalation on Signup',
    operation: 'create',
    path: '/users/u1',
    expected: 'PERMISSION_DENIED',
    guardRule: "incoming().role == 'student' || isAdmin()",
  },
  {
    id: 'DD-02',
    title: 'Shadow Field Injection',
    operation: 'update',
    path: '/users/u1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isValidUserProfile(incoming()) && affectedKeys().hasOnly([...])',
  },
  {
    id: 'DD-03',
    title: 'PII Cross-Read',
    operation: 'get',
    path: '/users/u1/private/info',
    expected: 'PERMISSION_DENIED',
    guardRule: 'request.auth.uid == userId || isAdmin()',
  },
  {
    id: 'DD-04',
    title: 'Unverified Email Write',
    operation: 'create',
    path: '/courses/c1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isVerified() requires request.auth.token.email_verified == true',
  },
  {
    id: 'DD-05',
    title: 'Email Spoof Admin',
    operation: 'delete',
    path: '/courses/c1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isAdmin() requires isVerified() && email == admin',
  },
  {
    id: 'DD-06',
    title: 'ID Poisoning (>128 chars or invalid chars)',
    operation: 'create',
    path: '/courses/invalid!@#id',
    expected: 'PERMISSION_DENIED',
    guardRule: "isValidId(courseId) matches '^[a-zA-Z0-9_\\\\-]+$' && size <= 128",
  },
  {
    id: 'DD-07',
    title: 'Orphaned Enrollment',
    operation: 'create',
    path: '/enrollments/nonexistent_u1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'exists(/databases/$(database)/documents/courses/$(incoming().courseId))',
  },
  {
    id: 'DD-08',
    title: 'Forged Certificate (<100% progress)',
    operation: 'create',
    path: '/certificates/cert1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'get(.../enrollments/...).data.progressPercent == 100',
  },
  {
    id: 'DD-09',
    title: 'Payment Amount Tampering',
    operation: 'update',
    path: '/payments/pay1',
    expected: 'PERMISSION_DENIED',
    guardRule: "isAdmin() && affectedKeys().hasOnly(['status'])",
  },
  {
    id: 'DD-10',
    title: 'Orphaned Forum Reply',
    operation: 'create',
    path: '/forumThreads/missing/replies/r1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'exists(/databases/$(database)/documents/forumThreads/$(threadId))',
  },
  {
    id: 'DD-11',
    title: 'Blanket List Query Scraping',
    operation: 'list',
    path: '/calendarEvents',
    expected: 'PERMISSION_DENIED',
    guardRule: 'existing().ownerId == request.auth.uid || isAdmin()',
  },
  {
    id: 'DD-12',
    title: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/encryptedNotes/n1',
    expected: 'PERMISSION_DENIED',
    guardRule: 'incoming().createdAt == request.time',
  },
  {
    id: 'DD-13',
    title: 'Student Self-Grading Forgery',
    operation: 'create',
    path: '/assignmentSubmissions/sub1',
    expected: 'PERMISSION_DENIED',
    guardRule: "incoming().status == 'submitted' && !('grade' in incoming()) && isAdmin() on update",
  },
  {
    id: 'DD-14',
    title: 'Gift Card Enumeration Scraping',
    operation: 'list',
    path: '/giftCards',
    expected: 'PERMISSION_DENIED',
    guardRule: 'allow list: if isAdmin()',
  },
  {
    id: 'DD-15',
    title: 'Gift Card Balance Inflation / Unlinked Redemption',
    operation: 'update',
    path: '/giftCards/DBA-600-XY92',
    expected: 'PERMISSION_DENIED',
    guardRule: 'incoming().remainingAmountCents < existing().remainingAmountCents && existsAfter(.../giftCardRedemptions/...)',
  },
  {
    id: 'DD-16',
    title: 'Unauthorized Gift Card Minting',
    operation: 'create',
    path: '/giftCards/FREE-9999',
    expected: 'PERMISSION_DENIED',
    guardRule: 'allow create: if isAdmin()',
  },
  {
    id: 'DD-17',
    title: 'Coupon Enumeration Scraping',
    operation: 'list',
    path: '/coupons',
    expected: 'PERMISSION_DENIED',
    guardRule: 'allow list: if isAdmin()',
  },
  {
    id: 'DD-18',
    title: 'Unlinked Coupon Redemption / Value Tampering',
    operation: 'update',
    path: '/coupons/DBA-PROMO10',
    expected: 'PERMISSION_DENIED',
    guardRule: "affectedKeys().hasOnly(['redemptionCount', 'updatedAt']) && existsAfter(.../couponRedemptions/...)",
  },
];
