const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9081;

// ─── Pre-Seeded User Data ─────────────────────────────────────────
const testUser = {
  email: 'user.a@example.com',
  password: 'password123',
  full_name: 'Alice Whitfield',
  role: 'Software Architect',
  department: 'Engineering & DevOps'
};

// ─── Middleware ──────────────────────────────────────────────────
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/+/, '/');
  if (req.originalUrl) req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  req._parsedUrl = undefined;
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

// ─── Login API ───────────────────────────────────────────────────
app.post('/api/v1/login', (req, res) => {
  const { email, password } = req.body;
  if (email === testUser.email && password === testUser.password) {
    res.setHeader('Set-Cookie', `session_token=user_a_active_session; Path=/; HttpOnly`);
    return res.json({ success: true, user: testUser });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// ─── Logout Endpoint ─────────────────────────────────────────────
app.get(['/logout', '/scenario/1/logout', '/s1/logout'], (req, res) => {
  res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.redirect('/');
});

// ─── Web Application Route ────────────────────────────────────────
app.get(['/', '/profile', '/scenario/1', '/scenario/1/profile', '/s1', '/s1/profile'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const isLoggedIn = cookies['session_token'] === 'user_a_active_session';
  const emailParam = req.query.email || '';

  // Input Sanitization: Strip dangerous script and image HTML tags
  let cleanEmail = emailParam;
  if (cleanEmail) {
    cleanEmail = cleanEmail
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/javascript/gi, '');
  }

  let indexHtml = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf-8');
  indexHtml = indexHtml
    .replace('{{USER_EMAIL_INPUT}}', cleanEmail)
    .replace('{{HAS_RESET_REQUEST}}', cleanEmail ? 'true' : 'false')
    .replace('{{IS_LOGGED_IN}}', isLoggedIn ? 'true' : 'false');

  res.send(indexHtml);
});

// ─── Source Code Viewer Endpoints ────────────────────────────────
app.get(['/code', '/scenario/1/code', '/s1/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'views', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

app.get(['/code/file', '/scenario/1/code/file', '/s1/code/file'], (req, res) => {
  const { name } = req.query;
  const allowedFiles = ['server.js', 'views/index.html', 'package.json', 'Dockerfile'];
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
  console.log(`[Scenario 1 Vue.js App] Listening on port ${PORT}`);
});
