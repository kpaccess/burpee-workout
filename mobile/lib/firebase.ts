import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize app + auth once. On subsequent hot-reloads the app is already
// registered, so we grab the existing instance and its auth object.
let auth: Auth;
if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  auth = initializeAuth(app);
} else {
  auth = getAuth(getApp());
}

export { auth };
export const db = getFirestore(
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig),
);
