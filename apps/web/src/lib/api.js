"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_BASE = void 0;
exports.apiFetch = apiFetch;
exports.authHeader = authHeader;
/**
 * Central API client for OrbisVoice web app.
 */
const app_check_1 = require("firebase/app-check");
const firebase_1 = require("./firebase");
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEV_SSR_URL = process.env.NODE_ENV === "production" ? "http://api:5000" : "http://localhost:4001";
exports.API_BASE = (() => {
    // If NEXT_PUBLIC_API_URL is set and valid, use it
    if (ENV_API_URL && ENV_API_URL !== "undefined" && ENV_API_URL !== "null" && ENV_API_URL !== "") {
        return ENV_API_URL;
    }
    // Default for browser is relative /api (proxied by Nginx)
    if (typeof window !== "undefined") {
        return "/api";
    }
    // Fallback for SSR (intra-container or localhost)
    return DEV_SSR_URL;
})();
/**
 * Typed fetch wrapper. Throws a user-friendly Error on network failure.
 */
async function apiFetch(path, options) {
    const url = `${exports.API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    // Inject Firebase App Check token if available
    const extraHeaders = {};
    if (typeof window !== "undefined" && firebase_1.appCheck) {
        try {
            const tokenResult = await (0, app_check_1.getToken)(firebase_1.appCheck);
            if (tokenResult.token) {
                extraHeaders["x-firebase-appcheck"] = tokenResult.token;
            }
        }
        catch (err) {
            console.warn("App Check token acquisition failed", err);
        }
    }
    let res;
    try {
        res = await fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                ...extraHeaders,
            }
        });
    }
    catch (_err) {
        // Network-level failure: API down, wrong port, CORS, etc.
        throw new Error("Cannot connect to the server. Please make sure the API is running.");
    }
    let data;
    try {
        data = await res.json();
    }
    catch {
        throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
    }
    return { res, data };
}
/** Convenience: returns Authorization header from localStorage token */
function authHeader() {
    if (typeof window === "undefined")
        return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
