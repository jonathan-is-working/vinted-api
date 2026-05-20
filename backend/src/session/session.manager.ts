import { type Env } from "../config/env.js";
import { bootstrapVintedSessionWithPlaywright } from "./playwright.bootstrap.js";
import { type VintedSession } from "./session.types.js";

type RefreshReason = "startup" | "expired" | "upstream_unauthorized" | "manual";

export class VintedSessionManager {
  private session: VintedSession | null = null;
  private refreshPromise: Promise<VintedSession> | null = null;
  private lastRefreshAt = 0;
  private lastRefreshReason: RefreshReason | null = null;
  private lastErrorAt: number | null = null;
  private lastError: string | null = null;

  constructor(private readonly env: Env) {}

  getCurrentSession(): VintedSession | null {
    return this.session;
  }

  getMeta(): {
    mode: Env["VINTED_SESSION_MODE"];
    hasSession: boolean;
    createdAt: number | null;
    lastRefreshAt: number | null;
    lastRefreshReason: RefreshReason | null;
    lastErrorAt: number | null;
    lastError: string | null;
  } {
    return {
      mode: this.env.VINTED_SESSION_MODE,
      hasSession: !!this.session,
      createdAt: this.session?.createdAt ?? null,
      lastRefreshAt: this.lastRefreshAt || null,
      lastRefreshReason: this.lastRefreshReason,
      lastErrorAt: this.lastErrorAt,
      lastError: this.lastError
    };
  }

  invalidate(): void {
    this.session = null;
  }

  async getSession(opts?: { forceRefresh?: boolean; reason?: RefreshReason }): Promise<VintedSession> {
    const forceRefresh = opts?.forceRefresh ?? false;
    if (!forceRefresh && this.session) return this.session;

    return this.refresh(opts?.reason ?? "startup");
  }

  async refresh(reason: RefreshReason): Promise<VintedSession> {
    const now = Date.now();
    const inCooldown =
      now - this.lastRefreshAt < this.env.VINTED_SESSION_REFRESH_COOLDOWN_MS;

    if (this.refreshPromise) return this.refreshPromise;
    if (this.session && inCooldown) return this.session;

    this.refreshPromise = (async () => {
      this.lastRefreshAt = Date.now();
      this.lastRefreshReason = reason;
      this.lastErrorAt = null;
      this.lastError = null;

      if (this.env.VINTED_SESSION_MODE === "static") {
        const headers: Record<string, string> = {
          accept: "application/json",
          locale: this.env.VINTED_LOCALE,
          "user-agent": this.env.VINTED_USER_AGENT,
          "accept-language": this.env.VINTED_ACCEPT_LANGUAGE
        };
        if (this.env.VINTED_ANON_ID) headers["x-anon-id"] = this.env.VINTED_ANON_ID;
        if (this.env.VINTED_CSRF_TOKEN) headers["x-csrf-token"] = this.env.VINTED_CSRF_TOKEN;
        if (this.env.VINTED_COOKIE) headers["cookie"] = this.env.VINTED_COOKIE;
        const s = { createdAt: Date.now(), headers };
        this.session = s;
        return s;
      }

      try {
        const s = await bootstrapVintedSessionWithPlaywright(this.env);
        this.session = s;
        return s;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        this.lastErrorAt = Date.now();
        this.lastError = message;
        throw e;
      }
    })()
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}
