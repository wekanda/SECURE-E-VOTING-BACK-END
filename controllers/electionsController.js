const { query } = require('../config/database');
const { auditLog } = require('../middleware/audit');

const createElection = async (req, res) => {
  try {
    const { name, description } = req.body;

    const result = await query(
      'INSERT INTO elections (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.user.id]
    );

    await auditLog('user', req.user.id, 'ELECTION_CREATED', 'election', result.lastID, { name, description });

    res.status(201).json({ id: result.lastID, name, description, created_by: req.user.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create election' });
  }
};

const getElections = async (req, res) => {
  try {
    const result = await query('SELECT * FROM elections ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
};

const updateElection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await query(
      'UPDATE elections SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Election not found' });
    }

    await auditLog('user', req.user.id, 'ELECTION_UPDATED', 'election', id, { name, description });

    res.json({ id: parseInt(id), name, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update election' });
  }
};

const deleteElection = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM elections WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Election not found' });
    }

    await auditLog('user', req.user.id, 'ELECTION_DELETED', 'election', id);

    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete election' });
  }
};

const getElectionWithPositions = async (req, res) => {
  try {
    const { id } = req.params;

    const electionResult = await query('SELECT * FROM elections WHERE id = ?', [id]);
    if (electionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const positionsResult = await query('SELECT * FROM positions WHERE election_id = ? ORDER BY created_at DESC', [id]);

    res.json({
      ...electionResult.rows[0],
      positions: positionsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch election' });
  }
};

module.exports = { createElection, getElections, updateElection, deleteElection, getElectionWithPositions };