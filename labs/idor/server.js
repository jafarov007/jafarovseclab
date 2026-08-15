const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/init');

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const typeConfusionRouter = require('./routes/type_confusion');
const methodTamperingRouter = require('./routes/method_tampering');
const fileUploadRouter = require('./routes/file_upload');
const passwordResetRouter = require('./routes/password_reset');
const privilegeEscRouter = require('./routes/privilege_esc');
const graphqlRouter = require('./routes/graphql');
const jwtIdorRouter = require('./routes/jwt_idor');
const codeRouter = require('./routes/code');

const app = express();
const PORT = process.env.PORT || 8081;

let isInitialized = false;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Subdomain Routing Middleware
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const match = host.match(/^(?:s|scenario)(\d)/i);

  if (match) {
    const scenarioNum = match[1];
    if (req.path === '/' || req.path === '') {
      return res.sendFile(path.join(__dirname, `public/scenarios/scenario${scenarioNum}.html`));
    }
    if (req.path === '/code') {
      return res.redirect(`/code-viewer.html?scenario=${scenarioNum}`);
    }
  }
  next();
});

// Explicit Scenario Direct Path Routes
for (let i = 1; i <= 8; i++) {
  const scNum = i;
  app.get(`/scenario/${scNum}`, (req, res) => {
    res.sendFile(path.join(__dirname, `public/scenarios/scenario${scNum}.html`));
  });
  app.get(`/scenario/${scNum}/code`, (req, res) => {
    res.redirect(`/code-viewer.html?scenario=${scNum}`);
  });
}

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Health & Status Check
app.get('/status', (req, res) => {
  res.json({
    status: isInitialized ? 'running' : 'idle',
    initialized: isInitialized,
    port: PORT,
    scenarios: 8
  });
});

// Database Initialization & Reset Endpoints
app.post('/init', (req, res) => {
  try {
    const dbStatus = initDatabase();
    isInitialized = true;
    res.json({
      status: 'initialized',
      message: dbStatus.seeded ? 'Database seeded successfully' : 'Database already initialized',
      users: dbStatus.users
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize database', details: err.message });
  }
});

app.post('/reset', (req, res) => {
  try {
    const dbStatus = initDatabase(true);
    isInitialized = true;
    res.json({
      status: 'reset_complete',
      message: 'Database reset and re-seeded successfully',
      users: dbStatus.users
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

// Mount Scenario API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', profileRouter);
app.use('/api/v2/user', typeConfusionRouter);
app.use('/api/v3', methodTamperingRouter);
app.use('/api/v4/user', fileUploadRouter);
app.use('/api/v5', passwordResetRouter);
app.use('/api/v6', privilegeEscRouter);
app.use('/api/v7', graphqlRouter);
app.use('/api/v8/user', jwtIdorRouter);
app.use('/api', codeRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[IDOR Lab] Running on http://0.0.0.0:${PORT}`);
  initDatabase();
  isInitialized = true;
});
