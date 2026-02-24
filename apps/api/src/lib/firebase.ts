import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "../env";

const firebaseConfig = {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(/\\n/g, "\n"),
};

const app =
    getApps().length === 0
        ? initializeApp({
            credential: firebaseConfig.projectId ? cert(firebaseConfig) : undefined,
        })
        : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
