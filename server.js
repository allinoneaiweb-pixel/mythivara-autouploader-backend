import process from 'node:process';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ensureSchema } from './utils/database.js';
import authRoutes from './routes/authRoutes.js';
import tiktokRoutes from './routes/tiktokRoutes.js';

const app = express();
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') return res.status(400).json({ error: 'HTTPS is required.' });
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth/tiktok', authRoutes);
app.use('/tiktok', tiktokRoutes);
app.use((error, _req, res, _next) => {
  console.error('Request failed', error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error.' });
});

ensureSchema().then(() => app.listen(process.env.PORT || 3000, () => console.log('Mythivara AutoUploader is running.'))).catch((error) => {
  console.error('Database setup failed', error);
  process.exit(1);
});