const { query } = require('../config/database');
const { auditLog } = require('../middleware/audit');

const createPosition = async (req, res) => {
  try {
    const { election_id, name, seats, opens_at, closes_at } = req.body;

    const result = await query(
      'INSERT INTO positions (election_id, name, seats, opens_at, closes_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [election_id, name, seats || 1, opens_at, closes_at, req.user.id]
    );

    await auditLog('user', req.user.id, 'POSITION_CREATED', 'position', result.lastID, { election_id, name, seats });

    res.status(201).json({ id: result.lastID, election_id, name, seats, opens_at, closes_at, created_by: req.user.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create position' });
  }
};

const getPositions = async (req, res) => {
  try {
    const result = await query('SELECT * FROM positions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
};

const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { election_id, name, seats, opens_at, closes_at } = req.body;

    const result = await query(
      'UPDATE positions SET election_id = ?, name = ?, seats = ?, opens_at = ?, closes_at = ? WHERE id = ?',
      [election_id, name, seats, opens_at, closes_at, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    await auditLog('user', req.user.id, 'POSITION_UPDATED', 'position', id, { election_id, name, seats });

    res.json({ id: parseInt(id), election_id, name, seats, opens_at, closes_at });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
};

const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM positions WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    await auditLog('user', req.user.id, 'POSITION_DELETED', 'position', id);

    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete position' });
  }
};

module.exports = { createPosition, getPositions, updatePosition, deletePosition };