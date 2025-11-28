const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Setup test database
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  try {
    // Create tables first
    const schema = fs.readFileSync(path.join(__dirname, '../database/sqlite-schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement) await query(statement);
    }

    // Clean up test data before running tests
    await query('DELETE FROM votes WHERE 1=1');
    await query('DELETE FROM ballots WHERE 1=1');
    await query('DELETE FROM verifications WHERE 1=1');
    await query('DELETE FROM candidates WHERE 1=1');
    await query('DELETE FROM positions WHERE 1=1');
    await query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
    await query('DELETE FROM audit_log WHERE 1=1');

    // Seed admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await query('INSERT OR IGNORE INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)', ['admin@evoting.com', adminPassword, 'admin', 'System Administrator']);
  } catch (error) {
    console.log('Test setup error:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  // No need to close SQLite connection
});