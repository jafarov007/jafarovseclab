const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

router.post('/avatar', (req, res) => {
  const { user_id, avatar_path } = req.body;

  if (!user_id || !avatar_path) {
    return res.status(400).json({ error: 'user_id and avatar_path are required' });
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = avatar_path.substring(avatar_path.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const db = getDb();
  const result = db.prepare('UPDATE users SET avatar_url = ? WHERE user_id = ?').run(avatar_path, user_id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.prepare('SELECT user_id, email, full_name, avatar_url FROM users WHERE user_id = ?').get(user_id);
  res.json({ success: true, message: 'Avatar updated', data: user });
});

// GET endpoint to retrieve current avatar info
router.get('/avatar/:user_id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT user_id, avatar_url FROM users WHERE user_id = ?').get(req.params.user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, data: user });
});

module.exports = router;
