const express = require('express');
const { body } = require('express-validator');
const { authenticateBallotToken } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { getBallot, castVote } = require('../controllers/votingController');
const router = express.Router();

router.get('/ballot',
  authenticateBallotToken,
  getBallot
);

router.post('/vote',
  authenticateBallotToken,
  auditMiddleware('VOTE_CAST', 'vote'),
  [
    body('votes').isArray({ min: 1 }),
    body('votes.*.position_id').isInt(),
    body('votes.*.candidate_id').isInt()
  ],
  castVote
);

module.exports = router;