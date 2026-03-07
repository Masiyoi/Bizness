const express = require('express');
const router = express.Router();
const {
  registerBuyer,
  loginUser,
  googleAuth,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const { check } = require('express-validator');

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    check('full_name', 'Full name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  ],
  registerBuyer
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  loginUser
);

// @route   POST /api/auth/google
router.post('/google', googleAuth);

// @route   GET /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

// @route   POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

module.exports = router;