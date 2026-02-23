/**
 * Central API client for OrbisVoice web app.
 *
 * All requests go directly to NEXT_PUBLIC_API_URL.
 * Network failures are caught and re-thrown with user-friendly messages.
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEV_SSR_URL = process.env.NODE_ENV === "production" ? "http://api:5000" : "http://localhost:4001";

export const API_BASE = (() => {
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

export interface ApiResponse<T = unknown> {
    ok: boolean;
    message?: string;
    data?: T;
}

/**
 * Typed fetch wrapper. Throws a user-friendly Error on network failure.
 */
export async function apiFetch<T = unknown>(
    path: string,
    options?: RequestInit
): Promise<{ res: Response; data: ApiResponse<T> }> {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

    let res: Response;
    try {
        res = await fetch(url, options);
    } catch (_err) {
        // Network-level failure: API down, wrong port, CORS, etc.
        throw new Error(
            "Cannot connect to the server. Please make sure the API is running."
        );
    }

    let data: ApiResponse<T>;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
    }

    return { res, data };
}

/** Convenience: returns Authorization header from localStorage token */
export function authHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}