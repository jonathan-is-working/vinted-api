import {
  chromium,
  type Browser,
  type BrowserContext,
  type Request
} from "playwright";
import { type Env } from "../config/env.js";
import { type VintedSession } from "./session.types.js";

type Captured = {
  cookieHeader?: string;
  anonId?: string;
  csrfToken?: string;
  authorization?: string;
  userAgent?: string;
  acceptLanguage?: string;
  referer?: string;
};

function toCookieHeader(cookies: Array<{ name: string; value: string }>): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function pickHeader(headers: Record<string, string>, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

export async function bootstrapVintedSessionWithPlaywright(
  env: Env
): Promise<VintedSession> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  const captured: Captured = {};

  try {
    browser = await chromium.launch({
      headless: true
    });
    context = await browser.newContext({
      locale: env.VINTED_LOCALE
    });

    const page = await context.newPage();

    // Capture headers from a real page-originated request to the catalog endpoint.
    page.on("request", (req: Request) => {
      if (!req.url().includes("/api/v2/catalog/items")) return;
      const headers = req.headers();
      captured.anonId ||= pickHeader(headers, "x-anon-id");
      captured.csrfToken ||= pickHeader(headers, "x-csrf-token");
      captured.authorization ||= pickHeader(headers, "authorization");
      captured.userAgent ||= pickHeader(headers, "user-agent");
      captured.acceptLanguage ||= pickHeader(headers, "accept-language");
      captured.referer ||= pickHeader(headers, "referer");
    });

    await page.goto(env.VINTED_BOOTSTRAP_URL, {
      waitUntil: "domcontentloaded",
      timeout: env.VINTED_BOOTSTRAP_TIMEOUT_MS
    });

    // Trigger the upstream request from within the browser context so cookies/headers
    // reflect a real session.
    const searchUrl = new URL("/api/v2/catalog/items", env.VINTED_BOOTSTRAP_URL);
    searchUrl.searchParams.set("search_text", env.VINTED_BOOTSTRAP_SEARCH_TEXT);
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("per_page", "1");
    searchUrl.searchParams.set("order", env.VINTED_ORDER);

    await page.evaluate(async (url: string) => {
      await fetch(url, { credentials: "include" });
    }, searchUrl.toString());

    const cookies = await context.cookies();
    const cookieHeader = toCookieHeader(cookies);
    captured.cookieHeader = cookieHeader || undefined;

    const headers: Record<string, string> = {
      accept: "application/json",
      locale: env.VINTED_LOCALE,
      "user-agent": captured.userAgent ?? env.VINTED_USER_AGENT,
      "accept-language": captured.acceptLanguage ?? env.VINTED_ACCEPT_LANGUAGE
    };
    if (captured.referer) headers["referer"] = captured.referer;
    if (captured.anonId) headers["x-anon-id"] = captured.anonId;
    if (captured.csrfToken) headers["x-csrf-token"] = captured.csrfToken;
    if (captured.authorization) headers["authorization"] = captured.authorization;
    if (captured.cookieHeader) headers["cookie"] = captured.cookieHeader;

    return {
      createdAt: Date.now(),
      headers
    };
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}
