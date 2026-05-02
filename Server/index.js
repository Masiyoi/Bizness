const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const helmet = require('helmet');

const productRoutes  = require('./routes/productRoutes');
const authRoutes     = require('./routes/authRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const paymentRoutes  = require('./routes/paymentRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');   // ← new
const reviewRoutes   = require('./routes/reviewRoutes');
const subscribersRoutes = require('./routes/subscribersRoutes');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

// 1. Define exactly who is allowed to talk to your API
const allowedOrigins = [
  'https://lukuprime.vercel.app', // Your live Vercel production site
  'http://localhost:5173'          // Keep this so you can still test locally!
];

// 2. Apply the CORS policy
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Crucial for your HTTP-only cookies/auth to work!
}));

app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // ← fixes Google popup
}));
app.use(express.json({ limit: '10kb' })); // prevent oversized payload attacks
app.set('trust proxy', 1);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders',   orderRoutes);    // ← new
app.use('/api',          adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews' ,  reviewRoutes);
app.use('/api/subscribers', subscribersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
