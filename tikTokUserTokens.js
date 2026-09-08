import { pool } from '../utils/database.js';
import { encrypt, decrypt } from '../utils/crypto.js';

export async function saveTokens(tokens) {
  const expiresAt = new Date(Date.now() + Number(tokens.expires_in) * 1000);
  await pool.query(`INSERT INTO tiktok_user_tokens (open_id, access_token, refresh_token, expires_in, expires_at, scope)
    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (open_id) DO UPDATE SET access_token=$2, refresh_token=$3, expires_in=$4, expires_at=$5, scope=$6, updated_at=NOW()`,
  [tokens.open_id, encrypt(tokens.access_token), encrypt(tokens.refresh_token), Number(tokens.expires_in), expiresAt, tokens.scope || '']);
  return { openId: tokens.open_id, expiresAt };
}
export async function getTokens(openId) {
  const { rows } = await pool.query('SELECT * FROM tiktok_user_tokens WHERE open_id=$1', [openId]);
  if (!rows[0]) return null;
  return { ...rows[0], access_token: decrypt(rows[0].access_token), refresh_token: decrypt(rows[0].refresh_token) };
}