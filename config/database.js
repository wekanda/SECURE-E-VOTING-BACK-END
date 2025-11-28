const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'evoting.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

module.exports = { query, db };