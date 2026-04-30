const db         = require('../config/db');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES     = 30;
const MAX_EMAIL_LENGTH    = 254;   // RFC 5321
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH     = 100;
const RECAPTCHA_MIN_SCORE = 0.5;
const RESET_TOKEN_EXPIRY_MINUTES = 30

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

const sendPasswordResetEmail = async (email, fullName, token) => {
  const transporter = createTransporter();   // reuse your existing createTransporter()
  const resetUrl    = `${process.env.CLIENT_URL}/#/reset-password/${token}`;
 
  await transporter.sendMail({
    from:    `"Luku Prime" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Reset your Luku Prime password',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0D1B3E;border-radius:12px;overflow:hidden;">
        <div style="padding:28px 36px;text-align:center;">
          <h1 style="color:#C8A951;margin:0;font-size:24px;font-family:'Georgia',serif;">Luku Prime</h1>
        </div>
        <div style="padding:32px 36px;background:#fff;">
          <h2 style="color:#0D1B3E;margin:0 0 12px;font-size:20px;">Hi ${fullName} 👋</h2>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 10px;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <p style="color:#999;font-size:13px;margin:0 0 28px;">
            This link expires in <strong>${RESET_TOKEN_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:#C8A951;color:#0D1B3E;text-decoration:none;
                      padding:14px 36px;border-radius:40px;font-weight:700;font-size:15px;">
              Reset My Password →
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.<br/>
            Your password will <strong>not</strong> change unless you click the link above.
          </p>
        </div>
        <div style="background:#152348;padding:16px 36px;text-align:center;">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© 2025 Luku Prime · Kenya's Premium Store</p>
        </div>
      </div>
    `,
  });
};
// Constant-time string comparison to prevent timing attacks
const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    // Still do a comparison to avoid timing differences
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// ── reCAPTCHA v3 verification ─────────────────────────────────────────────────
const verifyRecaptcha = async (token) => {
  if (!token) return false;
  try {
    const params = new URLSearchParams({
      secret:   process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    });
    const res  = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      body:   params,
    });
    const data = await res.json();
    // data.score is 0.0–1.0; 1.0 = very likely human
    return data.success && data.score >= RECAPTCHA_MIN_SCORE;
  } catch {
    return false;
  }
};

// ── Account lockout helpers ───────────────────────────────────────────────────
const recordFailedLogin = async (userId) => {
  await db.query(
    `UPDATE users
     SET failed_login_attempts = failed_login_attempts + 1,
         last_failed_at = NOW(),
         locked_until = CASE
           WHEN failed_login_attempts + 1 >= $1
           THEN NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes'
           ELSE locked_until
         END
     WHERE id = $2`,
    [MAX_FAILED_ATTEMPTS, userId]
  );
};

const clearFailedLogins = async (userId) => {
  await db.query(
    `UPDATE users
     SET failed_login_attempts = 0,
         locked_until = NULL,
         last_failed_at = NULL
     WHERE id = $1`,
    [userId]
  );
};

const isAccountLocked = (user) => {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
};

// ── Verification email ────────────────────────────────────────────────────────
const sendVerificationEmail = async (email, fullName, token) => {
  const transporter = createTransporter();
  const verifyUrl   = `${process.env.CLIENT_URL}/#/verify-email/${token}`;
  await transporter.sendMail({
    from:    `"Luku Prime" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Verify your Luku Prime account',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0D1B3E;border-radius:12px;overflow:hidden;">
        <div style="padding:28px 36px;text-align:center;">
          <h1 style="color:#C8A951;margin:0;font-size:24px;">Luku Prime</h1>
        </div>
        <div style="padding:32px 36px;background:#fff;">
          <h2 style="color:#0D1B3E;margin:0 0 12px;">Hi ${fullName} 👋</h2>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Click below to verify your email and activate your account.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${verifyUrl}"
               style="display:inline-block;background:#C8A951;color:#0D1B3E;text-decoration:none;
                      padding:14px 36px;border-radius:40px;font-weight:700;font-size:15px;">
              Verify My Email →
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;">
            Link expires in <strong>24 hours</strong>. Ignore if you didn't sign up.
          </p>
        </div>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
exports.registerBuyer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { full_name, email, password, recaptchaToken } = req.body;

  // ── Character limits ──────────────────────────────────────────────────────
  if (!full_name || full_name.trim().length > MAX_NAME_LENGTH)
    return res.status(400).json({ msg: `Name must be under ${MAX_NAME_LENGTH} characters.` });
  if (!email || email.length > MAX_EMAIL_LENGTH)
    return res.status(400).json({ msg: 'Invalid email address.' });
  if (!password || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH)
    return res.status(400).json({ msg: `Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters.` });

  // ── reCAPTCHA ─────────────────────────────────────────────────────────────
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk)
    return res.status(400).json({ msg: 'reCAPTCHA verification failed. Please try again.' });

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(400).json({ msg: 'An account with this email already exists.' });

    const salt          = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const verToken      = crypto.randomBytes(32).toString('hex');
    const verExpiry     = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await sendVerificationEmail(email, full_name.trim(), verToken);
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
      return res.status(500).json({ msg: 'Could not send verification email. Please try again.' });
    }

    await db.query(
      `INSERT INTO users (full_name, email, password_hash, verification_token, verification_token_expiry, is_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [full_name.trim(), email.toLowerCase(), password_hash, verToken, verExpiry]
    );

    return res.status(201).json({
      msg: `Verification link sent to ${email}. Check your inbox.`,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, recaptchaToken } = req.body;

  // ── Character limits ──────────────────────────────────────────────────────
  if (!email || email.length > MAX_EMAIL_LENGTH)
    return res.status(400).json({ msg: 'Invalid email address.' });
  if (!password || password.length > MAX_PASSWORD_LENGTH)
    return res.status(400).json({ msg: 'Invalid credentials.' });

  // ── reCAPTCHA ─────────────────────────────────────────────────────────────
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk)
    return res.status(400).json({ msg: 'reCAPTCHA verification failed. Please try again.' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    // Generic message — don't reveal whether email exists
    if (result.rows.length === 0) {
      // Still run a fake bcrypt to prevent timing attacks
      await bcrypt.compare(password, '$2b$12$invalidhashpadding000000000000000000000000000000000000');
      return res.status(400).json({ msg: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // ── Lockout check ─────────────────────────────────────────────────────
    if (isAccountLocked(user)) {
      const lockedUntil = new Date(user.locked_until);
      const minutesLeft = Math.ceil((lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        msg: `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        locked: true,
        lockedUntil: lockedUntil.toISOString(),
      });
    }

    if (!user.password_hash)
      return res.status(400).json({ msg: 'This account uses Google Sign-In. Please log in with Google.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await recordFailedLogin(user.id);
      // How many attempts remain before lockout
      const attemptsLeft = MAX_FAILED_ATTEMPTS - (user.failed_login_attempts + 1);
      const msg = attemptsLeft <= 0
        ? `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
        : `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`;
      return res.status(400).json({ msg });
    }

    if (!user.is_verified)
      return res.status(403).json({
        msg: 'Please verify your email before logging in.',
        unverified: true,
      });

    // ── Success — clear failed attempts ───────────────────────────────────
    await clearFailedLogins(user.id);
    const token = generateToken(user.id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      token,
      user: {
        id:              user.id,
        full_name:       user.full_name,
        email:           user.email,
        is_verified:     user.is_verified,
        role:            user.role,
        profile_picture: user.profile_picture,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE AUTH  (unchanged — Google handles its own bot protection)
// ─────────────────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ msg: 'Google credential is required.' });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    // Double-check audience claim
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID)
      return res.status(401).json({ msg: 'Invalid Google token audience.' });

    const { sub: google_id, email, name: full_name, picture } = payload;

    let result = await db.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [google_id, email.toLowerCase()]
    );
    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2', [google_id, user.id]);
        user.google_id = google_id; user.is_verified = true;
      }
    } else {
      const newUser = await db.query(
        `INSERT INTO users (full_name, email, google_id, is_verified, profile_picture)
         VALUES ($1, $2, $3, TRUE, $4) RETURNING id, full_name, email, is_verified, role, profile_picture`,
        [full_name, email.toLowerCase(), google_id, picture]
      );
      user = newUser.rows[0];
    }
    const token = generateToken(user.id, user.role);
    res.cookie('token', token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'strict', maxAge:7*24*60*60*1000 });
    return res.json({ token, user: { id:user.id, full_name:user.full_name, email:user.email, is_verified:user.is_verified, role:user.role, profile_picture:user.profile_picture } });
  } catch (err) {
    console.error('Google auth error:', err.message);
    return res.status(401).json({ msg: 'Google authentication failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL / RESEND  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE verification_token = $1 AND verification_token_expiry > NOW() AND is_verified = FALSE`,
      [token]
    );
    if (!result.rows.length)
      return res.status(400).json({ msg: 'Verification link is invalid or has expired.' });
    await db.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL WHERE id = $1`,
      [result.rows[0].id]
    );
    return res.json({ msg: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email || email.length > MAX_EMAIL_LENGTH) return res.status(400).json({ msg: 'Valid email required.' });
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1 AND is_verified = FALSE', [email.toLowerCase()]);
    // Always return the same message — don't reveal if email is registered
    if (!result.rows.length)
      return res.json({ msg: 'If that email is registered and unverified, we sent a new link.' });
    const user     = result.rows[0];
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query('UPDATE users SET verification_token = $1, verification_token_expiry = $2 WHERE id = $3', [newToken, newExpiry, user.id]);
    await sendVerificationEmail(user.email, user.full_name, newToken);
    return res.json({ msg: 'Verification email resent! Check your inbox.' });
  } catch (err) {
    console.error('Resend error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

 exports.forgotPassword = async (req, res) => {
  const { email, recaptchaToken } = req.body;
 
  // Character limit
  if (!email || email.length > 254)
    return res.status(400).json({ msg: 'Valid email required.' });
 
  // reCAPTCHA (reuse your existing verifyRecaptcha helper)
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk)
    return res.status(400).json({ msg: 'reCAPTCHA verification failed. Please try again.' });
 
  try {
    const result = await db.query(
      'SELECT id, full_name, email FROM users WHERE email = $1 AND is_verified = TRUE',
      [email.toLowerCase()]
    );
 
    // Always return success — never reveal whether email is registered
    if (!result.rows.length) {
      return res.json({ msg: 'If that email is registered, a reset link is on its way.' });
    }
 
    const user       = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry     = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
 
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiry, user.id]
    );
 
    await sendPasswordResetEmail(user.email, user.full_name, resetToken);
 
    return res.json({ msg: 'If that email is registered, a reset link is on its way.' });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};
 
// ─── VALIDATE RESET TOKEN ─────────────────────────────────────────────────────
// GET /api/auth/reset-password/:token
// Called by the frontend on mount to check if the token is still valid before
// showing the new-password form.
exports.validateResetToken = async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ msg: 'Token required.' });
 
  try {
    const result = await db.query(
      `SELECT id FROM users
       WHERE reset_token = $1
         AND reset_token_expiry > NOW()`,
      [token]
    );
 
    if (!result.rows.length)
      return res.status(400).json({ msg: 'Reset link is invalid or has expired.' });
 
    return res.json({ valid: true });
  } catch (err) {
    console.error('validateResetToken error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};
 
// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// Body: { password }
exports.resetPassword = async (req, res) => {
  const { token }    = req.params;
  const { password } = req.body;
 
  // Length + complexity checks
  if (!password || password.length < 8 || password.length > 128)
    return res.status(400).json({ msg: 'Password must be 8–128 characters.' });
  if (!/[A-Z]/.test(password))
    return res.status(400).json({ msg: 'Password must contain at least one uppercase letter.' });
  if (!/[0-9]/.test(password))
    return res.status(400).json({ msg: 'Password must contain at least one number.' });
 
  try {
    const result = await db.query(
      `SELECT id FROM users
       WHERE reset_token = $1
         AND reset_token_expiry > NOW()`,
      [token]
    );
 
    if (!result.rows.length)
      return res.status(400).json({ msg: 'Reset link is invalid or has expired.' });
 
    const userId       = result.rows[0].id;
    const salt         = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
 
    await db.query(
      `UPDATE users
       SET password_hash      = $1,
           reset_token        = NULL,
           reset_token_expiry = NULL,
           -- also clear any lockout from failed logins
           failed_login_attempts = 0,
           locked_until          = NULL,
           last_failed_at        = NULL,
           updated_at            = NOW()
       WHERE id = $2`,
      [password_hash, userId]
    );
 
    return res.json({ msg: 'Password reset successfully! You can now sign in.' });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ msg: 'Logged out.' });
};