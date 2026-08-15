const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

const VALID_ROLES = ['user', 'moderator', 'admin'];

// Admin endpoint for managing user roles
// TODO: Add authentication middleware before production deployment
router.post('/admin/promote', (req, res) => {
  const { user_id, role } = req.body;

  if (!user_id || !role) {
    return res.status(400).json({ error: 'user_id and role are required' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be: user, moderator, or admin' });
  }

  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ? WHERE user_id = ?').run(role, parseInt(user_id, 10));

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.prepare('SELECT user_id, email, full_name, role FROM users WHERE user_id = ?').get(parseInt(user_id, 10));
  res.json({ success: true, data: user });
});

module.exports = router;
