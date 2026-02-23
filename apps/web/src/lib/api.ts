/**
 * Central API client for OrbisVoice web app.
 *
 * All requests go directly to NEXT_PUBLIC_API_URL.
 * Network failures are caught and re-thrown with user-friendly messages.
 */

const DEV_SSR_URL = process.env.NODE_ENV === "production" ? "http://api:5000" : "http://localhost:4001";
const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? "/api" : DEV_SSR_URL);

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
