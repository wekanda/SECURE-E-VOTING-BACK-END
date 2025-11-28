const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const addCandidates = async () => {
  try {
    // Get admin user
    const adminResult = await query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    const adminId = adminResult.rows[0].id;

    // Get positions
    const positionsResult = await query('SELECT id, name FROM positions ORDER BY id');
    console.log('Positions found:', positionsResult.rows.length);

    const candidates = [
      { name: 'John Doe', positionIndex: 0 },
      { name: 'Jane Smith', positionIndex: 0 },
      { name: 'Michael Johnson', positionIndex: 1 },
      { name: 'Sarah Davis', positionIndex: 1 },
      { name: 'Bob Wilson', positionIndex: 2 },
      { name: 'Alice Brown', positionIndex: 2 },
      { name: 'Charlie Miller', positionIndex: 3 },
      { name: 'Diana Garcia', positionIndex: 3 },
      { name: 'Tom Anderson', positionIndex: 4 },
      { name: 'Eve Taylor', positionIndex: 4 },
      { name: 'Frank Martinez', positionIndex: 5 },
      { name: 'Lisa Rodriguez', positionIndex: 5 },
      { name: 'Paul Lee', positionIndex: 6 },
      { name: 'Maria Gonzalez', positionIndex: 6 }
    ];

    for (const candidate of candidates) {
      if (candidate.positionIndex < positionsResult.rows.length) {
        const positionId = positionsResult.rows[candidate.positionIndex].id;

        // Create user for candidate
        const candidatePassword = await bcrypt.hash('candidate123', 12);
        const userResult = await query(
          'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
          [`${candidate.name.toLowerCase().replace(' ', '')}@student.com`, candidatePassword, 'candidate', candidate.name]
        );

        // Create candidate
        await query(
          'INSERT INTO candidates (position_id, user_id, name, status) VALUES (?, ?, ?, ?)',
          [positionId, userResult.lastID, candidate.name, 'APPROVED']
        );

        console.log(`Added candidate: ${candidate.name} for position ${positionsResult.rows[candidate.positionIndex].name}`);
      }
    }

    console.log('Candidates added successfully');

  } catch (error) {
    console.error('Failed to add candidates:', error);
  } finally {
    process.exit();
  }
};

addCandidates();