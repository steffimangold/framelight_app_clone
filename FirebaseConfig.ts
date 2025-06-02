import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ensure proper formatting of environment variables
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - directly, without checks
const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized:", app.name);

// Initialize Auth and Firestore
const auth = getAuth(app);
console.log("Firebase auth initialized");

const db = getFirestore(app);
console.log("Firestore initialized");

export { app, auth, db };
