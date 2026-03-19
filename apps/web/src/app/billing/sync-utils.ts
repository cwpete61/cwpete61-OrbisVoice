export function isPaidTier(tier: string | null | undefined): boolean {
  return !!tier && tier !== "free";
}

export interface RetrySyncOptions {
  maxAttempts?: number;
  waitMs?: number;
}

export interface RetrySyncResult {
  upgraded: boolean;
  tier: string | null;
  attempts: number;
}

export async function retrySyncUntilPaid(
  syncOnce: () => Promise<string | null>,
  options: RetrySyncOptions = {}
): Promise<RetrySyncResult> {
  const maxAttempts = options.maxAttempts ?? 5;
  const waitMs = options.waitMs ?? 1500;

  let tier: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    tier = await syncOnce();

    if (isPaidTier(tier)) {
      return { upgraded: true, tier, attempts: attempt };
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return { upgraded: false, tier, attempts: maxAttempts };
}
