import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const REQUIRED_ENV = ['DATABASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// In production, serve the built frontend from the same origin
const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
const app = createApp({ staticDir });

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Agro-Pay API listening on http://localhost:${port}`);
});
