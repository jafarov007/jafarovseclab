const express = require('express');
const crypto = require('crypto');
const { getDb, hashPassword } = require('../db/init');

const router = express.Router();

const resetTokens = [];

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const db = getDb();
  const user = db.prepare('SELECT user_id, email FROM users WHERE email = ?').get(email);

  if (!user) {
    // Return generic message to prevent user enumeration
    return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
  }

  const token = crypto.randomBytes(24).toString('hex');

  resetTokens.push({
    to: email,
    subject: 'Password Reset',
    token: token,
    user_id: user.user_id,
    link: `/passreset/${token}?id=${user.user_id}`,
    created_at: new Date().toISOString()
  });

  res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
});

router.get('/inbox', (req, res) => {
  res.json({ emails: resetTokens.slice(-20) });
});

router.post('/passreset', (req, res) => {
  const { id, password, confirm } = req.body;

  if (!id || !password || !confirm) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password !== confirm) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const targetUserId = parseInt(id, 10);
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(targetUserId);

  if (!user) {
    return res.status(404).json({ error: 'Invalid request' });
  }

  const newHash = hashPassword(password, user.password_salt);
  db.prepare('UPDATE users SET password_hash = ? WHERE user_id = ?').run(newHash, targetUserId);

  res.json({ success: true, message: 'Password has been reset successfully' });
});

module.exports = router;
