/**
 * Client-Side Sliding Window Rate Limiter
 * Pure TypeScript implementation for UI debouncing and abuse prevention in the browser.
 * Zero Node.js or server-side dependencies.
 */

export class SlidingWindowRateLimiter {
  private windowSizeMs: number;
  private maxRequests: number;
  private requests: number[];

  constructor(windowSizeMs: number, maxRequests: number) {
    this.windowSizeMs = windowSizeMs;
    this.maxRequests = maxRequests;
    this.requests = [];
  }

  public isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowSizeMs);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  public getStats() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowSizeMs);
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowSizeMs: this.windowSizeMs,
      blocked: this.requests.length >= this.maxRequests,
    };
  }
}

// Global client instance for saving simulations (max 5 every 10 seconds)
export const saveRateLimiter = new SlidingWindowRateLimiter(10000, 5);
