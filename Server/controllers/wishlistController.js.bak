// controllers/wishlistController.js
// Wishlist endpoints — mirrors your cart controller pattern.
// Assumes: Express + pg (node-postgres) + JWT middleware that sets req.user = { id, ... }

const db = require('../config/db');
// GET /api/wishlist
// Returns all wishlist items for the logged-in user, joined with
// product details so the frontend gets everything in one request.
// ─────────────────────────────────────────────────────────────────
const getWishlist = async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await db.query(
      `SELECT
          w.id,
          w.product_id,
          w.created_at,
          p.name,
          p.price,
          p.image_url,
          p.description,
          p.category,
          p.stock
       FROM wishlist w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/wishlist
// Body: { product_id: number }
// Adds a product to the user's wishlist.
// Uses ON CONFLICT DO NOTHING so double-tapping the heart is safe.
// ─────────────────────────────────────────────────────────────────
const addToWishlist = async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, product_id, created_at`,
      [userId, product_id]
    );

    // If rows is empty the item was already in the wishlist — still a success
    res.status(201).json(rows[0] ?? { message: 'Already in wishlist' });
  } catch (err) {
    console.error('addToWishlist error:', err);
    // Foreign key violation means the product_id doesn't exist
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/wishlist/:productId
// Removes a single product from the user's wishlist.
// Uses product_id (not wishlist row id) so the frontend doesn't
// need to track the wishlist row id — same pattern as your cart.
// ─────────────────────────────────────────────────────────────────
const removeFromWishlist = async (req, res) => {
  const userId    = req.user.id;
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const { rowCount } = await db.query(
      `DELETE FROM wishlist
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Item not in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/wishlist
// Clears the entire wishlist for the logged-in user.
// Called by the "Clear All" button on the wishlist page.
// ─────────────────────────────────────────────────────────────────
const clearWishlist = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query(
      `DELETE FROM wishlist WHERE user_id = $1`,
      [userId]
    );
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('clearWishlist error:', err);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };