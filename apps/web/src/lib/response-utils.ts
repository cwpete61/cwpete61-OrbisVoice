export interface ApiPayload<T = unknown> {
  message?: string;
  data?: T;
}

export async function readApiBody<T = unknown>(res: Response): Promise<ApiPayload<T>> {
  const text = await res.text();
  if (!text) {
    const fallback = res.statusText?.trim();
    if (fallback) {
      return { message: fallback };
    }
    return {};
  }

  try {
    return JSON.parse(text) as ApiPayload<T>;
  } catch {
    return { message: text };
  }
}
