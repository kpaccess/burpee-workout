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
    const today = new Date().toISOString().slice(0, 10);
    await statsRef.set({ pageViews: FieldValue.increment(1) }, { merge: true });
    await statsRef.update({ [`dailyViews.${today}`]: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error recording page view:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
