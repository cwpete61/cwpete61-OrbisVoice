"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const env_1 = require("../env");
const firebaseConfig = {
    projectId: env_1.env.FIREBASE_PROJECT_ID,
    clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
    privateKey: env_1.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(/\\n/g, "\n"),
};
const app = (0, app_1.getApps)().length === 0
    ? (0, app_1.initializeApp)({
        credential: firebaseConfig.projectId ? (0, app_1.cert)(firebaseConfig) : undefined,
    })
    : (0, app_1.getApps)()[0];
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.default = app;
