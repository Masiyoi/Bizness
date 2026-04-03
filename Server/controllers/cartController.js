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
      `SELECT ci.id, ci.quantity, ci.product_id, ci.selected_color, ci.selected_size,
              p.name, p.price, p.image_url, p.category,
              p.colors, p.sizes
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cartId]
    );

    // Parse colors and sizes from JSON string to array if needed
    const parseJsonArr = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch { return []; }
    };

    const rows = result.rows.map(row => ({
      ...row,
      colors: parseJsonArr(row.colors),
      sizes:  parseJsonArr(row.sizes),
    }));

    res.json(rows);
  } catch (err) {
    console.error('getCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/cart  — add item (with color + size awareness)
exports.addToCart = async (req, res) => {
  const {
    product_id,
    quantity = 1,
    selected_color = null,
    selected_size = null,
  } = req.body;

  if (!product_id) return res.status(400).json({ msg: 'product_id is required' });

  try {
    const cartId = await getOrCreateCart(req.user.id);

    // Check if the exact same product + color + size combo already exists
    const existing = await db.query(
      `SELECT * FROM cart_items
       WHERE cart_id = $1
         AND product_id = $2
         AND COALESCE(selected_color, '') = COALESCE($3, '')
         AND COALESCE(selected_size,  '') = COALESCE($4, '')`,
      [cartId, product_id, selected_color, selected_size]
    );

    if (existing.rows.length > 0) {
      // Same variant already in cart — increment quantity
      const updated = await db.query(
        `UPDATE cart_items
         SET quantity = quantity + $1
         WHERE id = $2
         RETURNING *`,
        [quantity, existing.rows[0].id]
      );
      return res.status(200).json(updated.rows[0]);
    }

    // New variant — insert fresh row
    const result = await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, selected_color, selected_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cartId, product_id, quantity, selected_color, selected_size]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addToCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PATCH /api/cart/:itemId  — update quantity, color, or size of a cart item
exports.updateCartItem = async (req, res) => {
  const { quantity, selected_color, selected_size } = req.body;
  const { itemId } = req.params;

  if (!quantity || quantity < 1) return res.status(400).json({ msg: 'Invalid quantity' });

  try {
    const cartId = await getOrCreateCart(req.user.id);

    // Check if changing color/size would collide with another existing row
    const collision = await db.query(
      `SELECT * FROM cart_items
       WHERE cart_id = $1
         AND product_id = (SELECT product_id FROM cart_items WHERE id = $2)
         AND COALESCE(selected_color, '') = COALESCE($3, '')
         AND COALESCE(selected_size,  '') = COALESCE($4, '')
         AND id != $2`,
      [cartId, itemId, selected_color, selected_size]
    );

    if (collision.rows.length > 0) {
      // Merge into the colliding row and delete the current one
      await db.query(
        `UPDATE cart_items
         SET quantity = quantity + $1
         WHERE id = $2`,
        [quantity, collision.rows[0].id]
      );
      await db.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
      const merged = await db.query('SELECT * FROM cart_items WHERE id = $1', [collision.rows[0].id]);
      return res.status(200).json({ merged: true, item: merged.rows[0] });
    }

    // No collision — straightforward update
    const result = await db.query(
      `UPDATE cart_items
       SET quantity = $1, selected_color = $2, selected_size = $3
       WHERE id = $4 AND cart_id = $5
       RETURNING *`,
      [quantity, selected_color, selected_size, itemId, cartId]
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