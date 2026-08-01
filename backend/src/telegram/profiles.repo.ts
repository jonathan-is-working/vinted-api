import { randomUUID } from "node:crypto";
import { type PgPool } from "../db/postgres.js";
import { type CreateTelegramProfile, type TelegramProfile } from "./profiles.types.js";

export class TelegramProfilesRepo {
  constructor(private readonly pool: PgPool) {}

  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bot_token TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS telegram_profile_id TEXT NULL;
      DO $$ BEGIN
        ALTER TABLE alerts
          ADD CONSTRAINT alerts_telegram_profile_fk
          FOREIGN KEY (telegram_profile_id) REFERENCES telegram_profiles(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
      CREATE INDEX IF NOT EXISTS alerts_telegram_profile_idx ON alerts(telegram_profile_id);
    `);
  }

  async list(): Promise<TelegramProfile[]> {
    const res = await this.pool.query(
      `SELECT id, name, bot_token, chat_id, created_at, updated_at
       FROM telegram_profiles ORDER BY created_at DESC`
    );
    return res.rows.map((row: any) => this.map(row));
  }

  async get(id: string): Promise<TelegramProfile | null> {
    const res = await this.pool.query(
      `SELECT id, name, bot_token, chat_id, created_at, updated_at
       FROM telegram_profiles WHERE id = $1`,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async create(input: CreateTelegramProfile): Promise<TelegramProfile> {
    const now = Date.now();
    const profile: TelegramProfile = {
      id: randomUUID(),
      name: input.name,
      botToken: input.botToken,
      chatId: input.chatId,
      createdAt: now,
      updatedAt: now
    };
    await this.pool.query(
      `INSERT INTO telegram_profiles (id, name, bot_token, chat_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [profile.id, profile.name, profile.botToken, profile.chatId, profile.createdAt, profile.updatedAt]
    );
    return profile;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM telegram_profiles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private map(row: any): TelegramProfile {
    return {
      id: row.id,
      name: row.name,
      botToken: row.bot_token,
      chatId: row.chat_id,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    };
  }
}
