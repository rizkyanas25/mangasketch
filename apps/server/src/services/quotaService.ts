import { GetQuotaResponse } from '@mangasketch/shared';

interface QuotaEntry {
  count: number;
  resetTime: number;
}

export class QuotaService {
  // In-memory store for rate limits
  private static store = new Map<string, QuotaEntry>();

  /**
   * Calculates the timestamp of the next midnight (00:00 UTC).
   */
  private static getNextMidnightUTC(): number {
    const now = new Date();
    return Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    );
  }

  /**
   * Resets the entire in-memory quota store. Primary use case is test isolation.
   */
  static reset(): void {
    this.store.clear();
  }

  /**
   * Retrieves the current quota status for a given key (user ID or IP).
   * Automatically resets the count if the 00:00 UTC reset time has passed.
   */
  static getQuota(key: string, limit: number): GetQuotaResponse {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: this.getNextMidnightUTC(),
      };
      this.store.set(key, entry);
    }

    const remaining = Math.max(0, limit - entry.count);

    return {
      limit,
      remaining,
      resetTime: new Date(entry.resetTime).toISOString(),
    };
  }

  /**
   * Consumes 1 sketch generation from the quota.
   * Returns true if consumption was successful, false if quota is exhausted.
   */
  static consumeQuota(key: string, limit: number): boolean {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: this.getNextMidnightUTC(),
      };
    }

    if (entry.count >= limit) {
      this.store.set(key, entry); // Make sure the resetTime is saved if newly reset
      return false;
    }

    entry.count += 1;
    this.store.set(key, entry);
    return true;
  }
}
