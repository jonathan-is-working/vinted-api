import { randomUUID } from "node:crypto";
import { type SearchService } from "../domain/search.service.js";
import { type SearchItem } from "../domain/search.types.js";
import { type Alert, type AlertEvent, type CreateAlertBody, type UpdateAlertBody } from "./alerts.types.js";
import { type NotificationsRepo } from "../notifications/notifications.repo.js";
import { type ItemNotifier } from "../notifications/item.notifier.js";

function makeId(): string {
  return randomUUID();
}

function now(): number {
  return Date.now();
}

export type AlertsStoreLike = {
  listAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | null>;
  putAlert(alert: Alert): Promise<void>;
  deleteAlert(id: string): Promise<void>;
  listEvents(alertId: string, since?: number): Promise<AlertEvent[]>;
  appendEvent(alertId: string, ev: AlertEvent): Promise<void>;
  isSeen(alertId: string, itemId: number): Promise<boolean>;
  markSeen(alertId: string, itemIds: number[]): Promise<void>;
};

export class AlertsService {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: AlertsStoreLike,
    private readonly searchService: SearchService,
    private readonly notifications?: NotificationsRepo,
    private readonly notifier?: ItemNotifier
  ) {}

  async listAlerts(): Promise<Alert[]> {
    return this.store.listAlerts();
  }

  async getAlert(id: string): Promise<Alert | null> {
    return this.store.getAlert(id);
  }

  async createAlert(input: CreateAlertBody): Promise<Alert> {
    const t = now();
    const alert: Alert = {
      id: makeId(),
      name: input.name,
      query: input.query,
      pollIntervalSeconds: input.pollIntervalSeconds,
      createdAt: t,
      updatedAt: t,
      lastRunAt: null,
      lastError: null,
      enabled: true
    };
    await this.store.putAlert(alert);
    this.startPolling(alert.id);
    return alert;
  }

  async updateAlert(id: string, input: UpdateAlertBody): Promise<Alert> {
    const cur = await this.store.getAlert(id);
    if (!cur) throw new Error("AlertNotFound");
    const t = now();
    const next: Alert = {
      ...cur,
      name: input.name ?? cur.name,
      query: input.query ?? cur.query,
      pollIntervalSeconds: input.pollIntervalSeconds ?? cur.pollIntervalSeconds,
      enabled: input.enabled ?? cur.enabled,
      updatedAt: t
    };
    await this.store.putAlert(next);
    // Ensure polling interval + query changes apply immediately.
    this.stopPolling(id);
    if (next.enabled) this.startPolling(id);
    return next;
  }

  async deleteAlert(id: string): Promise<void> {
    this.stopPolling(id);
    await this.store.deleteAlert(id);
  }

  async listEvents(alertId: string, since?: number): Promise<AlertEvent[]> {
    return this.store.listEvents(alertId, since);
  }

  async startAll(): Promise<void> {
    const alerts = await this.store.listAlerts();
    for (const alert of alerts) {
      if (alert.enabled) this.startPolling(alert.id);
    }
  }

  startPolling(alertId: string): void {
    if (this.timers.has(alertId)) return;
    const tick = async () => {
      await this.runOnce(alertId).catch(() => {});
    };

    // Run immediately, then interval.
    void tick();
    const timer = setInterval(tick, 60_000); // default until we load alert row (below)
    this.timers.set(alertId, timer);

    // Replace interval once we have the current poll interval.
    void (async () => {
      const alert = await this.store.getAlert(alertId);
      if (!alert) return;
      const cur = this.timers.get(alertId);
      if (!cur) return;
      clearInterval(cur);
      const next = setInterval(tick, alert.pollIntervalSeconds * 1000);
      this.timers.set(alertId, next);
    })();
  }

  stopPolling(alertId: string): void {
    const timer = this.timers.get(alertId);
    if (timer) clearInterval(timer);
    this.timers.delete(alertId);
  }

  async runOnce(alertId: string): Promise<{ newItems: SearchItem[] }> {
    const alert = await this.store.getAlert(alertId);
    if (!alert) throw new Error("AlertNotFound");
    if (!alert.enabled) return { newItems: [] };

    const t = now();
    await this.store.putAlert({ ...alert, lastRunAt: t, lastError: null, updatedAt: t });

    try {
      const res = await this.searchService.search({
        ...alert.query,
        page: 1,
        sort: "newest"
      }, { fillToPerPage: false });

      const fresh: SearchItem[] = [];

      // Fast path (Postgres): rely on notifications unique constraint for de-dupe.
      if (this.notifications) {
        for (const item of res.items) {
          const createdId = await this.notifications.createOrIgnore({
            sourceType: "alert",
            sourceKey: alertId,
            itemId: item.id,
            item
          });
          if (!createdId) continue;

          fresh.push(item);
          if (this.notifier && (await this.notifications.claimTelegramItem(item.id, createdId))) {
            try {
              void this.notifier
                .notifyNewItem({ sourceType: "alert", sourceKey: alertId, item })
                .then((messageId) => {
                  if (typeof messageId === "number") {
                    void this.notifications!.setTelegramMessageId(createdId, messageId);
                  }
                });
            } catch {
              // ignore notifier errors (alerts should keep running)
            }
          }
          await this.store.appendEvent(alertId, {
            id: makeId(),
            alertId,
            type: "item.new",
            createdAt: now(),
            payload: item
          });
        }
        return { newItems: fresh };
      }

      // Fallback path (memory store): use the store's seen tracking.
      for (const item of res.items) {
        if (!(await this.store.isSeen(alertId, item.id))) fresh.push(item);
      }
      await this.store.markSeen(alertId, res.items.map((i) => i.id));

      for (const item of fresh) {
        if (this.notifier) {
          try {
            void this.notifier.notifyNewItem({ sourceType: "alert", sourceKey: alertId, item });
          } catch {
            // ignore notifier errors
          }
        }
        await this.store.appendEvent(alertId, {
          id: makeId(),
          alertId,
          type: "item.new",
          createdAt: now(),
          payload: item
        });
      }

      return { newItems: fresh };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      const cur = await this.store.getAlert(alertId);
      if (cur) await this.store.putAlert({ ...cur, lastError: message, updatedAt: now() });
      await this.store.appendEvent(alertId, {
        id: makeId(),
        alertId,
        type: "alert.error",
        createdAt: now(),
        payload: { message }
      });
      throw e;
    }
  }

  async backfillFromApi(params: {
    alertId: string;
    maxPages: number;
    perPage: number;
    since?: number;
  }): Promise<{ scanned: number; created: number; sent: number; failed: number }> {
    const alert = await this.store.getAlert(params.alertId);
    if (!alert) throw new Error("AlertNotFound");

    if (!this.notifications) {
      throw new Error("BackfillRequiresPostgresNotifications");
    }

    const maxPages = Math.max(1, Math.min(200, Math.floor(params.maxPages)));
    const perPage = Math.max(1, Math.min(96, Math.floor(params.perPage)));

    let scanned = 0;
    let created = 0;
    let sent = 0;
    let failed = 0;

    for (let page = 1; page <= maxPages; page += 1) {
      const res = await this.searchService.search({
        ...alert.query,
        page,
        perPage,
        sort: "newest"
      }, { fillToPerPage: false });

      if (!res.items.length) break;

      for (const item of res.items) {
        // Results are ordered newest-first. Once Vinted reaches the requested
        // cutoff, later pages cannot contain relevant listings.
        if (params.since != null && item.createdAt != null && item.createdAt < params.since) {
          return { scanned, created, sent, failed };
        }
        scanned += 1;
        const createdId = await this.notifications.createOrIgnore({
          sourceType: "alert",
          sourceKey: params.alertId,
          itemId: item.id,
          item
        });
        if (!createdId) continue;
        created += 1;

        if (this.notifier && (await this.notifications.claimTelegramItem(item.id, createdId))) {
          const messageId = await this.notifier.notifyNewItem({
            sourceType: "alert",
            sourceKey: params.alertId,
            item
          });
          if (typeof messageId === "number") {
            await this.notifications.setTelegramMessageId(createdId, messageId);
            sent += 1;
          } else {
            failed += 1;
          }
        }
      }
    }

    return { scanned, created, sent, failed };
  }
}
