import process from 'node:process';
import { pool } from '../utils/database.js';
import { randomValue } from '../utils/crypto.js';
import { createSession } from '../models/tikTokSession.js';
import { saveTokens, getTokens } from '../models/tikTokUserTokens.js';
import { exchangeCode, getAuthorizationUrl, refreshAccessToken } from '../services/tiktokOAuthService.js';

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
export async function login(_req, res, next) {
  try {
    const state = randomValue(); const nonce = randomValue();
    await pool.query('INSERT INTO tiktok_oauth_states (state, browser_nonce, expires_at) VALUES ($1,$2,NOW() + INTERVAL \'10 minutes\')', [state, nonce]);
    res.cookie('tiktok_oauth_state', `${state}.${nonce}`, { ...cookieOptions, maxAge: 600000 });
    res.redirect(getAuthorizationUrl(state));
  } catch (error) { console.error('TikTok OAuth start failed', error); next(error); }
}
export async function callback(req, res, next) {
  try {
    const { code, state, error, error_description } = req.query;
    if (error || !code || !state) throw Object.assign(new Error(error_description || 'TikTok authorization was not completed.'), { status: 400 });
    const [cookieState, cookieNonce] = String(req.cookies.tiktok_oauth_state || '').split('.');
    const { rows } = await pool.query('DELETE FROM tiktok_oauth_states WHERE state=$1 AND browser_nonce=$2 AND expires_at > NOW() RETURNING state', [state, cookieNonce]);
    if (!rows[0] || cookieState !== state) throw Object.assign(new Error('Invalid or expired OAuth state.'), { status: 400 });
    const tokens = await exchangeCode(code);
    await saveTokens(tokens);
    const session = await createSession(tokens.open_id);
    res.clearCookie('tiktok_oauth_state', cookieOptions);
    res.cookie('tiktok_session', session, { ...cookieOptions, maxAge: 604800000 });
    console.log('TikTok OAuth succeeded', { openId: tokens.open_id });
    res.redirect(`${process.env.FRONTEND_URL}/FacelessCreator?tiktok=connected`);
  } catch (error) { console.error('TikTok OAuth failed', error); next(error); }
}
export async function refresh(req, res, next) {
  try {
    const current = await getTokens(req.openId);
    if (!current) throw Object.assign(new Error('TikTok account not found.'), { status: 404 });
    const refreshed = await refreshAccessToken(current.refresh_token);
    await saveTokens({ ...refreshed, refresh_token: refreshed.refresh_token || current.refresh_token, open_id: refreshed.open_id || req.openId });
    console.log('TikTok token refreshed', { openId: req.openId });
    res.json({ success: true });
  } catch (error) { console.error('TikTok token refresh failed', error); next(error); }
}