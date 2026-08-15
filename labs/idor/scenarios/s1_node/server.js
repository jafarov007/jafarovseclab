const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8081;

// ─── Database Setup ──────────────────────────────────────────────
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    bio TEXT
  );

  CREATE TABLE auth_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL
  );
`);

// Seed users with auto-incremented IDs
db.prepare(`INSERT INTO users (email, password, full_name, phone, address, bio) VALUES (?, ?, ?, ?, ?, ?)`)
  .run('user.a@example.com', 'password123', 'Alice Whitfield', '+1-555-0101', '742 Evergreen Terrace', 'Chief Executive Officer');
db.prepare(`INSERT INTO users (email, password, full_name, phone, address, bio) VALUES (?, ?, ?, ?, ?, ?)`)
  .run('user.b@example.com', 'password123', 'Bob Martinez', '+1-555-0102', '123 Fake Street', 'Security Researcher');

// Generate a permanent, unique API token for each user at startup
const TOKEN_SECRET = 'corp-dashboard-hmac-2024';
const allUsers = db.prepare('SELECT user_id FROM users').all();
for (const u of allUsers) {
  const token = crypto.createHmac('sha256', TOKEN_SECRET)
    .update(`permanent:${u.user_id}`).digest('hex').substring(0, 24);
  db.prepare('INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)').run(token, u.user_id);
}

// Timestamp window: rotates every 30 seconds
const TOKEN_WINDOW_SECONDS = 30;
function getCurrentWindow() {
  return Math.floor(Date.now() / 1000 / TOKEN_WINDOW_SECONDS);
}

// ─── Middleware ──────────────────────────────────────────────────
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/+/, '/');
  if (req.originalUrl) req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  req._parsedUrl = undefined;
  next();
});
app.use(cors());
app.use(express.json());

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

app.get('/api/v1/user/profile', (req, res) => {
  const { user_id, auth_token, timestamp } = req.query;

  if (!user_id || !auth_token || !timestamp) {
    return res.status(400).json({ error: 'Missing user_id, auth_token, or timestamp' });
  }

  const tokenRecord = db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(auth_token);
  if (!tokenRecord) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  const currentWindow = getCurrentWindow();
  const providedWindow = parseInt(timestamp, 10);
  if (Math.abs(currentWindow - providedWindow) > 1) {
    return res.status(403).json({ error: 'Token timestamp expired. Refresh your session.' });
  }

  const user = db.prepare('SELECT user_id, email, full_name, phone, address, bio FROM users WHERE user_id = ?')
    .get(parseInt(user_id, 10));

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ success: true, data: user });
});

// ─── Login API ───────────────────────────────────────────────────
app.post('/api/v1/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate a session cookie tied to the user's ID
  const sessionValue = crypto.createHmac('sha256', TOKEN_SECRET)
    .update(`session:${user.user_id}:${Date.now()}`).digest('hex').substring(0, 16);

  // Store session mapping
  db.prepare('INSERT OR REPLACE INTO sessions (session_id, user_id) VALUES (?, ?)').run(sessionValue, user.user_id);

  res.setHeader('Set-Cookie', `session_token=${sessionValue}; Path=/; HttpOnly`);
  return res.json({ success: true });
});

// ─── Logout ──────────────────────────────────────────────────────
app.get(['/logout', '/scenario/1/logout', '/scenario1/logout', '/s1/logout'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['session_token'];
  if (session) {
    try { db.prepare('DELETE FROM sessions WHERE session_id = ?').run(session); } catch (e) { }
  }
  res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.redirect('/');
});

// ─── Web UI (Dashboard) ─────────────────────────────────────────
app.get(['/', '/scenario/1', '/scenario1', '/s1'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['session_token'];

  if (!session) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  // Look up session in DB
  const sessionRecord = db.prepare('SELECT user_id FROM sessions WHERE session_id = ?').get(session);
  if (!sessionRecord) {
    res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    const loginHtml = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  const currentUser = db.prepare('SELECT * FROM users WHERE user_id = ?').get(sessionRecord.user_id);
  if (!currentUser) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  // Get the user's permanent token from DB and current timestamp window
  const userToken = db.prepare('SELECT token FROM auth_tokens WHERE user_id = ?').get(currentUser.user_id);
  const currentWindow = getCurrentWindow();

  let indexHtml = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf-8');
  indexHtml = indexHtml.replace('{{USER_NAME}}', currentUser.full_name)
    .replace('{{USER_ID}}', currentUser.user_id)
    .replace('{{USER_TOKEN}}', userToken.token)
    .replace('{{TIMESTAMP}}', currentWindow);
  res.send(indexHtml);
});

// ─── Source Code Viewer ──────────────────────────────────────────
app.get(['/code', '/scenario/1/code', '/scenario1/code', '/s1/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'views', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

app.get(['/code/file', '/scenario/1/code/file', '/scenario1/code/file', '/s1/code/file'], (req, res) => {
  const { name } = req.query;
  const allowedFiles = ['server.js', 'views/index.html', 'views/login.html', 'package.json', 'Dockerfile'];
  if (!allowedFiles.includes(name)) {
    return res.status(403).send('Forbidden');
  }
  const filePath = path.join(__dirname, name);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.type('text/plain').send(content);
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Scenario 1 Node.js App] Listening on port ${PORT}`);
});
