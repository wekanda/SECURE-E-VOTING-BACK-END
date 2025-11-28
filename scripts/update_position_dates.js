const { query } = require('../config/database');
require('dotenv').config();

const updatePositionDates = async () => {
  try {
    // Update all positions to have current opens_at and future closes_at
    const opensAt = new Date().toISOString();
    const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    const result = await query(
      'UPDATE positions SET opens_at = ?, closes_at = ? WHERE opens_at < ?',
      [opensAt, closesAt, opensAt]
    );

    console.log(`Updated ${result.changes} positions with current dates`);

    // Show current positions
    const positions = await query('SELECT name, opens_at, closes_at FROM positions');
    console.log('Current positions:');
    positions.rows.forEach(p => {
      console.log(`${p.name}: ${p.opens_at} to ${p.closes_at}`);
    });

  } catch (error) {
    console.error('Failed to update position dates:', error);
  } finally {
    process.exit();
  }
};

updatePositionDates();