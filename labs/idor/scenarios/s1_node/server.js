const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8081;

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    email TEXT,
    password TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    bio TEXT
  );
  INSERT INTO users VALUES (995043202, 'user.a@example.com', 'password123', 'Alice Whitfield', '+1-555-0101', '742 Evergreen Terrace', 'Chief Executive Officer');
  INSERT INTO users VALUES (552450897, 'user.b@example.com', 'password123', 'Bob Martinez', '+1-555-0102', '123 Fake Street', 'Security Researcher');
  CREATE TABLE auth_tokens (token TEXT, user_id INTEGER, timestamp INTEGER);
  INSERT INTO auth_tokens VALUES ('tok_user_b_active', 552450897, 178673924);
  INSERT INTO auth_tokens VALUES ('tok_user_a_active', 995043202, 178673924);
`);

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

// Scenario 1 API
app.get('/api/v1/user/profile', (req, res) => {
  const { user_id, auth_token, timestamp } = req.query;

  if (!user_id || !auth_token || !timestamp) {
    return res.status(400).json({ error: 'Missing user_id, auth_token, or timestamp' });
  }

  const tokenRecord = db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(auth_token);
  if (!tokenRecord) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(parseInt(user_id, 10));
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ success: true, data: user });
});

// Login API
app.post('/api/v1/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE (email = ? OR user_id = ?) AND password = ?').get(email, email, password);
  if (user) {
    const sessionToken = user.user_id === 552450897 ? 'session_b' : 'session_a';
    res.setHeader('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly`);
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout API
app.get(['/logout', '/scenario/1/logout', '/scenario1/logout', '/s1/logout'], (req, res) => {
  res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  const ref = req.headers['referer'] || './';
  res.redirect(ref);
});

// Serve Web UI
app.get(['/', '/scenario/1', '/scenario1', '/s1'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['session_token'];

  if (!session) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  const isBob = session === 'session_b';
  const currentUser = isBob ? { name: 'Bob Martinez', id: 552450897, email: 'user.b@example.com', phone: '+1-555-0102', bio: 'Security Researcher', token: 'tok_user_b_active' }
                             : { name: 'Alice Whitfield', id: 995043202, email: 'user.a@example.com', phone: '+1-555-0101', bio: 'Chief Executive Officer', token: 'tok_user_a_active' };

  let indexHtml = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf-8');
  indexHtml = indexHtml.replace('{{USER_NAME}}', currentUser.name)
                       .replace('{{USER_ID}}', currentUser.id)
                       .replace('{{USER_TOKEN}}', currentUser.token)
                       .replace('{{TIMESTAMP}}', Math.floor(Date.now() / 10000));
  res.send(indexHtml);
});

// Interactive Source Code Viewer Endpoint
app.get(['/code', '/scenario/1/code', '/scenario1/code', '/s1/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'views', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

// Whitelisted File Content Retrieval Endpoint
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
