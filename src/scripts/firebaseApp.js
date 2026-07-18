import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPYA6i7A1oCEaJO3CjsmqJYxprvkHDd9E",
  authDomain: "foodexpress-8f825.firebaseapp.com",
  projectId: "foodexpress-8f825",
  storageBucket: "foodexpress-8f825.firebasestorage.app",
  messagingSenderId: "857206002805",
  appId: "1:857206002805:web:8651ea76224a37f9ee543c",
  measurementId: "G-BELPVJ508R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Connect to Local Emulators ONLY if explicitly enabled via localStorage (college project offline mode)
const useEmulators = typeof window !== "undefined" && localStorage.getItem("use_emulators") === "true";
if (useEmulators && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("⚡ Offline Mode: Connected to Local Firebase Emulators!");
  } catch (err) {
    console.warn("Emulators connection skipped or already initialized:", err);
  }
} else {
  console.log("🌐 Connected to Live Firebase Database!");
}

export { app, auth, db, googleProvider };
