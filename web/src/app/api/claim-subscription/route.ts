import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * POST /api/claim-subscription
 * Called client-side after login/signup to claim a pending subscription
 * that was created during guest Stripe checkout.
 *
 * Body: { uid: string, email: string }
 *
 * This runs server-side with Admin SDK so the client never needs to
 * write subscription fields directly to the users collection.
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
    const pendingRef = db
      .collection("pending_subscriptions")
      .doc(email.toLowerCase());
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      return NextResponse.json({ claimed: false, reason: "no_pending" });
    }

    const data = pendingSnap.data()!;
    const userRef = db.collection("users").doc(uid);

    await userRef.set(
      {
        isPro: true,
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        subscriptionStatus: data.subscriptionStatus ?? "active",
      },
      { merge: true },
    );

    await pendingRef.delete();

    return NextResponse.json({ claimed: true });
  } catch (err) {
    console.error("Error claiming pending subscription:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
