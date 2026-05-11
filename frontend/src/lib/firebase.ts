// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHpiRhztvb7TE9o-4RRy5Q6Lv_XO78dbs",
  authDomain: "void-esports-website.firebaseapp.com",
  projectId: "void-esports-website",
  storageBucket: "void-esports-website.firebasestorage.app",
  messagingSenderId: "862107622581",
  appId: "1:862107622581:web:bbcb31f17fd539bd5d32fc"
};

// Prevent direct access to firebaseConfig from window object
Object.freeze(firebaseConfig);

// Initialize Firebase only on the client side
let app;
let db: Firestore | null;
let auth: Auth | null;
let storage: FirebaseStorage | null;

try {
  // Firestore can be initialized for both client and server usage.
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase app/firestore initialization failed:", error);
  app = null;
  db = null;
}

if (typeof window !== 'undefined' && app) {
  // Client-only services
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  // Server-side - avoid auth/storage usage in API routes.
  auth = null;
  storage = null;
}

// Export conditionally
export { db, auth, storage };
export default app;