const { query } = require('../config/database');
const { auditLog } = require('../middleware/audit');

const submitNomination = async (req, res) => {
  try {
    const { position_id, name, manifesto_url, photo_url } = req.body;

    // Check if position exists and is open for nominations
    const positionResult = await query('SELECT * FROM positions WHERE id = ?', [position_id]);
    if (positionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const position = positionResult.rows[0];
    const now = new Date();
    if (now < new Date(position.opens_at)) {
      return res.status(400).json({ error: 'Nomination period not yet open' });
    }
    if (now > new Date(position.closes_at)) {
      return res.status(400).json({ error: 'Nomination period has closed' });
    }

    // Check if user already nominated for this position
    const existingNomination = await query(
      'SELECT id FROM candidates WHERE position_id = ? AND user_id = ?',
      [position_id, req.user.id]
    );

    if (existingNomination.rows.length > 0) {
      return res.status(400).json({ error: 'Already nominated for this position' });
    }

    const result = await query(
      'INSERT INTO candidates (position_id, user_id, name, manifesto_url, photo_url) VALUES (?, ?, ?, ?, ?)',
      [position_id, req.user.id, name, manifesto_url, photo_url]
    );

    await auditLog('user', req.user.id, 'NOMINATION_SUBMITTED', 'candidate', result.lastID, { position_id, name });

    res.status(201).json({ id: result.lastID, position_id, user_id: req.user.id, name, manifesto_url, photo_url, status: 'SUBMITTED' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit nomination' });
  }
};

const getCandidates = async (req, res) => {
  try {
    const { position_id } = req.query;
    let sql = `
      SELECT c.*, p.name as position_name, u.email
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      JOIN users u ON c.user_id = u.id
    `;
    const params = [];

    if (position_id) {
      sql += ' WHERE c.position_id = ?';
      params.push(position_id);
    }

    sql += ' ORDER BY c.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

const approveCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE candidates SET status = ?, reason = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, reason, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await auditLog('user', req.user.id, `NOMINATION_${status}`, 'candidate', id, { status, reason });

    res.json({ id: parseInt(id), status, reason });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
};

const getMyCandidatures = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, p.name as position_name
       FROM candidates c
       JOIN positions p ON c.position_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidatures' });
  }
};

module.exports = { submitNomination, getCandidates, approveCandidate, getMyCandidatures };