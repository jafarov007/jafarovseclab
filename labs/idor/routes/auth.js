const express = require('express');
const crypto = require('crypto');
const { getDb, hashPassword } = require('../db/init');

const router = express.Router();

const TOKEN_SECRET = 'k8x#mP2$vL9nQ7wR';
const JWT_SECRET = 'xK9pL2mN4vR7wQ1s';

function generateAuthToken(userId) {
  const timestamp = Math.floor(Date.now() / 10000);
  const raw = `${userId}-${TOKEN_SECRET}-${timestamp}-${crypto.randomBytes(8).toString('hex')}`;
  const token = crypto.createHash('sha256').update(raw).digest('hex');
  return { token, timestamp };
}

function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  return `${headerB64}.${payloadB64}.${signature}`;
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Both email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordHash = hashPassword(password, user.password_salt);
  if (passwordHash !== user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { token, timestamp } = generateAuthToken(user.user_id);

  db.prepare('INSERT INTO auth_tokens (user_id, token, issued_timestamp) VALUES (?, ?, ?)')
    .run(user.user_id, token, timestamp);

  const jwt = signJwt({
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  });

  res.json({
    success: true,
    data: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      auth_token: token,
      timestamp: timestamp,
      jwt: jwt,
      expires_in: '60 seconds'
    }
  });
});

router.post('/logout', (req, res) => {
  const { auth_token } = req.body;
  if (auth_token) {
    const db = getDb();
    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(auth_token);
  }
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
