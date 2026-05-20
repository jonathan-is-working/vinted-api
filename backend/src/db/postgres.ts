import { Pool } from "pg";

export type PgPool = Pool;

export function createPgPool(databaseUrl: string): PgPool {
  return new Pool({
    connectionString: databaseUrl,
    max: 10
  });
}

export async function migratePg(pool: PgPool): Promise<void> {
  // Idempotent DDL for PoC.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      query_json JSONB NOT NULL,
      poll_interval_seconds INTEGER NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      last_run_at BIGINT NULL,
      last_error TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_events (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      payload_json JSONB NOT NULL
    );

    CREATE INDEX IF NOT EXISTS alert_events_by_alert_created
      ON alert_events(alert_id, created_at);

    CREATE TABLE IF NOT EXISTS alert_seen_items (
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      item_id BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY(alert_id, item_id)
    );
  `);
}

