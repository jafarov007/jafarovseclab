const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

router.get('/user/:id', (req, res) => {
  const requestedId = parseInt(req.params.id, 10);
  const sessionUserId = parseInt(req.headers['x-user-id'] || '0', 10);

  if (requestedId !== sessionUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT user_id, full_name, role FROM users WHERE user_id = ?'
  ).get(requestedId);

  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: user });
});

router.put('/user/:id', (req, res) => {
  const pathId = parseInt(req.params.id, 10);
  const includeFields = req.query.include ? req.query.include.split(',') : [];

  // Method override support for legacy clients
  const effectiveMethod = req.body._method || req.method;

  // Data layer resolves target from body if present, otherwise path
  const targetId = req.body.id ? parseInt(req.body.id, 10) : pathId;

  const db = getDb();
  const user = db.prepare(
    'SELECT user_id, email, full_name, phone, address, bio, role FROM users WHERE user_id = ?'
  ).get(targetId);

  if (!user) return res.status(404).json({ error: 'Not found' });

  let responseData = { user_id: user.user_id, full_name: user.full_name };
  if (includeFields.length > 0) {
    includeFields.forEach(f => {
      const trimmed = f.trim();
      if (user[trimmed] !== undefined) responseData[trimmed] = user[trimmed];
    });
  } else {
    responseData = user;
  }

  res.json({ success: true, data: responseData });
});

module.exports = router;
