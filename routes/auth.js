const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'officer', 'candidate', 'voter']),
  body('name').trim().isLength({ min: 2 })
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], login);

module.exports = router;