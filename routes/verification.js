const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { auditMiddleware } = require('../middleware/audit');
const { requestOTP, verifyOTP } = require('../controllers/verificationController');
const router = express.Router();

// Temporarily disable rate limiting for development
const otpRateLimit = (req, res, next) => next();

router.post('/request-otp',
  otpRateLimit,
  auditMiddleware('OTP_REQUEST', 'verification'),
  [body('reg_no').trim().isLength({ min: 1 })],
  requestOTP
);

router.post('/verify-otp',
  auditMiddleware('OTP_VERIFY', 'verification'),
  [
    body('verification_id').isInt(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  verifyOTP
);

module.exports = router;