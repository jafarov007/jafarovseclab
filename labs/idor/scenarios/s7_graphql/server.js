const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8087;

app.use((req, res, next) => {
  req.url = req.url.replace(/^\/+/, '/');
  req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Database for Enterprise Portal
const userDb = {
  995043202: { user_id: 995043202, email: 'user.a@example.com', full_name: 'Alice Whitfield', role: 'System Admin', department: 'Executive' },
  552450897: { user_id: 552450897, email: 'user.b@example.com', full_name: 'Bob Martinez', role: 'Developer', department: 'Engineering' },
  101: { user_id: 101, email: 'carol.danvers@example.com', full_name: 'Carol Danvers', role: 'QA Lead', department: 'Engineering' },
  102: { user_id: 102, email: 'david.miller@example.com', full_name: 'David Miller', role: 'DevOps Engineer', department: 'Operations' },
  103: { user_id: 103, email: 'eve.adams@example.com', full_name: 'Eve Adams', role: 'Product Manager', department: 'Product' },
  104: { user_id: 104, email: 'frank.wright@example.com', full_name: 'Frank Wright', role: 'Security Analyst', department: 'Security' },
  105: { user_id: 105, email: 'grace.hopper@example.com', full_name: 'Grace Hopper', role: 'Backend Engineer', department: 'Engineering' },
  106: { user_id: 106, email: 'heidi.klum@example.com', full_name: 'Heidi Klum', role: 'UI/UX Designer', department: 'Design' },
  107: { user_id: 107, email: 'ivan.dorn@example.com', full_name: 'Ivan Dorn', role: 'Data Scientist', department: 'Analytics' }
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

// Scenario 7 GraphQL Endpoint Handler
app.all(['/graphql', '/scenario/7/graphql', '/scenario7/graphql', '/s7/graphql'], (req, res) => {
  let query = '';
  if (req.method === 'POST') {
    if (typeof req.body === 'object' && req.body.query) {
      query = req.body.query;
    } else if (typeof req.body === 'string') {
      query = req.body;
    } else {
      query = JSON.stringify(req.body);
    }
  } else if (req.method === 'GET') {
    query = req.query.query || '';
  }

  // Introspection Query Handler
  if (query.includes('__schema') || query.includes('__type')) {
    return res.json({
      data: {
        __schema: {
          types: [
            { name: 'Query', fields: [{ name: 'users' }, { name: 'user' }] },
            { name: 'Mutation', fields: [{ name: 'deleteUser' }, { name: 'updateUserRole' }] }
          ]
        }
      }
    });
  }

  // GraphQL Mutation Handler
  if (query.includes('deleteUser')) {
    let id = null;
    const match = query.match(/deleteUser\s*\(\s*id\s*:\s*(\d+)\s*\)/);
    if (match) {
      id = parseInt(match[1], 10);
    }

    if (id && userDb[id]) {
      delete userDb[id];
      return res.json({
        data: {
          deleteUser: {
            success: true,
            message: `User ${id} successfully deleted from backend database via GraphQL mutation`,
            deleted_user_id: id
          }
        }
      });
    } else {
      return res.status(404).json({
        errors: [{ message: `User ${id || 'unknown'} not found` }]
      });
    }
  }

  // Default Query Response
  res.json({
    data: {
      users: Object.values(userDb)
    }
  });
});

// Login API
app.post('/api/v7/login', (req, res) => {
  const { email, password } = req.body;
  if ((email === 'user.b@example.com' || email === 'user.a@example.com') && password === 'password123') {
    const sessionToken = email === 'user.b@example.com' ? 'session_b' : 'session_a';
    res.setHeader('Set-Cookie', `s7_session=${sessionToken}; Path=/; HttpOnly`);
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout API
app.get(['/logout', '/scenario/7/logout', '/scenario7/logout', '/s7/logout'], (req, res) => {
  res.setHeader('Set-Cookie', 's7_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  const ref = req.headers['referer'] || './';
  res.redirect(ref);
});

// Serve Web UI
app.get(['/', '/scenario/7', '/scenario7', '/s7'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['s7_session'];

  if (!session) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'public', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  const isBob = session === 'session_b';
  const currentUser = isBob ? userDb[552450897] : userDb[995043202];

  let indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  
  // Inject user info and admin state
  indexHtml = indexHtml.replace(/{{USER_NAME}}/g, currentUser.full_name)
                       .replace(/{{USER_ROLE}}/g, currentUser.role)
                       .replace(/{{USER_EMAIL}}/g, currentUser.email)
                       .replace(/{{USER_DEPT}}/g, currentUser.department)
                       .replace(/{{IS_ADMIN}}/g, !isBob ? 'true' : 'false')
                       .replace(/{{USERS_JSON}}/g, JSON.stringify(Object.values(userDb)));

  res.send(indexHtml);
});

// Code Reviewer
app.get(['/code', '/scenario/7/code', '/scenario7/code', '/s7/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'public', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

// Code File Fetcher API
app.get(['/code/file', '/scenario/7/code/file', '/scenario7/code/file', '/s7/code/file'], (req, res) => {
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
  console.log(`[Scenario 7 GraphQL Node.js App] Listening on port ${PORT}`);
});
