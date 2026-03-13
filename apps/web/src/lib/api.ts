/**
 * Central API client for OrbisVoice web app.
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEV_SSR_URL = process.env.NODE_ENV === "production" ? "http://api:4001" : "http://localhost:4001";

export const API_BASE = (() => {
    // In browser, always use relative /api (proxied by Nginx or Next.js rewrites)
    if (typeof window !== "undefined") {
        return "/api";
    }
    // If NEXT_PUBLIC_API_URL is set (e.g. for SSR or specific overrides), use it
    if (ENV_API_URL && ENV_API_URL !== "undefined" && ENV_API_URL !== "null" && ENV_API_URL !== "") {
        return ENV_API_URL;
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
        res = await fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
            }
        });
    } catch (_err) {
        // Network-level failure: API down, wrong port, CORS, etc.
        throw new Error(
            "Cannot connect to the server. Please make sure the API is running."
        );
    }

    if (res.status === 401 || res.status === 404) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
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