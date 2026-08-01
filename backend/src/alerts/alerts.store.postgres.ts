import { type PgPool } from "../db/postgres.js";
import { type Alert, type AlertEvent } from "./alerts.types.js";

export class PostgresAlertsStore {
  constructor(public readonly pool: PgPool) {}

  async listAlerts(): Promise<Alert[]> {
    const res = await this.pool.query(
      `SELECT id, name, query_json, poll_interval_seconds, created_at, updated_at, last_run_at, last_error, enabled
       FROM alerts
       ORDER BY created_at DESC`
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      query: r.query_json,
      pollIntervalSeconds: r.poll_interval_seconds,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      lastRunAt: r.last_run_at == null ? null : Number(r.last_run_at),
      lastError: r.last_error ?? null,
      enabled: r.enabled !== false
    }));
  }

  async getAlert(id: string): Promise<Alert | null> {
    const res = await this.pool.query(
      `SELECT id, name, query_json, poll_interval_seconds, created_at, updated_at, last_run_at, last_error, enabled
       FROM alerts
       WHERE id = $1`,
      [id]
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      query: r.query_json,
      pollIntervalSeconds: r.poll_interval_seconds,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      lastRunAt: r.last_run_at == null ? null : Number(r.last_run_at),
      lastError: r.last_error ?? null,
      enabled: r.enabled !== false
    };
  }

  async putAlert(alert: Alert): Promise<void> {
    await this.pool.query(
      `INSERT INTO alerts (id, name, query_json, poll_interval_seconds, created_at, updated_at, last_run_at, last_error, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         query_json = EXCLUDED.query_json,
         poll_interval_seconds = EXCLUDED.poll_interval_seconds,
         created_at = EXCLUDED.created_at,
         updated_at = EXCLUDED.updated_at,
         last_run_at = EXCLUDED.last_run_at,
         last_error = EXCLUDED.last_error,
         enabled = EXCLUDED.enabled`,
      [
        alert.id,
        alert.name,
        alert.query,
        alert.pollIntervalSeconds,
        alert.createdAt,
        alert.updatedAt,
        alert.lastRunAt,
        alert.lastError,
        alert.enabled
      ]
    );
  }

  async deleteAlert(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM alerts WHERE id = $1`, [id]);
  }

  async markSeen(alertId: string, itemIds: number[]): Promise<void> {
    if (!itemIds.length) return;
    const t = Date.now();
    // Bulk insert with ON CONFLICT DO NOTHING.
    const values: any[] = [];
    const rowsSql: string[] = [];
    itemIds.forEach((itemId, idx) => {
      const base = idx * 3;
      rowsSql.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(alertId, itemId, t);
    });
    await this.pool.query(
      `INSERT INTO alert_seen_items (alert_id, item_id, created_at)
       VALUES ${rowsSql.join(",")}
       ON CONFLICT DO NOTHING`,
      values
    );
  }

  async isSeen(alertId: string, itemId: number): Promise<boolean> {
    const res = await this.pool.query(
      `SELECT 1 FROM alert_seen_items WHERE alert_id = $1 AND item_id = $2 LIMIT 1`,
      [alertId, itemId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async appendEvent(alertId: string, ev: AlertEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO alert_events (id, alert_id, type, created_at, payload_json)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO NOTHING`,
      [ev.id, alertId, ev.type, ev.createdAt, ev.payload]
    );

    // Keep 500 latest per alert (PoC).
    await this.pool.query(
      `DELETE FROM alert_events
       WHERE alert_id = $1
         AND id NOT IN (
           SELECT id FROM alert_events
           WHERE alert_id = $1
           ORDER BY created_at DESC
           LIMIT 500
         )`,
      [alertId]
    );
  }

  async listEvents(alertId: string, since?: number): Promise<AlertEvent[]> {
    const res = await this.pool.query(
      since
        ? `SELECT id, alert_id, type, created_at, payload_json
           FROM alert_events
           WHERE alert_id = $1 AND created_at > $2
           ORDER BY created_at ASC`
        : `SELECT id, alert_id, type, created_at, payload_json
           FROM alert_events
           WHERE alert_id = $1
           ORDER BY created_at ASC`,
      since ? [alertId, since] : [alertId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      alertId: r.alert_id,
      type: r.type,
      createdAt: Number(r.created_at),
      payload: r.payload_json
    }));
  }
}
