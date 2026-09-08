import { pool } from '../utils/database.js';
import { hash, randomValue } from '../utils/crypto.js';
export async function createSession(openId) {
  const token = randomValue();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query('INSERT INTO tiktok_sessions (id, open_id, expires_at) VALUES ($1,$2,$3)', [hash(token), openId, expiresAt]);
  return token;
}
export async function getSession(token) {
  if (!token) return null;
  const { rows } = await pool.query('SELECT open_id FROM tiktok_sessions WHERE id=$1 AND expires_at > NOW()', [hash(token)]);
  return rows[0] || null;
}