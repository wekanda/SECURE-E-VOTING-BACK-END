const { query } = require('../config/database');
require('dotenv').config();

const createElection = async () => {
  try {
    // Get admin user id
    const adminResult = await query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    const adminId = adminResult.rows[0].id;

    // Create the election
    const electionResult = await query(
      'INSERT INTO elections (name, description, created_by) VALUES (?, ?, ?)',
      ['UCU GUILD ELECTIONS', 'University Guild Elections for various positions', adminId]
    );
    const electionId = electionResult.lastID;

    console.log(`Created election: UCU GUILD ELECTIONS (ID: ${electionId})`);

    // Create positions
    const positions = [
      { name: 'guild president', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSIT', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSWASA', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BSCED', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament BAED', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament DIPLOMA', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Member of Parliament EVENING', opens_at: new Date(), closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    ];

    for (const position of positions) {
      const result = await query(
        'INSERT INTO positions (election_id, name, seats, opens_at, closes_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [electionId, position.name, 1, position.opens_at, position.closes_at, adminId]
      );
      console.log(`Created position: ${position.name} (ID: ${result.lastID})`);
    }

    console.log('UCU GUILD ELECTIONS created successfully with all positions!');

  } catch (error) {
    console.error('Failed to create election:', error);
  } finally {
    process.exit();
  }
};

createElection();