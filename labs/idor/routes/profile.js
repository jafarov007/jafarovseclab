const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

function validateRequest(userId, authToken, timestamp) {
  const db = getDb();
  const currentTimestamp = Math.floor(Date.now() / 10000);

  const timeDiff = Math.abs(currentTimestamp - timestamp);
  if (timeDiff > 6) {
    return { valid: false, reason: 'Token expired' };
  }

  const tokenRecord = db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(authToken);
  if (!tokenRecord) {
    return { valid: false, reason: 'Invalid authentication token' };
  }

  const tokenAge = Math.abs(currentTimestamp - tokenRecord.issued_timestamp);
  if (tokenAge > 6) {
    return { valid: false, reason: 'Token expired' };
  }

  return { valid: true };
}

router.get('/profile', (req, res) => {
  const { user_id, auth_token, timestamp } = req.query;

  if (!user_id || !auth_token || !timestamp) {
    return res.status(400).json({
      error: 'Missing parameters',
      required: ['user_id', 'auth_token', 'timestamp']
    });
  }

  const parsedUserId = parseInt(user_id, 10);
  const parsedTimestamp = parseInt(timestamp, 10);

  if (isNaN(parsedUserId) || isNaN(parsedTimestamp)) {
    return res.status(400).json({ error: 'Invalid parameter types' });
  }

  const validation = validateRequest(parsedUserId, auth_token, parsedTimestamp);
  if (!validation.valid) {
    return res.status(403).json({ error: validation.reason });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT user_id, email, full_name, phone, address, bio, avatar_url, role, created_at FROM users WHERE user_id = ?'
  ).get(parsedUserId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, data: user });
});

module.exports = router;
