# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **User Role Elevation Prevention**: A user creating their own `/users/{userId}` document may only initialize `role == 'student'` unless they are the verified platform admin (`marinodavidr7@gmail.com` with `email_verified == true`). Users cannot escalate `role` or `uid` via updates.
2. **PII Isolation**: User email, push configuration, and cloud storage configuration reside strictly in `/users/{userId}/private/info`, readable and writable only by `request.auth.uid == userId` or verified admin.
3. **Course Ownership**: Only the course's `instructorId` or verified admin can update or delete a course. Published courses are readable; unpublished drafts are strictly restricted to their instructor or admin.
4. **Enrollment Integrity**: An enrollment requires an existing `/courses/{courseId}` document, `studentId == request.auth.uid`, and `progressPercent` bounded `[0, 100]`. Completed enrollments (`status == 'completed'`) cannot regress and require `progressPercent == 100`.
5. **Certificate Anti-Forgery**: A student can only create a certificate if `completionPercent == 100` AND their Firestore enrollment document `/enrollments/{courseId}_{uid}` already confirms `progressPercent == 100`. Certificates are immutable once issued.
6. **Payment Immutability**: Payment records are immutable after creation (except admin refund transition `'succeeded' -> 'refunded'`). `amountCents >= 0`.
7. **Forum Master Gate**: Forum replies under `/forumThreads/{threadId}/replies/{replyId}` require an existing parent thread verified via `exists()`, and `threadId` must match the path parameter.
8. **E2EE Vault Isolation**: `/encryptedNotes/{noteId}` and `/calendarEvents/{eventId}` and `/apiKeys/{keyId}` are strictly scoped to `ownerId == request.auth.uid` on both read (including `list`) and write.
9. **Temporal & ID Integrity**: All `createdAt`/`updatedAt` timestamps must match `request.time`, all document IDs must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars, or `<= 260` for composite enrollment IDs), and all strings/arrays have explicit upper bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Privilege Escalation on Signup**: `CREATE /users/u1` with `{ uid: "u1", role: "instructor", ... }` by non-admin -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: `UPDATE /users/u1` adding `{ isVerified: true }` -> `PERMISSION_DENIED` (blocked by `affectedKeys().hasOnly(...)`).
3. **PII Cross-Read**: `GET /users/u1/private/info` authenticated as `u2` -> `PERMISSION_DENIED`.
4. **Unverified Email Write**: `CREATE /courses/c1` where `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
5. **Email Spoof Admin**: `DELETE /courses/c1` where `email == "marinodavidr7@gmail.com"` and `email_verified == false` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: `CREATE /courses/invalid!@#id_exceeding_128_chars...` -> `PERMISSION_DENIED`.
7. **Orphaned Enrollment**: `CREATE /enrollments/nonexistent_u1` pointing to non-existent `courseId` -> `PERMISSION_DENIED`.
8. **Forged Certificate**: `CREATE /certificates/cert1` when `/enrollments/c1_u1` has `progressPercent: 40` -> `PERMISSION_DENIED`.
9. **Payment Tampering**: `UPDATE /payments/pay1` changing `amountCents` from `9900` to `1` -> `PERMISSION_DENIED`.
10. **Orphaned Forum Reply**: `CREATE /forumThreads/missingThread/replies/r1` -> `PERMISSION_DENIED`.
11. **Blanket List Query Scraping**: `LIST /calendarEvents` without filtering `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
12. **Client Timestamp Forgery**: `CREATE /encryptedNotes/n1` with backdated `createdAt` != `request.time` -> `PERMISSION_DENIED`.
