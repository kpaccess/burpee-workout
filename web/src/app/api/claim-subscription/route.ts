import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

/**
 * POST /api/claim-subscription
 * Called client-side after login/signup to claim a pending subscription
 * that was created during guest Stripe checkout.
 *
 * Body: { uid: string }
 *
 * This runs server-side with Admin SDK so the client never needs to
 * write subscription fields directly to the users collection.
 */
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

    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "Missing uid" },
        { status: 400 },
      );
    }

    const email = decoded.email?.trim().toLowerCase();
    if (decoded.uid !== uid || !email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getAdminDb();
    const pendingRef = db
      .collection("pending_subscriptions")
      .doc(email);
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
