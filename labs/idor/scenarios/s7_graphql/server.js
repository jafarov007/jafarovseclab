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

// In-Memory Database
const userDb = {
  995043202: { user_id: 995043202, email: 'user.a@example.com', full_name: 'Alice Whitfield', role: 'System Admin' },
  552450897: { user_id: 552450897, email: 'user.b@example.com', full_name: 'Bob Martinez', role: 'Developer' }
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

// Scenario 7 GraphQL Endpoint Handler (Vulnerable BFLA / Mutation IDOR)
app.all('/graphql', (req, res) => {
  let query = '';
  if (req.method === 'POST') {
    query = req.body.query || (req.body.variables ? JSON.stringify(req.body) : '');
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

  // Vulnerable BFLA Mutation Handler
  if (query.includes('deleteUser')) {
    let id = 995043202;
    const match = query.match(/deleteUser\s*\(\s*id\s*:\s*(\d+)\s*\)/);
    if (match) {
      id = parseInt(match[1], 10);
    }

    if (userDb[id]) {
      delete userDb[id];
    }

    return res.json({
      data: {
        deleteUser: {
          success: true,
          message: `User ${id} successfully deleted from backend database via GraphQL mutation!`,
          deleted_user_id: id
        }
      }
    });
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
  if ((email === 'user.b@example.com' || email === 'user.a@example.com' || email === 'bob.martinez@corp.com') && password === 'password123') {
    const sessionToken = (email === 'user.b@example.com' || email === 'bob.martinez@corp.com') ? 'session_b' : 'session_a';
    res.setHeader('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly`);
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout API
app.get(['/logout', '/scenario/7/logout', '/scenario7/logout', '/s7/logout'], (req, res) => {
  res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  const ref = req.headers['referer'] || './';
  res.redirect(ref);
});

// Serve Web UI
app.all(['/', '/scenario/7', '/scenario7', '/s7'], (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies['session_token'];

  if (!session) {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'public', 'login.html'), 'utf-8');
    return res.send(loginHtml);
  }

  const isBob = session === 'session_b';
  const currentUser = isBob ? { name: 'Bob Martinez', email: 'user.b@example.com' } : { name: 'Alice Whitfield', email: 'user.a@example.com' };

  let apiResponse = '';
  let payloadQuery = 'mutation {\n  deleteUser(id: 995043202)\n}';

  if (req.method === 'POST') {
    payloadQuery = req.body.query || '';
    let id = 995043202;
    if (payloadQuery.includes('deleteUser')) {
      const match = payloadQuery.match(/deleteUser\s*\(\s*id\s*:\s*(\d+)\s*\)/);
      if (match) {
        id = parseInt(match[1], 10);
      }
      apiResponse = JSON.stringify({
        data: {
          deleteUser: {
            success: true,
            message: `User ${id} successfully deleted`,
            deleted_user_id: id
          }
        }
      }, null, 2);
    } else {
      apiResponse = JSON.stringify({
        data: {
          users: [{ id: 995043202, email: 'user.a@example.com' }]
        }
      }, null, 2);
    }
  }

  let indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  indexHtml = indexHtml.replace('{{USER_NAME}}', currentUser.name)
                       .replace('{{PAYLOAD_QUERY}}', payloadQuery)
                       .replace('{{API_RESPONSE}}', apiResponse || '// GraphQL response will appear here');

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
