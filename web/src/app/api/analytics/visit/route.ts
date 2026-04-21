import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/analytics/visit
 * Atomically increments the page-view counter in Firestore.
 * Called client-side from LandingPage on every mount.
 */
export async function POST() {
  try {
    const db = getAdminDb();
    const statsRef = db.collection("analytics").doc("stats");
    await statsRef.set(
      { pageViews: FieldValue.increment(1) },
      { merge: true },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error recording page view:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
