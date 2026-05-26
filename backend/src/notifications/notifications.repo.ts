import { randomUUID } from "node:crypto";
import { type PgPool } from "../db/postgres.js";

export type NotificationRow = {
  id: string;
  sourceType: "alert" | "query";
  sourceKey: string;
  itemId: number;
  item: unknown;
  createdAt: number;
  readAt: number | null;
};

export class NotificationsRepo {
  constructor(private readonly pool: PgPool) {}

  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        source_key TEXT NOT NULL,
        item_id BIGINT NOT NULL,
        item_json JSONB NOT NULL,
        created_at BIGINT NOT NULL,
        read_at BIGINT NULL,
        telegram_message_id BIGINT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_source_item
        ON notifications(source_type, source_key, item_id);

      CREATE INDEX IF NOT EXISTS notifications_created_at
        ON notifications(created_at DESC);

      CREATE TABLE IF NOT EXISTS telegram_notified_items (
        item_id BIGINT PRIMARY KEY,
        notification_id TEXT NULL REFERENCES notifications(id) ON DELETE SET NULL,
        created_at BIGINT NOT NULL
      );

      -- Back-compat: older installs won't have the telegram column
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT NULL;
    `);
  }

  async createOrIgnore(input: {
    sourceType: "alert" | "query";
    sourceKey: string;
    itemId: number;
    item: unknown;
    createdAt?: number;
  }): Promise<string | null> {
    const id = randomUUID();
    const createdAt = input.createdAt ?? Date.now();
    const res = await this.pool.query(
      `INSERT INTO notifications (id, source_type, source_key, item_id, item_json, created_at, read_at, telegram_message_id)
       VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL)
       ON CONFLICT (source_type, source_key, item_id) DO NOTHING`,
      [id, input.sourceType, input.sourceKey, input.itemId, input.item, createdAt]
    );
    return (res.rowCount ?? 0) > 0 ? id : null;
  }

  async list(params: { limit: number; cursor?: number }): Promise<{
    items: NotificationRow[];
    nextCursor: number | null;
  }> {
    const limit = Math.max(1, Math.min(200, params.limit));
    const cursor = typeof params.cursor === "number" ? params.cursor : undefined;
    const res = await this.pool.query(
      cursor
        ? `SELECT id, source_type, source_key, item_id, item_json, created_at, read_at
           FROM notifications
           WHERE created_at < $1
           ORDER BY created_at DESC
           LIMIT $2`
        : `SELECT id, source_type, source_key, item_id, item_json, created_at, read_at
           FROM notifications
           ORDER BY created_at DESC
           LIMIT $1`,
      cursor ? [cursor, limit] : [limit]
    );

    const rows = res.rows as any[];
    const items: NotificationRow[] = rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceKey: r.source_key,
      itemId: Number(r.item_id),
      item: r.item_json,
      createdAt: Number(r.created_at),
      readAt: r.read_at == null ? null : Number(r.read_at)
    }));
    const nextCursor = items.length ? items[items.length - 1].createdAt : null;
    return { items, nextCursor };
  }

  async listAfter(params: {
    limit: number;
    since?: number;
    sourceType?: "alert" | "query";
    sourceKeys?: string[];
  }): Promise<{ items: NotificationRow[]; nextCursor: number | null }> {
    const limit = Math.max(1, Math.min(500, params.limit));
    const since = typeof params.since === "number" ? params.since : 0;
    const sourceType = params.sourceType;
    const sourceKeys = params.sourceKeys?.filter(Boolean);

    const where: string[] = [`created_at > $1`];
    const args: any[] = [since];
    let idx = 2;

    if (sourceType) {
      where.push(`source_type = $${idx++}`);
      args.push(sourceType);
    }
    if (sourceKeys && sourceKeys.length) {
      where.push(`source_key = ANY($${idx++}::text[])`);
      args.push(sourceKeys);
    }

    const res = await this.pool.query(
      `SELECT id, source_type, source_key, item_id, item_json, created_at, read_at
       FROM notifications
       WHERE ${where.join(" AND ")}
       ORDER BY created_at ASC
       LIMIT $${idx}`,
      [...args, limit]
    );

    const rows = res.rows as any[];
    const items: NotificationRow[] = rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceKey: r.source_key,
      itemId: Number(r.item_id),
      item: r.item_json,
      createdAt: Number(r.created_at),
      readAt: r.read_at == null ? null : Number(r.read_at)
    }));
    const nextCursor = items.length ? items[items.length - 1].createdAt : null;
    return { items, nextCursor };
  }

  async deleteOne(id: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM notifications WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteAll(): Promise<number> {
    const res = await this.pool.query(`DELETE FROM notifications`);
    return Number(res.rowCount ?? 0);
  }

  async setTelegramMessageId(notificationId: string, messageId: number): Promise<void> {
    await this.pool.query(
      `UPDATE notifications SET telegram_message_id = $2 WHERE id = $1`,
      [notificationId, messageId]
    );
  }

  async claimTelegramItem(itemId: number, notificationId?: string): Promise<boolean> {
    const res = await this.pool.query(
      `INSERT INTO telegram_notified_items (item_id, notification_id, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (item_id) DO NOTHING`,
      [itemId, notificationId ?? null, Date.now()]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async listTelegramMessageIds(limit: number): Promise<number[]> {
    const n = Math.max(1, Math.min(200, limit));
    const res = await this.pool.query(
      `SELECT telegram_message_id
       FROM notifications
       WHERE telegram_message_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [n]
    );
    return (res.rows as any[])
      .map((r) => Number(r.telegram_message_id))
      .filter((v) => Number.isFinite(v) && v > 0);
  }

  async clearTelegramMessageIds(messageIds: number[]): Promise<void> {
    if (!messageIds.length) return;
    await this.pool.query(
      `UPDATE notifications SET telegram_message_id = NULL WHERE telegram_message_id = ANY($1::bigint[])`,
      [messageIds]
    );
  }
}
