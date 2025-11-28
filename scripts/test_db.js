const { query } = require('../config/database');

const testDB = async () => {
  try {
    console.log('Testing database connection...');

    // Check if tables exist
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows.map(t => t.name));

    // Check eligible_voters table
    const voters = await query("SELECT COUNT(*) as count FROM eligible_voters");
    console.log('Eligible voters count:', voters.rows[0].count);

    // Check elections table
    const elections = await query("SELECT COUNT(*) as count FROM elections");
    console.log('Elections count:', elections.rows[0].count);

    // Check positions table
    const positions = await query("SELECT COUNT(*) as count FROM positions");
    console.log('Positions count:', positions.rows[0].count);

    console.log('Database test completed successfully');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    process.exit();
  }
};

testDB();