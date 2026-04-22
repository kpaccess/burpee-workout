import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { ADMIN_EMAIL } from "@/lib/allowlist";
import { getAuth } from "firebase-admin/auth";

export interface UserRow {
  serialNo: number;
  firstName: string;
  lastName: string;
  email: string;
  created: string;
  lastLogin: string;
  isPro: boolean;
  tier: string;
  level: string;
  startDate: string;
  onboarded: boolean;
}

export interface AdminStats {
  pageViews: number;
  signupCount: number;
  users: UserRow[];
}

/**
 * GET /api/admin/stats
 * Returns { pageViews, signupCount, users[] } for the admin dashboard.
 * Protected: only accessible to the ADMIN_EMAIL account.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    if (decoded.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getAdminDb();
    const auth = getAuth(getAdminApp());

    const [statsSnap, authResult] = await Promise.all([
      db.collection("analytics").doc("stats").get(),
      auth.listUsers(1000),
    ]);

    const pageViews: number = statsSnap.exists
      ? (statsSnap.data()?.pageViews ?? 0)
      : 0;

    // Fetch all user Firestore docs in parallel
    const authUsers = authResult.users;
    const firestoreDocs = await Promise.all(
      authUsers.map((u) => db.collection("users").doc(u.uid).get()),
    );

    const users: UserRow[] = authUsers.map((u, i) => {
      const data = firestoreDocs[i].data() ?? {};
      const nameParts = (u.displayName ?? "").trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");
      return {
        serialNo: i + 1,
        firstName,
        lastName,
        email: u.email ?? "(no email)",
        created: u.metadata.creationTime,
        lastLogin: u.metadata.lastSignInTime ?? "Never",
        isPro: data.isPro ?? false,
        tier: data.workoutTier ?? "",
        level: data.currentLevelId ?? "",
        startDate: data.startDate ?? "",
        onboarded: !!data.startDate,
      };
    });

    // Sort: most recently logged in first
    users.sort(
      (a, b) =>
        new Date(b.lastLogin === "Never" ? 0 : b.lastLogin).getTime() -
        new Date(a.lastLogin === "Never" ? 0 : a.lastLogin).getTime(),
    );
    users.forEach((u, i) => { u.serialNo = i + 1; });

    return NextResponse.json({ pageViews, signupCount: authUsers.length, users });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
