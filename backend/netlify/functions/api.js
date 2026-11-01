import serverless from 'serverless-http';
import { createApp } from '../../src/app.js';

// Env vars come from the Netlify site settings (no .env file in production)
export const handler = serverless(createApp(), {
  // serverless-http pre-fills req.body with a raw Buffer, which makes
  // express.json() skip the request; parse it here instead.
  request(req) {
    if (!Buffer.isBuffer(req.body)) return;
    const text = req.body.toString('utf8');
    try {
      req.body = text ? JSON.parse(text) : {};
    } catch {
      // Malformed JSON: routes then answer with their Spanish validation errors
      req.body = {};
    }
  },
});
