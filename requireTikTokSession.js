import { getSession } from '../models/tikTokSession.js';
export default async function requireTikTokSession(req, res, next) {
  try {
    const session = await getSession(req.cookies.tiktok_session);
    if (!session) return res.status(401).json({ error: 'Connect your TikTok account first.' });
    req.openId = session.open_id;
    next();
  } catch (error) { next(error); }
}