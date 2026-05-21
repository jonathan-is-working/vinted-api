import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // Persistence
  ALERTS_STORE: z.enum(["memory", "postgres"]).default("postgres"),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/vinted"),
  VINTED_LOCALE: z.string().default("fr-FR"),
  // Browser-like headers to reduce upstream blocking (403).
  VINTED_USER_AGENT: z
    .string()
    .default(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
  VINTED_ACCEPT_LANGUAGE: z
    .string()
    .default("fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"),
  // Optional HTTP(S) proxy (recommended on VPS/datacenter IPs that Vinted blocks).
  // Example: http://user:pass@host:port
  VINTED_PROXY_SERVER: z.string().url().optional(),
  // If you provide these, the proxy will use them as a fallback.
  VINTED_ANON_ID: z.string().optional(),
  VINTED_CSRF_TOKEN: z.string().optional(),
  VINTED_COOKIE: z.string().optional(),
  VINTED_PER_PAGE: z.coerce.number().int().positive().max(200).default(96),
  VINTED_ORDER: z.string().default("relevance"),

  // Session bootstrapping via Playwright (recommended for reliability).
  VINTED_SESSION_MODE: z.enum(["playwright", "static"]).default("playwright"),
  VINTED_BOOTSTRAP_URL: z.string().url().default("https://www.vinted.fr/"),
  VINTED_BOOTSTRAP_SEARCH_TEXT: z.string().default("jeans"),
  VINTED_BOOTSTRAP_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  VINTED_SESSION_REFRESH_COOLDOWN_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000)
  ,
  // Upstream throttling (helps avoid Vinted rate limits)
  VINTED_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(1),
  VINTED_MIN_SPACING_MS: z.coerce.number().int().min(0).max(60_000).default(900),
  VINTED_COOLDOWN_ON_429_MS: z.coerce.number().int().min(0).max(10 * 60_000).default(30_000),
  LIVE_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).max(60_000).default(8000),

  // Optional: Telegram notifications for new items
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_ENABLE_COMMANDS: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((v) => (v == null ? false : v === "1" || v === "true")),
  TELEGRAM_CLEAR_LIMIT: z.coerce.number().int().min(1).max(200).default(50)
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  return EnvSchema.parse(process.env);
}
