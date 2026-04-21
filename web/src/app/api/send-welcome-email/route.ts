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
 * Body: { uid: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing uid or email" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    // Skip if already sent
    if (userSnap.exists && userSnap.data()?.welcomeEmailSent === true) {
      return NextResponse.json({ sent: false, reason: "already_sent" });
    }

    const allowlisted = isAllowlisted(email);
    const subject = allowlisted
      ? "🎉 You're In — Welcome to BurpeePacer!"
      : "💪 Thank You for Signing Up to BurpeePacer!";
    const html = allowlisted
      ? allowlistWelcomeEmailHtml()
      : signupWelcomeEmailHtml();

    await resend.emails.send({ from: FROM, to: email, subject, html });

    // Mark as sent
    await userRef.set({ welcomeEmailSent: true }, { merge: true });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Error sending welcome email:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
