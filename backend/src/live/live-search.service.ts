import { randomUUID } from "node:crypto";
import { type SearchService } from "../domain/search.service.js";
import { type SearchItem, type SearchQuery } from "../domain/search.types.js";
import { type NotificationsRepo } from "../notifications/notifications.repo.js";
import { type ItemNotifier } from "../notifications/item.notifier.js";
import { type Env } from "../config/env.js";

type Subscriber = {
  id: string;
  send: (event: string, data: unknown) => void;
  closed: () => boolean;
};

type Feed = {
  key: string;
  query: SearchQuery;
  subscribers: Map<string, Subscriber>;
  seen: Set<number>;
  timer: NodeJS.Timeout | null;
  lastError: string | null;
};

function makeId(): string {
  return randomUUID();
}

function feedKey(q: SearchQuery): string {
  // Stable-ish key ignoring page (feeds are always page 1 newest).
  const {
    page: _page,
    sort: _sort,
    ...rest
  } = q;
  // Sort arrays for deterministic key
  const normalize = (v: any) => {
    if (Array.isArray(v)) return [...v].sort((a, b) => Number(a) - Number(b));
    return v;
  };
  const stable: any = {};
  for (const k of Object.keys(rest).sort()) stable[k] = normalize((rest as any)[k]);
  return JSON.stringify(stable);
}

export class LiveSearchService {
  private readonly feeds = new Map<string, Feed>();

  constructor(
    private readonly search: SearchService,
    private readonly notifications?: NotificationsRepo,
    private readonly notifier?: ItemNotifier,
    private readonly env?: Env
  ) {}

  subscribe(query: SearchQuery, sub: Omit<Subscriber, "id">): { unsubscribe: () => void } {
    const key = feedKey(query);
    let feed = this.feeds.get(key);
    if (!feed) {
      feed = {
        key,
        query,
        subscribers: new Map(),
        seen: new Set<number>(),
        timer: null,
        lastError: null
      };
      this.feeds.set(key, feed);
    }

    const id = makeId();
    const subscriber: Subscriber = { id, ...sub };
    feed.subscribers.set(id, subscriber);

    // Start poller if needed.
    if (!feed.timer) {
      const base = this.env?.LIVE_POLL_INTERVAL_MS ?? 5000;
      const jitter = Math.round(base * 0.2);
      const interval = base + Math.floor(Math.random() * (jitter * 2 + 1)) - jitter;
      feed.timer = setInterval(() => {
        void this.tick(feed!.key);
      }, Math.max(1000, interval));
      // run immediately
      void this.tick(feed.key);
    }

    const unsubscribe = () => {
      const cur = this.feeds.get(key);
      if (!cur) return;
      cur.subscribers.delete(id);
      if (cur.subscribers.size === 0) {
        if (cur.timer) clearInterval(cur.timer);
        this.feeds.delete(key);
      }
    };

    return { unsubscribe };
  }

  private async tick(key: string): Promise<void> {
    const feed = this.feeds.get(key);
    if (!feed) return;

    // Clean up closed subscribers.
    for (const [id, s] of feed.subscribers) {
      if (s.closed()) feed.subscribers.delete(id);
    }
    if (feed.subscribers.size === 0) {
      if (feed.timer) clearInterval(feed.timer);
      this.feeds.delete(key);
      return;
    }

    try {
      const res = await this.search.search({
        ...feed.query,
        page: 1,
        sort: "newest"
      }, { fillToPerPage: false });

      const fresh: SearchItem[] = [];
      for (const it of res.items) {
        if (!feed.seen.has(it.id)) fresh.push(it);
      }

      // Mark all seen
      for (const it of res.items) feed.seen.add(it.id);

      // Emit in reverse chronological order so UI prepends naturally.
      for (const it of fresh) {
        const createdId = await this.notifications?.createOrIgnore({
          sourceType: "query",
          sourceKey: feed.key,
          itemId: it.id,
          item: it
        });
        if (createdId && this.notifier) {
          try {
            void this.notifier
              .notifyNewItem({ sourceType: "query", sourceKey: feed.key, item: it })
              .then((messageId) => {
                if (typeof messageId === "number") {
                  void this.notifications!.setTelegramMessageId(createdId, messageId);
                }
              });
          } catch {
            // ignore notifier errors (live feed should keep running)
          }
        }
        for (const s of feed.subscribers.values()) {
          s.send("item.new", {
            id: makeId(),
            alertId: `live:${key}`,
            type: "item.new",
            createdAt: Date.now(),
            payload: it
          });
        }
      }

      feed.lastError = null;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      // avoid spamming the same error every tick
      if (feed.lastError !== message) {
        feed.lastError = message;
        for (const s of feed.subscribers.values()) {
          s.send("alert.error", {
            id: makeId(),
            alertId: `live:${key}`,
            type: "alert.error",
            createdAt: Date.now(),
            payload: { message }
          });
        }
      }
    }
  }
}
