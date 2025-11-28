const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getTurnout, getResults, getAuditLog, exportData } = require('../controllers/reportsController');
const router = express.Router();

router.get('/turnout',
  authenticateToken,
  requireRole(['admin', 'officer']),
  getTurnout
);

router.get('/results',
  authenticateToken,
  requireRole(['admin', 'officer']),
  getResults
);

router.get('/audit',
  authenticateToken,
  requireRole(['admin']),
  getAuditLog
);

router.get('/export/:type',
  authenticateToken,
  requireRole(['admin', 'officer']),
  exportData
);

module.exports = router;