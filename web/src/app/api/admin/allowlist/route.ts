import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { isAdmin } from "@/lib/allowlist";

/**
 * Verify the request carries a valid Firebase ID token from an admin user.
 * Returns the decoded token or throws a NextResponse error.
 */
async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.replace("Bearer ", "").trim();

  if (!idToken) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    if (!isAdmin(decoded.email)) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { decoded };
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

/**
 * GET /api/admin/allowlist
 * Returns all emails in the Firestore allowlisted_emails collection.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("allowlisted_emails").orderBy("addedAt", "desc").get();
    const emails = snapshot.docs.map((doc) => ({
      email: doc.data().email as string,
      addedAt: doc.data().addedAt as string,
      addedBy: doc.data().addedBy as string,
    }));
    return NextResponse.json({ emails });
  } catch (err) {
    console.error("Error fetching allowlist:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/allowlist
 * Body: { email: string }
 * Adds an email to the allowlisted_emails collection and grants isPro on
 * the user's Firestore document if they already have an account.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing or invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getAdminDb();
    const docRef = db.collection("allowlisted_emails").doc(normalizedEmail);

    // Check for duplicate
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json({ error: "Email is already allowlisted" }, { status: 409 });
    }

    // Store in allowlisted_emails collection
    await docRef.set({
      email: normalizedEmail,
      addedAt: new Date().toISOString(),
      addedBy: auth.decoded!.email ?? "admin",
    });

    // If a Firebase Auth user already exists with this email, also set isPro: true on their doc
    let grantedExistingUser = false;
    try {
      const userRecord = await getAuth(getAdminApp()).getUserByEmail(normalizedEmail);
      await db.collection("users").doc(userRecord.uid).set(
        { isPro: true, subscriptionStatus: "active" },
        { merge: true }
      );
      grantedExistingUser = true;
    } catch {
      // User doesn't have an account yet — that's fine, they'll get isPro on signup
    }

    return NextResponse.json({ added: true, grantedExistingUser });
  } catch (err) {
    console.error("Error adding to allowlist:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/allowlist
 * Body: { email: string }
 * Removes an email from the allowlisted_emails collection.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing or invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getAdminDb();
    await db.collection("allowlisted_emails").doc(normalizedEmail).delete();

    return NextResponse.json({ removed: true });
  } catch (err) {
    console.error("Error removing from allowlist:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
