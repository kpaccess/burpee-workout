import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
  } else {
    // Use a service account key JSON provided via env var.
    // The env var should contain the full JSON string of the service account key.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      // Fallback: In environments like Google Cloud, default credentials
      // are available automatically. On Vercel, you should set the env var.
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}
