const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { query } = require('../config/database');
const { auditLog } = require('../middleware/audit');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Import voters from CSV
const importVoters = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let processed = 0;

    // Convert buffer to readable stream
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        const { reg_no, name, email, phone, program, status } = data;

        if (!reg_no || !name) {
          errors.push({
            row: processed + 1,
            error: 'Missing required fields: reg_no or name'
          });
          processed++;
          return;
        }

        results.push({
          reg_no: reg_no.trim(),
          name: name.trim(),
          email: email ? email.trim() : null,
          phone: phone ? phone.trim() : null,
          program: program ? program.trim() : null,
          status: status && ['ELIGIBLE', 'BLOCKED'].includes(status.trim().toUpperCase())
            ? status.trim().toUpperCase()
            : 'ELIGIBLE'
        });
        processed++;
      })
      .on('end', async () => {
        try {
          let imported = 0;
          let skipped = 0;

          // Process each voter
          for (const voter of results) {
            try {
              // Check if voter already exists
              const existing = await query('SELECT id FROM eligible_voters WHERE reg_no = ?', [voter.reg_no]);

              if (existing.rows.length > 0) {
                // Update existing voter
                await query(
                  'UPDATE eligible_voters SET name = ?, email = ?, phone = ?, program = ?, status = ?, updated_at = datetime(\'now\') WHERE reg_no = ?',
                  [voter.name, voter.email, voter.phone, voter.program, voter.status, voter.reg_no]
                );
                skipped++;
              } else {
                // Insert new voter
                await query(
                  'INSERT INTO eligible_voters (reg_no, name, email, phone, program, status) VALUES (?, ?, ?, ?, ?, ?)',
                  [voter.reg_no, voter.name, voter.email, voter.phone, voter.program, voter.status]
                );
                imported++;
              }
            } catch (error) {
              errors.push({
                reg_no: voter.reg_no,
                error: error.message
              });
            }
          }

          await auditLog('user', req.user.id, 'VOTERS_IMPORTED', 'eligible_voters', null, {
            imported,
            skipped,
            errors: errors.length
          });

          res.json({
            message: `Import completed. ${imported} voters imported, ${skipped} updated, ${errors.length} errors.`,
            imported,
            skipped,
            errors
          });
        } catch (error) {
          res.status(500).json({ error: 'Failed to process voter data' });
        }
      })
      .on('error', (error) => {
        res.status(400).json({ error: 'Failed to parse CSV file' });
      });
  } catch (error) {
    res.status(500).json({ error: 'Import failed' });
  }
};

// Get all voters (admin only)
const getVoters = async (req, res) => {
  try {
    const result = await query('SELECT * FROM eligible_voters ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
};

router.post('/import',
  authenticateToken,
  requireRole(['admin']),
  upload.single('file'),
  importVoters
);

router.get('/',
  authenticateToken,
  requireRole(['admin']),
  getVoters
);

module.exports = router;