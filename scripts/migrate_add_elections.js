const { db } = require('../config/database');
require('dotenv').config();

const migrate = async () => {
  try {
    // Add elections table
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS elections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_by INTEGER REFERENCES users(id),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Add election_id column to positions if not exists
    // SQLite doesn't have IF NOT EXISTS for columns, so check first
    const columns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(positions)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    const hasElectionId = columns.some(col => col.name === 'election_id');

    if (!hasElectionId) {
      await new Promise((resolve, reject) => {
        db.run("ALTER TABLE positions ADD COLUMN election_id INTEGER REFERENCES elections(id)", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Added election_id column to positions table');
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

migrate();