const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');
const { body }     = require('express-validator');
const authCtrl     = require('../controllers/authController');

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { msg: 'Too many login attempts. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: true,       // only count failures
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // 1 hour
  max:      10,
  message:  { msg: 'Too many accounts created from this IP. Please try again later.' },
});

const resendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,          // 10 minutes
  max:      3,
  message:  { msg: 'Too many resend requests. Please wait 10 minutes.' },
});

// ── Validators ────────────────────────────────────────────────────────────────
const loginValidation = [
  body('email').isEmail().normalizeEmail().isLength({ max: 254 }),
  body('password').notEmpty().isLength({ max: 128 }),
];

const registerValidation = [
  body('full_name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().isLength({ max: 254 }),
  body('password').isLength({ min: 8, max: 128 })
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
];

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      5,
  message:  { msg: 'Too many reset requests. Please wait 15 minutes and try again.' },
});
 
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  { msg: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/login',               loginLimiter,    loginValidation,    authCtrl.loginUser);
router.post('/register',            registerLimiter, registerValidation, authCtrl.registerBuyer);
router.post('/google',                                                   authCtrl.googleAuth);
router.get('/verify-email/:token',                                       authCtrl.verifyEmail);
router.post('/resend-verification', resendLimiter,                       authCtrl.resendVerification);
router.post('/forgot-password',          forgotPasswordLimiter, authCtrl.forgotPassword);
router.get('/reset-password/:token',                            authCtrl.validateResetToken);
router.post('/reset-password/:token',    resetPasswordLimiter,  authCtrl.resetPassword);

module.exports = router;