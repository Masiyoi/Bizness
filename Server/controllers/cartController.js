const db = require('../config/db');
const { sendMetaEvent } = require('../services/metaCapi');
const { logActivity } = require('../services/activityLogger');

// â”€â”€ Helper: get or create cart for user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getOrCreateCart = async (userId) => {
  let result = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]
    );
  }
  return result.rows[0].id;
};

// GET /api/cart  â€” fetch all items in user's cart
exports.getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const result = await db.query(
      `SELECT ci.id, ci.quantity, ci.product_id, ci.selected_color, ci.selected_size,
              p.name, p.price, p.image_url, p.category,
              p.colors, p.sizes, c.slug AS category_slug
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
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

// POST /api/cart  â€” add item (with color + size awareness)
exports.addToCart = async (req, res) => {
  let {
    product_id,
    quantity = 1,
    selected_color = null,
    selected_size = null,
    event_id = null,
  } = req.body;

  if (!product_id) return res.status(400).json({ msg: 'product_id is required' });

  try {
    const cartId = await getOrCreateCart(req.user.id);

    // Quick-add paths send no variant. If the product has exactly one variant, use it.
    if (!selected_color && !selected_size) {
      const vr = await db.query(
        'SELECT color, size FROM product_variants WHERE product_id = $1 LIMIT 2',
        [product_id]
      );
      if (vr.rows.length === 1) {
        selected_color = vr.rows[0].color || null;
        selected_size  = vr.rows[0].size  || null;
      }
    }
    // Check if the exact same product + color + size combo already exists
    const existing = await db.query(
      `SELECT * FROM cart_items
       WHERE cart_id = $1
         AND product_id = $2
         AND COALESCE(selected_color, '') = COALESCE($3, '')
         AND COALESCE(selected_size,  '') = COALESCE($4, '')`,
      [cartId, product_id, selected_color, selected_size]
    );

    // â”€â”€ Fetch product price for the AddToCart event value â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Needed regardless of the increment/insert branch below, so pulled once
    // up front rather than duplicated in both.
    const productRes = await db.query(
      `SELECT name, price, sale_price, sale_ends_at
       FROM products WHERE id = $1`,
      [product_id]
    );
    const product = productRes.rows[0];
    const effectivePrice = product && product.sale_price != null
      && Number(product.sale_price) < Number(product.price)
      && (!product.sale_ends_at || new Date(product.sale_ends_at) > new Date())
      ? Number(product.sale_price)
      : Number(product?.price || 0);

    let responseRow;
    let responseStatus;

    if (existing.rows.length > 0) {
      // Same variant already in cart â€” increment quantity
      const updated = await db.query(
        `UPDATE cart_items
         SET quantity = quantity + $1
         WHERE id = $2
         RETURNING *`,
        [quantity, existing.rows[0].id]
      );
      responseRow = updated.rows[0];
      responseStatus = 200;
    } else {
      // New variant â€” insert fresh row
      const result = await db.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, selected_color, selected_size)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [cartId, product_id, quantity, selected_color, selected_size]
      );
      responseRow = result.rows[0];
      responseStatus = 201;
    }

    // â”€â”€ AddToCart CAPI event â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Fire-and-forget â€” never let a Meta API hiccup block or fail the cart add.
    sendMetaEvent({
      eventName: 'AddToCart',
      eventId: event_id || `atc-${req.user.id}-${product_id}-${Date.now()}`,
      req,
      userData: {
        email: req.user.email,
        phone: req.user.phone,
      },
      customData: {
        currency: 'KES',
        value: effectivePrice * Number(quantity),
        variantItems: [{ product_id, color: selected_color, size: selected_size }],
        content_name: product?.name,
      },
    }).catch(() => {});

    logActivity({
      userId: req.user.id,
      eventType: 'cart_add',
      metadata: { product_id, quantity, selected_color, selected_size },
      req,
    }).catch(() => {});
    res.status(responseStatus).json(responseRow);
  } catch (err) {
    console.error('addToCart error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PATCH /api/cart/:itemId  â€” update quantity, color, or size of a cart item
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

    // No collision â€” straightforward update
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

// DELETE /api/cart/:itemId  â€” remove one item
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

// DELETE /api/cart  â€” clear entire cart
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
// POST /api/cart/meta-checkout - fill the logged-in user's cart from a Meta checkout URL
// Body: { products: "172-5:2,163:1", coupon: "CODE" }
// Catalog ids are "<productId>-<variantId>" (product has variants) or "<productId>".
// Non-destructive and idempotent: existing lines are set to the requested quantity,
// other lines in the cart are left alone, so opening the link twice cannot double items.
const META_MAX_LINES = 25;
const META_MAX_QTY   = 10;
exports.metaCheckout = async (req, res) => {
  const rawProducts = req.body && req.body.products;
  const rawCoupon   = req.body && req.body.coupon;
  const entries = (Array.isArray(rawProducts) ? rawProducts.map(String) : String(rawProducts || '').split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  if (entries.length === 0) return res.status(400).json({ msg: 'No products supplied' });
  if (entries.length > META_MAX_LINES) return res.status(400).json({ msg: 'Too many items in one checkout link' });
  const skipped = [];
  const wanted  = new Map();
  for (const entry of entries) {
    const m = /^(\d+)(?:-(\d+))?:(\d+)$/.exec(entry);
    if (!m) { skipped.push({ id: entry, reason: 'malformed' }); continue; }
    const qty = parseInt(m[3], 10);
    const id  = entry.split(':')[0];
    if (qty < 1) { skipped.push({ id, reason: 'bad_quantity' }); continue; }
    const productId = Number(m[1]);
    const variantId = m[2] ? Number(m[2]) : null;
    const key  = productId + '-' + (variantId === null ? '' : variantId);
    const prev = wanted.get(key);
    wanted.set(key, { id, productId, variantId, requested: (prev ? prev.requested : 0) + qty });
  }
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const added  = [];
    for (const w of wanted.values()) {
      const pr = await db.query('SELECT id, stock_quantity, stock FROM products WHERE id = $1', [w.productId]);
      if (pr.rows.length === 0) { skipped.push({ id: w.id, reason: 'unknown_product' }); continue; }
      const vr = await db.query('SELECT id, color, size, stock FROM product_variants WHERE product_id = $1', [w.productId]);
      let color = null;
      let size  = null;
      let available;
      if (w.variantId !== null) {
        const v = vr.rows.find((r) => Number(r.id) === w.variantId);
        if (!v) { skipped.push({ id: w.id, reason: 'unknown_variant' }); continue; }
        color = v.color || null;
        size  = v.size  || null;
        available = Number(v.stock);
      } else if (vr.rows.length === 0) {
        available = Number(pr.rows[0].stock_quantity ?? pr.rows[0].stock ?? 0);
      } else if (vr.rows.length === 1) {
        // Single-variant product sent without a variant id: unambiguous (same rule as addToCart).
        color = vr.rows[0].color || null;
        size  = vr.rows[0].size  || null;
        available = Number(vr.rows[0].stock);
      } else {
        skipped.push({ id: w.id, reason: 'variant_required' });
        continue;
      }
      if (!(available > 0)) { skipped.push({ id: w.id, reason: 'out_of_stock' }); continue; }
      const quantity = Math.min(w.requested, available, META_MAX_QTY);
      const existing = await db.query(
        `SELECT id FROM cart_items
         WHERE cart_id = $1 AND product_id = $2
           AND COALESCE(selected_color, '') = COALESCE($3, '')
           AND COALESCE(selected_size,  '') = COALESCE($4, '')`,
        [cartId, w.productId, color, size]
      );
      if (existing.rows.length > 0) {
        await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, existing.rows[0].id]);
      } else {
        await db.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity, selected_color, selected_size)
           VALUES ($1, $2, $3, $4, $5)`,
          [cartId, w.productId, quantity, color, size]
        );
      }
      added.push({
        id: w.id, product_id: w.productId, variant_id: w.variantId,
        color, size, quantity, requested: w.requested, adjusted: quantity < w.requested,
      });
    }
    if (added.length === 0) return res.status(422).json({ msg: 'None of the items in this link are available', skipped });
    // The same coupon value can be a salesperson (affiliate) code and/or a member discount code.
    // Affiliate codes are validated here; the frontend checks discount codes via /api/discount/preview.
    const coupon = String(rawCoupon || '').trim().toUpperCase().slice(0, 64) || null;
    let affiliateCode = null;
    if (coupon) {
      const sp = await db.query(
        `SELECT coupon_code FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,
        [coupon]
      );
      if (sp.rows.length > 0) affiliateCode = sp.rows[0].coupon_code;
    }
    logActivity({
      userId: req.user.id,
      eventType: 'meta_checkout_link',
      metadata: { lines: added.length, skipped: skipped.length, coupon },
      req,
    }).catch(() => {});
    return res.json({ added, skipped, coupon, affiliate_code: affiliateCode });
  } catch (err) {
    console.error('metaCheckout error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};
// DELETE /api/cart/product/:productId - remove every line of a product (card toggle buttons)
exports.removeCartByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await db.query(
      'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error('removeCartByProduct error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};