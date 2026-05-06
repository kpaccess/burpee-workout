import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAdminEmails } from "@/lib/allowlist";
import { isAllowlistedServer } from "@/lib/allowlist-server";
import { getAuth } from "firebase-admin/auth";
import {
  allowlistWelcomeEmailHtml,
  signupWelcomeEmailHtml,
} from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "BurpeePacer <hello@burpeepacers.com>";

/**
 * POST /api/send-welcome-email
 * Sends a welcome email to a newly onboarded user.
 * Guarded against duplicate sends via Firestore flag.
 *
 * Body: { uid: string, email: string, force?: boolean }
 */
export async function POST(req: NextRequest) {
  let email = "unknown";
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { uid, force } = await req.json();
    email = decoded.email?.trim().toLowerCase() ?? "unknown";

    if (!uid || email === "unknown") {
      return NextResponse.json(
        { error: "Missing uid or email" },
        { status: 400 },
      );
    }

    if (decoded.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (force) {
      const adminEmails = getAdminEmails();
      if (!decoded.email || !adminEmails.includes(decoded.email.toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    // Skip if already sent (unless force=true)
    if (!force && userSnap.exists && userSnap.data()?.welcomeEmailSent === true) {
      return NextResponse.json({ sent: false, reason: "already_sent" });
    }

    const allowlisted = await isAllowlistedServer(email);
    const subject = allowlisted
      ? "🎉 You're In — Welcome to BurpeePacer!"
      : "💪 Thank You for Signing Up to BurpeePacer!";
    const html = allowlisted
      ? allowlistWelcomeEmailHtml()
      : signupWelcomeEmailHtml();

    console.log(`[welcome-email] Sending to ${email} (uid: ${uid}, allowlisted: ${allowlisted})`);
    const sendResult = await resend.emails.send({ from: FROM, to: email, subject, html });
    console.log(`[welcome-email] Resend response:`, sendResult);

    // Mark as sent
    await userRef.set({ welcomeEmailSent: true }, { merge: true });
    console.log(`[welcome-email] Successfully sent and marked in Firestore`);

    return NextResponse.json({ sent: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[welcome-email] Error sending to ${email}:`, errorMsg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
