const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/init');

const router = express.Router();

const JWT_SECRET = 'xK9pL2mN4vR7wQ1s';

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const headerStr = base64UrlDecode(parts[0]);
  const payloadStr = base64UrlDecode(parts[1]);
  const header = JSON.parse(headerStr);
  const payload = JSON.parse(payloadStr);

  // Standard signature verification for HS256
  if (header.alg === 'HS256') {
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');

    if (parts[2] !== expectedSig) {
      return { valid: false, error: 'Invalid signature' };
    }
  }
  // BUG: No else clause — if alg is anything other than HS256 (including "none"),
  // the signature check is simply skipped. Developer only implemented the HS256 case
  // and forgot to reject unknown algorithms.

  return { valid: true, payload };
}

router.get('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const result = verifyToken(token);

    if (!result.valid) {
      return res.status(403).json({ error: result.error });
    }

    const userId = parseInt(result.payload.user_id, 10);
    const db = getDb();
    const user = db.prepare(
      'SELECT user_id, email, full_name, phone, address, bio, role FROM users WHERE user_id = ?'
    ).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    return res.status(400).json({ error: 'Token processing failed' });
  }
});

module.exports = router;
