const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'idor.db');
let db = null;

// Generate a random large user ID (9-10 digits)
function generateUserId() {
  return Math.floor(100000000 + Math.random() * 900000000);
}

// Hash password with salt
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      bio TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      issued_timestamp INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

  // Check if users already exist
  const existingUsers = database.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) {
    const users = database.prepare('SELECT user_id, email, full_name FROM users').all();
    return {
      message: 'Database already initialized',
      users: users.map(u => ({ user_id: u.user_id, email: u.email, name: u.full_name }))
    };
  }

  // Seed two users with random large IDs
  const userAId = generateUserId();
  const userBId = generateUserId();

  const saltA = crypto.randomBytes(16).toString('hex');
  const saltB = crypto.randomBytes(16).toString('hex');

  const insertUser = database.prepare(`
    INSERT INTO users (user_id, email, password_hash, password_salt, full_name, phone, address, bio, avatar_url, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    userAId,
    'user.a@example.com',
    hashPassword('user.a@example.com', saltA),
    saltA,
    'Alice Whitfield',
    '+1-555-0101',
    '742 Evergreen Terrace, Springfield, IL 62704',
    'Senior Software Engineer at TechCorp. Passionate about cloud infrastructure and DevOps.',
    '/static/avatars/default-a.png',
    'user'
  );

  insertUser.run(
    userBId,
    'user.b@example.com',
    hashPassword('user.b@example.com', saltB),
    saltB,
    'Bob Martinez',
    '+1-555-0102',
    '1600 Pennsylvania Ave NW, Washington, DC 20500',
    'Product Manager with 8 years of experience in fintech. Coffee enthusiast.',
    '/static/avatars/default-b.png',
    'user'
  );

  const users = database.prepare('SELECT user_id, email, full_name FROM users').all();
  return {
    message: 'Database initialized with seed data',
    users: users.map(u => ({ user_id: u.user_id, email: u.email, name: u.full_name }))
  };
}

function resetDatabase() {
  const database = getDb();
  database.exec('DROP TABLE IF EXISTS auth_tokens');
  database.exec('DROP TABLE IF EXISTS users');
  db = null;
  // Re-create
  return initDatabase();
}

function getStatus() {
  try {
    const database = getDb();
    const users = database.prepare('SELECT COUNT(*) as count FROM users').get();
    const tokens = database.prepare('SELECT COUNT(*) as count FROM auth_tokens').get();
    return {
      status: 'online',
      users: users.count,
      active_tokens: tokens.count
    };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

module.exports = { getDb, initDatabase, resetDatabase, getStatus, hashPassword };
