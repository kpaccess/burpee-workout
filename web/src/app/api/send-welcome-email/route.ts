import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";
import { isAllowlisted } from "@/lib/allowlist";
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
    const { uid, email: reqEmail, force } = await req.json();
    email = reqEmail;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing uid or email" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    // Skip if already sent (unless force=true)
    if (!force && userSnap.exists && userSnap.data()?.welcomeEmailSent === true) {
      return NextResponse.json({ sent: false, reason: "already_sent" });
    }

    const allowlisted = isAllowlisted(email);
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
