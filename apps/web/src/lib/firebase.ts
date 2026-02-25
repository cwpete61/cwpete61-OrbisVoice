import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Only initialize if we have an API key to prevent runtime crashes
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key");

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;
let appCheck: AppCheck | undefined;

if (isConfigured) {
    try {
        app = getApps().length === 0
            ? initializeApp(firebaseConfig)
            : getApps()[0];
        auth = getAuth(app);

        // Initialize Analytics
        if (typeof window !== "undefined") {
            analytics = getAnalytics(app);
        }

        // Initialize App Check
        if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
            const siteKey = process.env.NEXT_PUBLIC_APPCHECK_KEY;
            if (siteKey) {
                appCheck = initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider(siteKey),
                    isTokenAutoRefreshEnabled: true,
                });
            }
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase is not configured. Social login will be disabled.");
}

export { app, auth, appCheck, analytics };
export default app;
