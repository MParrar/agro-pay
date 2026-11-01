import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRouter from './routes/auth.js';
import workersRouter from './routes/workers.js';
import entriesRouter from './routes/entries.js';
import payrollRouter from './routes/payroll.js';
import { fruitTypesRouter, gardensRouter, groupsRouter } from './routes/catalogs.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const REQUIRED_ENV = ['DATABASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
}
app.use(express.json());

// Public routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', authRouter);

// Protected routes
app.use('/api', requireAuth);
app.use('/api/fruit-types', fruitTypesRouter);
app.use('/api/gardens', gardensRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// In production, serve the built frontend from the same origin
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Agro-Pay API listening on http://localhost:${port}`);
});
