import axios from "axios";
import { type NotificationsRepo } from "../../notifications/notifications.repo.js";
import { type TelegramNotifierConfig } from "./telegram.notifier.js";
import { type VintedSessionManager } from "../../session/session.manager.js";
import { type AlertsService } from "../../alerts/alerts.service.js";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat?: { id: number };
  };
};

export class TelegramCommandPoller {
  private offset = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly cfg: TelegramNotifierConfig,
    private readonly notifications: NotificationsRepo,
    private readonly opts?: {
      clearLimit?: number;
      sessions?: VintedSessionManager;
      alertsService?: AlertsService;
    }
  ) {}

  start(): void {
    if (this.timer) return;
    // If a webhook is configured, getUpdates will not return messages.
    // We rely on long-polling here, so ensure webhook is disabled.
    void (async () => {
      try {
        const http = axios.create({
          baseURL: `https://api.telegram.org/bot${this.cfg.botToken}`,
          timeout: 10_000
        });
        await http.post("/deleteWebhook", { drop_pending_updates: true });
      } catch {
        // ignore
      }
    })();
    this.timer = setInterval(() => {
      void this.tick().catch(() => {});
    }, 1500);
    void this.tick().catch(() => {});
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const http = axios.create({
      baseURL: `https://api.telegram.org/bot${this.cfg.botToken}`,
      timeout: 10_000
    });

    const res = await http.get("/getUpdates", {
      params: {
        offset: this.offset || undefined,
        timeout: 0
      }
    });

    const updates = (res?.data?.result ?? []) as TelegramUpdate[];
    for (const u of updates) {
      if (typeof u.update_id === "number") this.offset = Math.max(this.offset, u.update_id + 1);
      const msg = u.message;
      if (!msg?.text) continue;
      const chatId = msg.chat?.id;
      if (String(chatId) !== String(this.cfg.chatId)) continue;

      const text = msg.text.trim();
      const send = async (t: string) => {
        try {
          await http.post("/sendMessage", { chat_id: this.cfg.chatId, text: t });
        } catch {
          // ignore
        }
      };

      if (text === "/help") {
        await send(
          [
            "Commands:",
            "/help — show this help",
            "/ping — bot connectivity check",
            "/status — upstream session status",
            "/alerts — list saved alerts",
            "/clear [n] — delete last n bot messages (default limit)"
          ].join("\n")
        );
        continue;
      }

      if (text === "/ping") {
        await send("pong");
        continue;
      }

      if (text === "/status") {
        if (!this.opts?.sessions) {
          await send("status: unavailable (sessions not wired)");
          continue;
        }
        const meta = this.opts.sessions.getMeta();
        const last = meta.lastRefreshAt ? new Date(meta.lastRefreshAt).toISOString() : "—";
        const err = meta.lastError ? `\nlastError: ${meta.lastError}` : "";
        await send(
          `mode: ${meta.mode}\nhasSession: ${meta.hasSession}\nlastRefresh: ${last}\nreason: ${meta.lastRefreshReason ?? "—"}${err}`
        );
        continue;
      }

      if (text === "/alerts") {
        if (!this.opts?.alertsService) {
          await send("alerts: unavailable (alerts not wired)");
          continue;
        }
        const alerts = await this.opts.alertsService.listAlerts();
        if (!alerts.length) {
          await send("No saved alerts.");
          continue;
        }
        const lines = alerts
          .slice(0, 30)
          .map((a) => `- ${a.name} (${a.id.slice(0, 8)}) every ${a.pollIntervalSeconds}s`);
        await send(["Saved alerts:", ...lines].join("\n"));
        continue;
      }

      if (text === "/clear" || text.startsWith("/clear ")) {
        const parts = text.split(/\s+/);
        const requested = parts[1] ? Number(parts[1]) : undefined;
        const limit =
          Number.isFinite(requested) && requested! > 0
            ? Math.min(200, Math.max(1, Math.floor(requested!)))
            : this.opts?.clearLimit ?? 50;

        const messageIds = await this.notifications.listTelegramMessageIds(limit);
        for (const mid of messageIds) {
          try {
            await http.post("/deleteMessage", { chat_id: this.cfg.chatId, message_id: mid });
          } catch {
            // ignore (e.g. too old / already deleted)
          }
        }
        await this.notifications.clearTelegramMessageIds(messageIds);

        // Acknowledge
        await send(`Cleared ${messageIds.length} bot messages.`);
      }
    }
  }
}
