const express = require('express');
const cors    = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const productRoutes  = require('./routes/productRoutes');
const authRoutes     = require('./routes/authRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const paymentRoutes  = require('./routes/paymentRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');   // ← new
const reviewRoutes   = require('./routes/reviewRoutes');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders',   orderRoutes);    // ← new
app.use('/api',          adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/review' ,  reviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));