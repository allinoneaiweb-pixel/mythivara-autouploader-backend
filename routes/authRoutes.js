import { Router } from 'express';
import { login, callback, refresh } from '../controllers/authController.js';
import requireTikTokSession from '../middleware/requireTikTokSession.js';
const router = Router();
router.get('/login', login);
router.get('/callback', callback);
router.post('/refresh', requireTikTokSession, refresh);
export default router;
