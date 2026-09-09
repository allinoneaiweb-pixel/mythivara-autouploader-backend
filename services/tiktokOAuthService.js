import process from 'node:process';

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const credentials = () => ({ client_key: process.env.TIKTOK_CLIENT_KEY, client_secret: process.env.TIKTOK_CLIENT_SECRET, redirect_uri: process.env.TIKTOK_REDIRECT_URI });
async function requestToken(values) {
  const body = new URLSearchParams({ ...credentials(), ...values });
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json();
  if (!response.ok || data.error?.code || !data.access_token || !data.open_id) throw new Error(data.error?.message || data.message || 'TikTok token exchange failed.');
  return data;
}
export const exchangeCode = (code) => requestToken({ code, grant_type: 'authorization_code' });
export const refreshAccessToken = (refresh_token) => requestToken({ refresh_token, grant_type: 'refresh_token' });
export function getAuthorizationUrl(state) {
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.search = new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY, response_type: 'code', scope: 'user.info.basic,video.upload,video.publish', redirect_uri: process.env.TIKTOK_REDIRECT_URI, state });
  return url.toString();
}
