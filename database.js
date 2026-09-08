import process from 'node:process';
import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiktok_user_tokens (
      open_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT NOT NULL,
      expires_in INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL, scope TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tiktok_oauth_states (
      state TEXT PRIMARY KEY, browser_nonce TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tiktok_sessions (
      id TEXT PRIMARY KEY, open_id TEXT NOT NULL REFERENCES tiktok_user_tokens(open_id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);
}