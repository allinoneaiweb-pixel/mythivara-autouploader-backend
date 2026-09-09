import { Router } from 'express';
import multer from 'multer';
import { upload, publish } from '../controllers/tiktokController.js';
import requireTikTokSession from '../middleware/requireTikTokSession.js';
const router = Router();
const video = multer({ dest: 'uploads/', limits: { fileSize: 500 * 1024 * 1024 }, fileFilter: (_req, file, done) => done(null, file.mimetype.startsWith('video/')) });
router.post('/upload', requireTikTokSession, video.single('video'), upload);
router.post('/publish', requireTikTokSession, video.single('video'), publish);
export default router;
