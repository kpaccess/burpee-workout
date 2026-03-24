import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseEnvVars = [
  !firebaseConfig.apiKey && 'NEXT_PUBLIC_FIREBASE_API_KEY',
  !firebaseConfig.authDomain && 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  !firebaseConfig.projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  !firebaseConfig.storageBucket && 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  !firebaseConfig.messagingSenderId && 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  !firebaseConfig.appId && 'NEXT_PUBLIC_FIREBASE_APP_ID',
].filter(Boolean) as string[];

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Guard against missing env vars during Next.js SSR/build prerendering
if (missingFirebaseEnvVars.length === 0) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
} else if (typeof window !== 'undefined') {
  console.error(
    `Firebase is not configured. Missing env vars: ${missingFirebaseEnvVars.join(', ')}`
  );
}

export { auth, db, missingFirebaseEnvVars };
