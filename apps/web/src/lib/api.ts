/**
 * Central API client for OrbisVoice web app.
 */

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEV_SSR_URL =
  process.env.NODE_ENV === "production" ? "http://api:4001" : "http://localhost:4001";

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

export const COMMERCE_BASE = (() => {
  if (typeof window !== "undefined") {
    return "/commerce";
  }
  return process.env.NODE_ENV === "production"
    ? "http://commerce-agent:4005"
    : "http://localhost:4005";
})();

export const VOICE_GATEWAY_URL = process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL || "ws://localhost:4010";

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: "USER" | "ADMIN" | "SYSTEM_ADMIN";
  avatar?: string;
  isAffiliate?: boolean;
  isAdmin?: boolean;
  isBlocked?: boolean;
  commissionLevel?: string;
  isEmailVerifiedByAdmin?: boolean;
  emailVerified?: string | boolean;
  createdAt: string;
  affiliate?: any; // To be refined if needed
  tenant?: {
    id: string;
    creditBalance: number;
    name: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export interface PlatformSettings {
  lowCommission: number;
  medCommission: number;
  highCommission: number;
  commissionDurationMonths: number;
  defaultCommissionLevel: string;
  payoutMinimum: number;
  refundHoldDays: number;
  payoutCycleDelayMonths: number;
  starterLimit: number;
  professionalLimit: number;
  enterpriseLimit: number;
  ltdLimit: number;
  aiInfraLimit: number;
  emailVerificationEnabled: boolean;
}

export interface Affiliate {
  id: string;
  userId: string;
  user?: User;
  status: string;
  slug: string;
  customCommissionRate: number | null;
  lockedCommissionRate: number | null;
  totalEarnings: number;
  unpaidEarnings: number;
  balance: number;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  bodyHtml: string;
  enabled: boolean;
}

export interface HelpQuestion {
  id: string;
  question: string;
  suggestedAnswer?: string;
  status: "pending" | "dismissed" | "promoted";
  createdAt: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  helpful: number;
  notHelpful: number;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  hasConfig?: boolean;
}

export interface TenantGoogleConfig {
  clientId: string;
  clientSecret: string;
  geminiApiKey: string;
  hasConfig?: boolean;
}

export interface SubscriberDetail {
  id: string;
  name: string;
  billingEmail: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  subscriptionEnds: string | null;
  usageCount: number;
  usageLimit: number | null;
  usageResetAt: string | null;
  creditBalance: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  users: Array<User & { affiliate?: Affiliate }>;
  agents: Array<{
    id: string;
    name: string;
    voiceId: string | null;
    _count: {
      transcripts: number;
      leads: number;
    };
  }>;
}

export interface AdminStats {
  totalTenants: number;
  totalUsers: number;
  totalAgents: number;
  totalTranscripts: number;
  totalLeads: number;
  conversionRate: number;
  avgDuration: number;
  estimatedMRR: number;
  subscriptionBreakdown: Array<{
    subscriptionTier: string;
    _count: number;
  }>;
  systemHealth: {
    api: string;
    database: string;
    redis: string;
  };
  lastUpdated: string;
}

export interface Tenant {
  id: string;
  name: string;
  billingEmail: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  usageCount: number;
  usageLimit: number | null;
  creditBalance: number;
  createdAt: string;
  _count?: {
    users: number;
    agents: number;
  };
  users?: Array<{ email: string }>;
}

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
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type if there's a body
    if (options?.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    // Automatically add Authorization header if not present
    if (!headers["Authorization"]) {
      const auth = authHeader();
      if (auth.Authorization) {
        headers["Authorization"] = auth.Authorization;
      }
    }

    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (_err) {
    // Network-level failure: API down, wrong port, CORS, etc.
    throw new Error("Cannot connect to the server. Please make sure the API is running.");
  }

  // Auto-redirect to login on 401, but NOT for auth endpoints (to avoid redirect loops)
  const isAuthEndpoint = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthEndpoint) {
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

/** Returns the action loading key for admin handlers */
export const actionLoadingKey = (action: string, id: string) => `${action}-${id}`;

/** Unwraps a raw fetch Response or pre-parsed ApiResponse, throws descriptive error on failure */
export async function unwrapJson<T = unknown>(resOrData: Response | ApiResponse<T>): Promise<T> {
  if (resOrData instanceof Response) {
    if (resOrData.status === 401) throw new Error("Session expired. Please log in again.");
    if (!resOrData.ok) {
      let msg = `HTTP ${resOrData.status}`;
      try {
        const j = await resOrData.json();
        msg = j?.message || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return resOrData.json() as Promise<T>;
  }
  if (!resOrData.ok) throw new Error((resOrData as ApiResponse<T>).message || "Request failed");
  return (resOrData as ApiResponse<T>).data as T;
}

/** Unwraps an ApiResponse, returning data on ok or throwing with message */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.ok) {
    throw new Error(response.message || "Request failed");
  }
  return response.data as T;
}

/** Convenience: returns Authorization header from localStorage token */
export function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
