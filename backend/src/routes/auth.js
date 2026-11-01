import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// Constant-time comparison (hashing equalizes buffer lengths)
function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Ingrese usuario y contraseña.' });
  }

  const validUser = safeEqual(username, process.env.ADMIN_USERNAME);
  const validPass = safeEqual(password, process.env.ADMIN_PASSWORD);

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const token = jwt.sign({ sub: 'admin', username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });

  res.json({ token, username });
});

export default router;
