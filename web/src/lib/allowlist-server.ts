/**
 * SERVER-ONLY allowlist helpers.
 * This file imports firebase-admin and must never be bundled for the browser.
 * The `server-only` package makes Next.js throw a build error if a Client
 * Component tries to import anything from here.
 */
// ⚠️  SERVER-ONLY — never import this file from a Client Component.
// Add `server-only` to package.json and uncomment the line below
// for a hard build-time error if this file leaks into the browser bundle:
// import "server-only";

import { isAllowlisted } from "./allowlist";
import { getAdminDb } from "./firebase-admin";

/**
 * Async check — looks at env vars first, then the Firestore
 * `allowlisted_emails` collection managed via the admin UI.
 * Use this in API routes and Server Components.
 */
export async function isAllowlistedServer(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;

  // Fast path: env var check (no DB round-trip needed)
  if (isAllowlisted(email)) return true;

  // Dynamic Firestore check
  try {
    const db = getAdminDb();
    const doc = await db
      .collection("allowlisted_emails")
      .doc(email.trim().toLowerCase())
      .get();
    return doc.exists;
  } catch {
    return false;
  }
}
