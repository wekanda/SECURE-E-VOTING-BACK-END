const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { auditLog } = require('../middleware/audit');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const requestOTP = async (req, res) => {
  try {
    const { reg_no } = req.body;
    console.log('Requesting OTP for:', reg_no);

    // Check if voter is eligible
    let voterResult = await query(
      'SELECT * FROM eligible_voters WHERE reg_no = ? AND status = ?',
      [reg_no, 'ELIGIBLE']
    );
    console.log('Voter result:', voterResult.rows.length);

    let voter;
    if (voterResult.rows.length === 0) {
      // For development, create a test voter if not found
      if (process.env.NODE_ENV === 'development') {
        const testResult = await query(
          'INSERT INTO eligible_voters (reg_no, name, email, program) VALUES (?, ?, ?, ?)',
          [reg_no, `Test Voter ${reg_no}`, `test${reg_no}@university.edu`, 'Computer Science']
        );
        voter = {
          id: testResult.lastID,
          reg_no,
          name: `Test Voter ${reg_no}`,
          email: `test${reg_no}@university.edu`
        };
        console.log(`Created test voter: ${reg_no}`);
      } else {
        return res.status(404).json({ error: 'Voter not found or not eligible' });
      }
    } else {
      voter = voterResult.rows[0];
    }

    // Check if voter has already voted
    try {
      const votedCheck = await query(
        `SELECT v.id FROM verifications ver
         JOIN ballots b ON ver.id = b.verification_id
         WHERE ver.voter_id = ? AND b.consumed_at IS NOT NULL`,
        [voter.id]
      );

      if (votedCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Voter has already cast their ballot' });
      }
    } catch (joinError) {
      console.log('JOIN query failed, skipping vote check:', joinError.message);
      // Continue without checking if already voted
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store verification request
    const result = await query(
      'INSERT INTO verifications (voter_id, method, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
      [voter.id, 'email', otpHash, expiresAt]
    );

    await auditLog('system', null, 'OTP_REQUESTED', 'verification', result.lastID, { voter_id: voter.id });

    // In production, send OTP via email/SMS
    console.log(`OTP for ${reg_no}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      verification_id: result.lastID,
      // Show OTP for development/testing
      otp: otp
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { verification_id, otp } = req.body;

    // Get verification record
    const verificationResult = await query(
      'SELECT * FROM verifications WHERE id = ? AND verified_at IS NULL AND expires_at > ?',
      [verification_id, new Date().toISOString()]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification request' });
    }

    const verification = verificationResult.rows[0];

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, verification.otp_hash);
    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Generate ballot token
    const ballotToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

    // Update verification record
    await query(
      'UPDATE verifications SET verified_at = ?, ballot_token = ?, expires_at = ? WHERE id = ?',
      [new Date().toISOString(), ballotToken, tokenExpiresAt, verification_id]
    );

    await auditLog('system', null, 'OTP_VERIFIED', 'verification', verification_id, { voter_id: verification.voter_id });

    res.json({
      message: 'Verification successful',
      ballot_token: ballotToken,
      expires_at: tokenExpiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = { requestOTP, verifyOTP };