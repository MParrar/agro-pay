import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

import authRouter from './routes/auth.js';
import workersRouter from './routes/workers.js';
import entriesRouter from './routes/entries.js';
import payrollRouter from './routes/payroll.js';
import { fruitTypesRouter, gardensRouter, groupsRouter } from './routes/catalogs.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Builds the Express app. Used by the standalone server (index.js) and the
 * Netlify Function (netlify/functions/api.js).
 * @param {object} [options]
 * @param {string} [options.staticDir] Built frontend to serve (standalone server only)
 */
export function createApp({ staticDir } = {}) {
  const app = express();

  if (process.env.CORS_ORIGIN) {
    app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
  }

  // Netlify may pass the function path instead of the original /api/... path
  app.use((req, res, next) => {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '/api');
    next();
  });

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

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
