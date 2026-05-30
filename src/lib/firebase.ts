import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is actually provided (not empty/placeholder)
const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'demo-key' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'demo-project',
);

let app: FirebaseApp | null = null;
let auth: Auth;
let db: Firestore;

if (hasValidConfig) {
  // Prevent re-initialization in Next.js hot reloads
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // During build or when Firebase isn't configured, create a stub
  // that won't crash the build. Runtime calls will throw helpful errors.
  if (typeof window !== 'undefined') {
    console.warn(
      '[Employ\'d] Firebase is not configured. Copy .env.local.example to .env.local and fill in your Firebase credentials.',
    );
  }

  // Initialize with a minimal config so the module can be imported
  // without crashing. Operations will fail at runtime with clear errors.
  const placeholderConfig = {
    apiKey: 'placeholder',
    authDomain: 'placeholder.firebaseapp.com',
    projectId: 'placeholder',
  };
  app = getApps().length ? getApp() : initializeApp(placeholderConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app;
