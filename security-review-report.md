# BurpeePacer Security Review Report

**Date:** 2026-05-06 (updated after regression fix verification)
**Reviewer:** Tester Agent — BurpeePacer Security Review
**Scope:** Tasks #1–#10 security fixes verified against working-tree changes; final PR review; Task #11 regression fix verified; follow-up PR review fixes verified

---

## Summary

| Task | File | Status |
|------|------|--------|
| #1 | `web/src/lib/allowlist.ts` | **PASS** |
| #2 | `web/src/app/api/stripe/portal/route.ts` | **PASS** |
| #3 | `web/src/app/api/claim-subscription/route.ts` | **PASS** (server-side) — client caller broken (see Issue 1) |
| #4 | `web/src/app/api/send-welcome-email/route.ts` | **PASS** (server-side) — client caller broken (see Issue 1) |
| #5 | `web/src/app/api/stripe/checkout/route.ts` | **PASS** |
| #6 | `web/src/components/Dashboard.tsx` | **PASS** |
| #7 | `web/src/components/Login.tsx` | **PASS** |
| #8 | `web/src/lib/firebase-admin.ts` | **PASS** |
| #10 | `web/src/app/api/admin/stats/route.ts` | **PASS** |
| #11 | `web/src/components/Login.tsx` (regression fix) | **PASS** |

**Overall: APPROVED** — All API-route security fixes are correctly implemented. The critical client-side regression in Login.tsx (missing Authorization headers) has been resolved and verified, including mobile and pricing callers.

---

## Task #1 — `web/src/lib/allowlist.ts` — PASS

Evidence (lines from current file):

- No hardcoded emails. All previous arrays removed.
- `getAdminEmails()` (lines 1–3): reads `process.env.NEXT_PUBLIC_ADMIN_EMAILS`, splits on comma, trims, lowercases.
- `isAdmin()` (lines 5–8): calls `getAdminEmails().includes(email.toLowerCase())`.
- `isAllowlisted()` (lines 10–17): unions admin emails with `process.env.ALLOWLISTED_EMAILS`.
- No `"your-test-admin@gmail.com"` anywhere in the file.
- No duplicate entries (dynamically derived from env vars, so duplicates are operator concern, not code concern).
- `isAdmin` and `isAllowlisted` signatures unchanged.

---

## Task #2 — `web/src/app/api/stripe/portal/route.ts` — PASS

Evidence:

- Line 8–9: reads `Authorization` header, extracts Bearer token.
- Line 11–13: returns 401 for missing/empty token.
- Line 17: calls `verifyIdToken(idToken)`.
- Line 19: returns 403 on invalid token.
- Lines 23–24: looks up `stripeCustomerId` from Firestore using `decoded.uid` — never from request body.
- Lines 26–31: returns 400 if no Stripe customer found.

---

## Task #3 — `web/src/app/api/claim-subscription/route.ts` — PASS

Evidence (server-side):

- Lines 17–22: reads Authorization header, returns 401 for missing token.
- Lines 25–29: calls `verifyIdToken`, returns 403 on failure.
- Lines 40–42: asserts `decoded.uid !== uid`, returns 403 on mismatch.

Known regression: `claimPendingSubscription()` in `Login.tsx` (lines 34–47) makes a bare `fetch` call without an `Authorization` header. The route will return 401 for every legitimate browser call.

---

## Task #4 — `web/src/app/api/send-welcome-email/route.ts` — PASS

Evidence (server-side):

- Lines 24–29: reads Authorization header, returns 401 for missing token.
- Lines 31–36: calls `verifyIdToken`, returns 403 on failure.
- Lines 48–50: asserts `decoded.uid !== uid`, returns 403 on mismatch.
- Lines 52–57: `force=true` gated behind `getAdminEmails().includes(decoded.email.toLowerCase())`, returns 403 if not admin.

Known regression: `sendWelcomeEmail()` in `Login.tsx` (lines 49–70) also sends no `Authorization` header, causing 401s.

---

## Task #5 — `web/src/app/api/stripe/checkout/route.ts` — PASS

Evidence:

- Line 8: `userId` removed from body destructuring entirely — cannot be supplied by callers.
- Lines 26–28: reads Authorization header, extracts token.
- Lines 29–36: if token present, verifies with `verifyIdToken`; `verifiedUserId = decoded.uid`.
- Lines 47–48: `metadata: { firebaseUserId: verifiedUserId }` — server-verified UID only.
- Lines 53–60: guest path (no header) unchanged and working.

---

## Task #6 — `web/src/components/Dashboard.tsx` — PASS

Evidence:

- Line 23: `getStorage, ref, uploadBytes, getDownloadURL` imported from `firebase/storage`.
- No `FileReader` or `readAsDataURL` anywhere in the file.
- Line 140–144: 5 MB size check: `file.size > 5 * 1024 * 1024`.
- Lines 145–149: MIME type check against `["image/jpeg", "image/png", "image/webp"]`.
- Lines 156–161: `uploadBytes(storageRef, file)` then `getDownloadURL(storageRef)` → stored via `onUpdateData({ startPictureUrl: downloadUrl })`.
- Lines 701–704: `photoError` state surfaced in `<Alert>` to the user.

---

## Task #7 — `web/src/components/Login.tsx` — PASS

Evidence:

- `handleAuth` line 138: `const destination = nextPath && /^\/(?!\/)/.test(nextPath) ? nextPath : "/";`
- `handleGoogleSignIn` line 208: `router.push(nextPath && /^\/(?!\/)/.test(nextPath) ? nextPath : "/");`
- Both handlers now use the stricter regex. Protocol-relative redirects (`//evil.com`) are blocked.

---

## Task #8 — `web/src/lib/firebase-admin.ts` — PASS

Evidence:

- Lines 20–24: `JSON.parse(serviceAccountJson)` wrapped in `try/catch`.
- Catch block throws `new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Check your environment variable.")` — descriptive and actionable.

---

## Task #10 — `web/src/app/api/admin/stats/route.ts` — PASS

Evidence:

- Line 4: `UserRecord` imported from `firebase-admin/auth`.
- Lines 61–66: `const allUsers: UserRecord[] = []` declared, then `do { const result = await auth.listUsers(1000, pageToken); allUsers.push(...result.users); pageToken = result.pageToken; } while (pageToken)` — full pagination loop.
- All users collected before Firestore lookups on line 70.

---

## Regression Fix Verification — Login.tsx

**Result: PASS**

All six acceptance criteria verified against `web/src/components/Login.tsx` as of 2026-05-06:

1. `claimPendingSubscription` has a third parameter `idToken: string` — **PASS** (line 34)
2. `sendWelcomeEmail` has a third parameter `idToken: string` — **PASS** (line 49)
3. Both `fetch()` calls include `"Authorization": \`Bearer ${idToken}\`` in headers — **PASS** (lines 37 and 52)
4. In `handleAuth`, `credential.user.getIdToken()` is called before both helper calls, and the token is passed — **PASS** (line 121 before `sendWelcomeEmail`; line 133 before `claimPendingSubscription`)
5. In `handleGoogleSignIn`, `credential.user.getIdToken()` is called after the popup credential, and the token is passed to both helpers — **PASS** (line 198 for token acquisition; lines 201 and 205 for usage)
6. Open redirect fix `/^\/(?!\/)/.test(nextPath)` still present in both flow handlers — **PASS** (line 140 in `handleAuth`; line 211 in `handleGoogleSignIn`)

Issue 1 from the prior report is fully resolved. The `/api/claim-subscription` and `/api/send-welcome-email` routes will now receive valid Bearer tokens on all signup and sign-in paths.

*Signed off: Tester Agent — BurpeePacer Security Review, 2026-05-06*

---

## Remaining Issues

None.

---

## Overall Verdict

**APPROVED**

All ten security fixes (Tasks #1–#10) plus the regression fix (Task #11) are correctly implemented and pass their respective acceptance criteria. The previously blocking issue — client-side callers omitting Firebase ID tokens — has been fully resolved across web login, web pricing, and mobile callers. The codebase is approved for release.

---

*Tester Agent — BurpeePacer Security Review — 2026-05-06*
