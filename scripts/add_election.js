const { query } = require('../config/database');
require('dotenv').config();

const addElection = async () => {
  try {
    // Get admin user id (assuming admin exists)
    const adminResult = await query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    const adminId = adminResult.rows[0].id;

    // Positions for UCU GUILD ELECTIONS
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
      await query(
        'INSERT INTO positions (name, seats, opens_at, closes_at, created_by) VALUES (?, ?, ?, ?, ?)',
        [position.name, 1, position.opens_at, position.closes_at, adminId]
      );
    }

    console.log('UCU GUILD ELECTIONS positions added successfully!');

  } catch (error) {
    console.error('Failed to add election:', error);
  } finally {
    process.exit();
  }
};

addElection();