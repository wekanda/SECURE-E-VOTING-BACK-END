const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const authenticateBallotToken = async (req, res, next) => {
  const token = req.headers['ballot-token'];

  if (!token) {
    return res.status(401).json({ error: 'Ballot token required' });
  }

  try {
    const now = new Date().toISOString();
    console.log('Authenticating ballot token:', token, 'now:', now);

    const result = await query(
      'SELECT * FROM verifications WHERE ballot_token = ? AND verified_at IS NOT NULL AND consumed_at IS NULL AND expires_at > ?',
      [token, now]
    );

    console.log('Ballot token query result:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired ballot token' });
    }

    req.verification = result.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

module.exports = { authenticateToken, requireRole, authenticateBallotToken };