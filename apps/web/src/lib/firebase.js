"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appCheck = exports.auth = exports.app = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const app_check_1 = require("firebase/app-check");
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
let app;
let auth;
let appCheck;
if (isConfigured) {
    try {
        exports.app = app = (0, app_1.getApps)().length === 0
            ? (0, app_1.initializeApp)(firebaseConfig)
            : (0, app_1.getApps)()[0];
        exports.auth = auth = (0, auth_1.getAuth)(app);
        // Initialize App Check
        if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
            const siteKey = process.env.NEXT_PUBLIC_APPCHECK_KEY;
            if (siteKey) {
                exports.appCheck = appCheck = (0, app_check_1.initializeAppCheck)(app, {
                    provider: new app_check_1.ReCaptchaV3Provider(siteKey),
                    isTokenAutoRefreshEnabled: true,
                });
            }
        }
    }
    catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}
else {
    console.warn("Firebase is not configured. Social login will be disabled.");
}
exports.default = app;
