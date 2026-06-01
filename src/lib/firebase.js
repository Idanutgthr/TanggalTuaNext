// src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeooj-bdmmH46dbwAQKLaHUiS5-brURpM",
  authDomain: "tanggaltua-45171.firebaseapp.com",
  projectId: "tanggaltua-45171",
  storageBucket: "tanggaltua-45171.firebasestorage.app",
  messagingSenderId: "119166926168",
  appId: "1:119166926168:web:1364a0b6460482b964792d",
  measurementId: "G-C1GLDXWDYK"
};

// Inisialisasi Firebase (mencegah inisialisasi ganda di development mode)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
