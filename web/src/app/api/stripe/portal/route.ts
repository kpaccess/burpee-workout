import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getAdminApp, getAdminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: NextRequest) {
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

    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 },
      );
    }

    // Use env var if set (production), otherwise derive from the incoming request origin (local dev)
    const { origin } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
