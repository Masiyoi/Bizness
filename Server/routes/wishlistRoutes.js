// routes/wishlist.js
// Register this in your main app.js / server.js

const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth'); // your existing JWT middleware
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require('../controllers/wishlistController');

// All wishlist routes require a valid JWT
router.get   ('/',           auth, getWishlist);
router.post  ('/',           auth, addToWishlist);
router.delete('/:productId', auth, removeFromWishlist);
router.delete('/',           auth, clearWishlist);

module.exports = router;

// ─── In your app.js / server.js add: ────────────────────────────
// const wishlistRoutes = require('./routes/wishlist');
// app.use('/api/wishlist', wishlistRoutes);