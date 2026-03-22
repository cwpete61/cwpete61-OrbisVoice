import { env } from "../env";
import { logger } from "../logger";

/**
 * HTTP client wrapper with centralized configuration, retries, and error handling.
 */
export class HttpClient {
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(options: { maxRetries?: number; timeout?: number } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 10000; // 10 seconds default
  }

  /**
   * Perform an HTTP request with retry logic and centralized error handling.
   */
  async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Merge timeout into options
        const requestOptions = {
          ...options,
          timeout: this.timeout,
        };

        // Make the request
        const response = await fetch(url, requestOptions);

        // If we get a non-2xx response, we still consider it a successful HTTP request
        // (the caller can decide if it's an error based on status code)
        if (!response.ok && attempt < this.maxRetries) {
          // Only retry on certain status codes (e.g., 5xx, 429)
          if (response.status >= 500 || response.status === 429) {
            await this.delayForRetry(attempt);
            continue;
          }
        }

        // Try to parse JSON if content-type indicates it
        let data: T | undefined = undefined;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            data = (await response.json()) as T;
          } catch (e) {
            // If JSON parsing fails, we'll return undefined for data
            logger.warn({ url, error: e }, "Failed to parse JSON response");
          }
        }

        return {
          ok: response.ok,
          status: response.status,
          data,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (err) {
        lastError = err as Error;
        logger.warn({ url, attempt, error: (err as Error).message }, "HTTP request attempt failed");

        // If we've exhausted retries, break
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying
        await this.delayForRetry(attempt);
      }
    }

    // All retries exhausted
    return {
      ok: false,
      status: 0,
      error: lastError?.message ?? "Unknown error",
    };
  }

  /**
   * Delay for retry with exponential backoff and jitter.
   */
  private delayForRetry(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second base
    const maxDelay = 10000; // 10 seconds max
    const delay = Math.min(baseDelay * 2 ** attempt + Math.random() * 1000, maxDelay);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Convenience methods for common HTTP verbs
  async get<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T = any>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body,
    });
  }

  async put<T = any>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body,
    });
  }

  async patch<T = any>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body,
    });
  }

  async delete<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

// Create a default instance with standard configuration
export const http = new HttpClient({
  maxRetries: 3,
  timeout: 10000,
});
