const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { submitNomination, getCandidates, approveCandidate, getMyCandidatures } = require('../controllers/candidatesController');
const router = express.Router();

router.post('/',
  authenticateToken,
  requireRole(['candidate']),
  auditMiddleware('NOMINATION_SUBMIT', 'candidate'),
  [
    body('position_id').isInt(),
    body('name').trim().isLength({ min: 2 }),
    body('manifesto_url').optional().isURL(),
    body('photo_url').optional().isURL()
  ],
  submitNomination
);

router.get('/', getCandidates);

router.get('/my-candidatures',
  authenticateToken,
  requireRole(['candidate']),
  getMyCandidatures
);

router.patch('/:id/approve',
  authenticateToken,
  requireRole(['officer']),
  auditMiddleware('NOMINATION_DECISION', 'candidate'),
  [
    body('status').isIn(['APPROVED', 'REJECTED']),
    body('reason').optional().trim()
  ],
  approveCandidate
);

module.exports = router;