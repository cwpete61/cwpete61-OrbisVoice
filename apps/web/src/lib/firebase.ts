import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have an API key to prevent runtime crashes
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key");

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isConfigured) {
    try {
        app = getApps().length === 0
            ? initializeApp(firebaseConfig)
            : getApps()[0];
        auth = getAuth(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase is not configured. Social login will be disabled.");
}

export { app, auth };
export default app;
