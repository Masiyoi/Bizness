const db = require('../config/db');

// ── Helper: get or create cart for user ──────────────────────────────────────
const getOrCreateCart = async (userId) => {
  let result = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]
    );
  }
  return result.rows[0].id;
};

// GET /api/cart  — fetch all items in user's cart
exports.getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const result = await db.query(
      `SELECT ci.id, ci.quantity, ci.product_id,
              p.name, p.price, p.image_url, p.category
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cartId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/cart  — add item (or increment quantity)
exports.addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ msg: 'product_id is required' });
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const result = await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [cartId, product_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addToCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PATCH /api/cart/:itemId  — update quantity
exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;
  if (!quantity || quantity < 1) return res.status(400).json({ msg: 'Invalid quantity' });
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const result = await db.query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND cart_id = $3
       RETURNING *`,
      [quantity, itemId, cartId]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCartItem error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/cart/:itemId  — remove one item
exports.removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2',
      [itemId, cartId]
    );
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error('removeCartItem error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/cart  — clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ msg: 'Cart cleared' });
  } catch (err) {
    console.error('clearCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};