const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8084;

app.use((req, res, next) => {
  req.url = req.url.replace(/^\/+/, '/');
  req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userProfiles = {
  995043202: {
    user_id: 995043202,
    email: 'user.a@example.com',
    full_name: 'Alice Whitfield',
    phone: '+1-555-0101',
    address: '1 Executive Plaza, NYC',
    bio: 'Chief Executive Officer'
  },
  552450897: {
    user_id: 552450897,
    email: 'user.b@example.com',
    full_name: 'Bob Martinez',
    phone: '+1-555-0102',
    address: '742 Evergreen Terrace',
    bio: 'Standard Security Analyst'
  }
};

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

// Method Override API Handler
app.all('/api/v4/user/profile', (req, res) => {
  let method = req.method;
  if (req.headers['x-http-method-override']) {
    method = req.headers['x-http-method-override'].toUpperCase();
  } else if (req.query._method) {
    method = req.query._method.toUpperCase();
  }

  let user_id = req.query.user_id || req.body.user_id;

  if (method === 'GET') {
    const cookies = parseCookies(req.headers.cookie);
    const session = cookies['s4_session'];
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    user_id = session === 'session_b' ? 552450897 : 995043202;
    return res.json({ success: true, data: userProfiles[user_id] });
  }

  if (method === 'PUT' || method === 'POST') {
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id for update action' });
    }

    const targetUser = userProfiles[user_id];
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user profile not found' });
    }

    if (req.body.full_name) targetUser.full_name = req.body.full_name;
    if (req.body.phone) targetUser.phone = req.body.phone;
    if (req.body.address) targetUser.address = req.body.address;
    if (req.body.bio) targetUser.bio = req.body.bio;

    return res.json({
      success: true,
      message: `Profile updated successfully for user_id: ${user_id}`,
      data: targetUser
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
});

// Login API
app.post('/api/v4/login', (req, res) => {
  const { email, password } = req.body;
  if ((email === 'user.b@example.com' || email === 'user.a@example.com') && password === 'password123') {
    const sessionToken = email === 'user.b@example.com' ? 'session_b' : 'session_a';
    res.setHeader('Set-Cookie', `s4_session=${sessionToken}; Path=/; HttpOnly`);
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout API
app.get(['/logout', '/scenario/4/logout', '/scenario4/logout', '/s4/logout'], (req, res) => {
  res.setHeader('Set-Cookie', 's4_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  const ref = req.headers['referer'] || './';
  res.redirect(ref);
});

// Serve Web UI
app.get(['/', '/scenario/4', '/scenario4', '/s4'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['s4_session'];

  if (!session) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'public', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  const isBob = session === 'session_b';
  const currentUser = isBob ? userProfiles[552450897] : userProfiles[995043202];

  let indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  indexHtml = indexHtml.replace('{{USER_NAME}}', currentUser.full_name)
                       .replace('{{USER_ID}}', currentUser.user_id)
                       .replace('{{FULL_NAME}}', currentUser.full_name)
                       .replace('{{PHONE}}', currentUser.phone)
                       .replace('{{ADDRESS}}', currentUser.address)
                       .replace('{{BIO}}', currentUser.bio);

  res.send(indexHtml);
});

// Interactive Source Code Viewer Endpoint
app.get(['/code', '/scenario/4/code', '/scenario4/code', '/s4/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'public', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

// Whitelisted File Content Retrieval Endpoint
app.get(['/code/file', '/scenario/4/code/file', '/scenario4/code/file', '/s4/code/file'], (req, res) => {
  const { name } = req.query;
  const allowedFiles = ['server.js', 'public/index.html', 'public/login.html', 'package.json', 'Dockerfile'];
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
  console.log(`[Scenario 4 Node.js App] Listening on port ${PORT}`);
});
