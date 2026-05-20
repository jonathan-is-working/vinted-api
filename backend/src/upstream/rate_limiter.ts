export class RateLimiter {
  private nextAllowedAt = 0;
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(
    private readonly opts: {
      maxConcurrent: number;
      minSpacingMs: number;
      // Prevent unbounded backlog during cooldown / spikes.
      maxQueue: number;
    }
  ) {}

  setCooldown(ms: number): void {
    const until = Date.now() + Math.max(0, ms);
    if (until > this.nextAllowedAt) this.nextAllowedAt = until;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tryStart = () => {
        const now = Date.now();
        const waitForCooldown = Math.max(0, this.nextAllowedAt - now);
        if (this.running >= this.opts.maxConcurrent || waitForCooldown > 0) {
          // Coalesce pressure: cap the queue size to avoid huge bursts later.
          if (this.queue.length >= this.opts.maxQueue) {
            reject(new Error("RateLimiterQueueFull"));
            return;
          }
          this.queue.push(tryStart);
          if (waitForCooldown > 0) setTimeout(() => this.drain(), waitForCooldown);
          return;
        }

        // Start now
        this.running++;
        this.nextAllowedAt = Date.now() + this.opts.minSpacingMs;
        resolve();
      };

      tryStart();
    });
  }

  private release(): void {
    this.running = Math.max(0, this.running - 1);
    this.drain();
  }

  private drain(): void {
    if (this.running >= this.opts.maxConcurrent) return;
    const now = Date.now();
    const waitForCooldown = Math.max(0, this.nextAllowedAt - now);
    if (waitForCooldown > 0) {
      setTimeout(() => this.drain(), waitForCooldown);
      return;
    }
    const next = this.queue.shift();
    if (!next) return;
    next();
  }
}
