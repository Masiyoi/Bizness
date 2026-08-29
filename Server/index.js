const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const helmet = require('helmet');
const cron = require('node-cron');

// Routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reviewMediaRoutes = require('./routes/reviewMediaRoutes');
const subscribersRoutes = require('./routes/subscribersRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const discountRoutes = require('./routes/discountRoutes');
const membersRoutes = require('./routes/membersRoutes');
const usersRoutes = require('./routes/usersRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');

// Middleware
const auth = require('./middleware/auth');
const adminOnly = require('./middleware/adminOnly');

// Controllers
const { awardBirthdayBonuses } = require('./controllers/membersController');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

// Define allowed origins for CORS
const allowedOrigins = [
  'https://lukuprime.vercel.app',
  'https://lukuprime.shop',
  'https://www.lukuprime.shop',
  'http://localhost:5173',
  'https://bizness.onrender.com',
];

// Webhook paths (server-to-server, skip CORS)
// These are called by payment providers and don't have browser CORS headers
const webhookPaths = [
  '/api/payments/callback',
  '/api/payments/pesapal/ipn',
  '/api/payments/payhero/callback',
];

// CORS middleware with webhook bypass
app.use((req, res, next) => {
  if (webhookPaths.includes(req.path)) return next();

  return cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow curl/Postman/REST clients
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.app.github.dev')) return callback(null, true); // GitHub Codespaces
      callback(new Error('CORS blocked: ' + origin));
    },
    credentials: true,
  })(req, res, next);
});

// Security & parsing
app.use(express.json({ limit: '10kb' })); // payload limit prevents oversized attacks
app.use(cookieParser());
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // allows Google auth popup
}));
app.set('trust proxy', 1);

// ── API Routes ─────────────────────────────────────────────────────────────────

// Public routes (no auth required)
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reviews/media', reviewMediaRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/discount', discountRoutes);

// Protected routes (auth required)
app.use('/api/orders', orderRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Admin-only routes
app.use('/api', adminRoutes);
app.use('/api/admin', auth, adminOnly, analyticsRoutes);

// ── Scheduled Jobs ─────────────────────────────────────────────────────────────

/**
 * Birthday Bonus Cron Job
 * Runs daily at 07:00 Africa/Nairobi
 * Awards 50 club points to members whose birthday is today
 * Uses birthday_bonus_year guard to prevent double-awarding
 */
cron.schedule(
  '0 7 * * *',
  async () => {
    try {
      const { awarded } = await awardBirthdayBonuses();
      console.log(`[CRON] Birthday bonus: awarded ${awarded} member(s)`);
    } catch (err) {
      console.error('[CRON] Birthday bonus error:', err.message);
    }
  },
  { timezone: 'Africa/Nairobi' }
);

// ── Error Handling ─────────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Server Start ───────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;