const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { createPosition, getPositions, updatePosition, deletePosition } = require('../controllers/positionsController');
const router = express.Router();

router.post('/',
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('POSITION_CREATE', 'position'),
  [
    body('election_id').isInt(),
    body('name').trim().isLength({ min: 2 }),
    body('seats').optional().isInt({ min: 1 }),
    body('opens_at').isISO8601(),
    body('closes_at').isISO8601()
  ],
  createPosition
);

router.get('/', getPositions);

router.put('/:id',
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('POSITION_UPDATE', 'position'),
  [
    body('election_id').isInt(),
    body('name').trim().isLength({ min: 2 }),
    body('seats').optional().isInt({ min: 1 }),
    body('opens_at').isISO8601(),
    body('closes_at').isISO8601()
  ],
  updatePosition
);

router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  auditMiddleware('POSITION_DELETE', 'position'),
  deletePosition
);

module.exports = router;