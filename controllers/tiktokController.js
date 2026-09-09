import fs from 'fs/promises';
import { getTokens, saveTokens } from '../models/tikTokUserTokens.js';
import { refreshAccessToken } from '../services/tiktokOAuthService.js';
import { uploadDraft, publishVideo } from '../services/tiktokPostingService.js';

async function accessToken(openId) {
  const tokens = await getTokens(openId);
  if (!tokens) throw Object.assign(new Error('TikTok account not found.'), { status: 404 });
  if (new Date(tokens.expires_at).getTime() > Date.now() + 60000) return tokens.access_token;
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await saveTokens({ ...refreshed, refresh_token: refreshed.refresh_token || tokens.refresh_token, open_id: refreshed.open_id || openId });
  return refreshed.access_token;
}
async function removeUpload(file) { if (file?.path) await fs.unlink(file.path).catch(() => {}); }
export async function upload(req, res, next) {
  try {
    if (!req.file) throw Object.assign(new Error('A video file is required.'), { status: 400 });
    const publishId = await uploadDraft(await accessToken(req.openId), req.file);
    console.log('TikTok draft upload succeeded', { openId: req.openId, publishId });
    res.status(201).json({ publish_id: publishId, status: 'sent_to_tiktok_inbox' });
  } catch (error) { console.error('TikTok draft upload failed', error); next(error); }
  finally { await removeUpload(req.file); }
}
export async function publish(req, res, next) {
  try {
    if (!req.file) throw Object.assign(new Error('A video file is required for TikTok direct posting.'), { status: 400 });
    const { caption, privacy_setting = 'SELF_ONLY' } = req.body;
    const allowed = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'];
    if (!caption?.trim() || !allowed.includes(privacy_setting)) throw Object.assign(new Error('Provide a caption and supported privacy_setting.'), { status: 400 });
    const publishId = await publishVideo(await accessToken(req.openId), req.file, { title: caption.trim(), privacy_level: privacy_setting, disable_duet: false, disable_comment: false, disable_stitch: false });
    console.log('TikTok publish succeeded', { openId: req.openId, publishId });
    res.status(201).json({ publish_id: publishId, status: 'processing' });
  } catch (error) { console.error('TikTok publish failed', error); next(error); }
  finally { await removeUpload(req.file); }
}
