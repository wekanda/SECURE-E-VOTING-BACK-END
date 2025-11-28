const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { createElection, getElections, updateElection, deleteElection, getElectionWithPositions } = require('../controllers/electionsController');
const router = express.Router();

router.post('/', 
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('ELECTION_CREATE', 'election'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('description').optional().trim()
  ],
  createElection
);

router.get('/', getElections);

router.get('/:id', getElectionWithPositions);

router.put('/:id',
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('ELECTION_UPDATE', 'election'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('description').optional().trim()
  ],
  updateElection
);

router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('ELECTION_DELETE', 'election'),
  deleteElection
);

module.exports = router;