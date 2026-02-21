"use strict";
/**
 * Central API client for OrbisVoice web app.
 *
 * All requests go directly to NEXT_PUBLIC_API_URL.
 * Network failures are caught and re-thrown with user-friendly messages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiFetch = apiFetch;
exports.authHeader = authHeader;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? "" : "http://localhost:4000");
/**
 * Typed fetch wrapper. Throws a user-friendly Error on network failure.
 */
async function apiFetch(path, options) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    let res;
    try {
        res = await fetch(url, options);
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
