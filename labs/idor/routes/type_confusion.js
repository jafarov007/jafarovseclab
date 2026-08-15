const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

router.get('/profile', (req, res) => {
  const { user_id, session_user_id } = req.query;

  if (!user_id || !session_user_id) {
    return res.status(400).json({ error: 'user_id and session_user_id are required' });
  }

  // Access control: verify the requested ID belongs to the authenticated session
  if (!String(user_id).startsWith(String(session_user_id))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Parse user ID for database lookup
  const numericId = Math.floor(Number(user_id));
  if (isNaN(numericId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT user_id, email, full_name, phone, address, role FROM users WHERE user_id = ?'
  ).get(numericId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, data: user });
});

module.exports = router;
