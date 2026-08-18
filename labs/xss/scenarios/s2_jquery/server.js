const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9082;

let currentUser = {
  email: 'user.a@example.com',
  name: 'John Doe',
  role: 'Security Engineer',
  department: 'AppSec Team'
};

app.use((req, res, next) => {
  req.url = req.url.replace(/^\/+/, '/');
  if (req.originalUrl) req.originalUrl = req.originalUrl.replace(/^\/+/, '/');
  req._parsedUrl = undefined;
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(['/api/v1/profile', '/scenario/2/api/v1/profile', '/s2/api/v1/profile'], (req, res) => {
  res.json(currentUser);
});

app.post(['/api/v1/update-name', '/scenario/2/api/v1/update-name', '/s2/api/v1/update-name'], (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required.' });
  }

  // Strict 60-character length validation on backend
  if (name.length > 60) {
    return res.status(400).json({ error: 'Display name cannot exceed 60 characters.' });
  }

  // Input Sanitization: Strip script, img tags, and javascript keywords
  let cleanName = name
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/javascript/gi, '');

  currentUser.name = cleanName;
  return res.json({ success: true, user: currentUser });
});

app.get(['/', '/scenario/2', '/s2'], (req, res) => {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf-8');
  res.send(indexHtml);
});

app.get(['/code', '/scenario/2/code', '/s2/code'], (req, res) => {
  const codeHtml = fs.readFileSync(path.join(__dirname, 'views', 'code.html'), 'utf-8');
  res.send(codeHtml);
});

app.get(['/code/file', '/scenario/2/code/file', '/s2/code/file'], (req, res) => {
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
  console.log(`[Scenario 2 jQuery App] Listening on port ${PORT}`);
});
