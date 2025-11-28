const { query } = require('../config/database');
require('dotenv').config();

const assignPositions = async () => {
  try {
    // Get the UCU GUILD ELECTIONS
    const electionResult = await query('SELECT id FROM elections WHERE name = ?', ['UCU GUILD ELECTIONS']);
    if (electionResult.rows.length === 0) {
      console.log('UCU GUILD ELECTIONS not found');
      return;
    }
    const electionId = electionResult.rows[0].id;

    // Update all positions without election_id to this election
    const result = await query('UPDATE positions SET election_id = ? WHERE election_id IS NULL', [electionId]);

    console.log(`Assigned ${result.changes} positions to UCU GUILD ELECTIONS`);

  } catch (error) {
    console.error('Failed to assign positions:', error);
  } finally {
    process.exit();
  }
};

assignPositions();