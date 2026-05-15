import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Runs once before all Playwright tests when NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
// Creates the test accounts that auth.ts helpers expect to find.
// FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST are already set
// via .env.test.local so the Admin SDK connects to the emulator automatically.
export default async function globalSetup() {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') return;

  const app = initializeApp(
    { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'burpee-workout' },
    'qa-setup',
  );
  const adminAuth = getAuth(app);

  const accounts = [
    {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
    {
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    },
  ];

  for (const { email, password } of accounts) {
    try {
      await adminAuth.createUser({ email, password });
    } catch (err: any) {
      // Already exists from a previous run — that's fine
      if (err.code !== 'auth/email-already-exists') throw err;
    }
  }

  await deleteApp(app);
}
