import express from 'express';
import cors from 'cors';
import { waitForDb } from './db.js';
import { setMockMode } from './repo.js';
import { ensureSeed } from './auth.js';
import { ensureAuditTable } from './audit.js';
import { UPLOAD_ROOT } from './uploads.js';
import carsRouter from './routes/cars.js';
import metaRouter from './routes/meta.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.set('trust proxy', true); // behind nginx -> honour X-Forwarded-For / X-Real-IP
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', mode: process.env._MODE || 'db' }));
app.use('/api/cars', carsRouter);
app.use('/api/meta', metaRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
});

waitForDb(8, 2000)
  .then(async () => {
    process.env._MODE = 'db';
    await ensureSeed();
    await ensureAuditTable();
    app.listen(PORT, () => console.log(`API listening on port ${PORT} (mode: MySQL)`));
  })
  .catch(() => {
    // Dev fallback: serve the in-memory dataset so the app still works without MySQL.
    setMockMode(true);
    process.env._MODE = 'mock';
    console.warn('MySQL not reachable -> using in-memory mock data (dev fallback).');
    app.listen(PORT, () => console.log(`API listening on port ${PORT} (mode: MOCK)`));
  });
