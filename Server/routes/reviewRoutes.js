// ─────────────────────────────────────────────────────────────
//  routes/reviewRoutes.js  ·  Luku Prime
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const notFound = (res, msg = 'Review not found') => res.status(404).json({ error: msg });
const badReq   = (res, msg)                       => res.status(400).json({ error: msg });

// ── Helper: extract product IDs from any snapshot shape ───────
// Your order controller stores: items_snapshot = { items: [...], shipping: {}, deliveryZone: "" }
// Each item may use: item.product_id  OR  item.id
function extractProductIds(snapshot) {
  if (!snapshot) return [];
  const ids = [];

  // Shape 1: { items: [ { product_id, ... } ] }  ← your current shape
  if (Array.isArray(snapshot.items)) {
    for (const item of snapshot.items) {
      const pid = item.product_id ?? item.id;
      if (pid != null) ids.push(Number(pid));
    }
    return ids;
  }

  // Shape 2: snapshot is directly an array  [ { product_id, ... } ]
  if (Array.isArray(snapshot)) {
    for (const item of snapshot) {
      const pid = item.product_id ?? item.id;
      if (pid != null) ids.push(Number(pid));
    }
    return ids;
  }

  return ids;
}

// ── GET /api/reviews/homepage ──────────────────────────────────
router.get('/homepage', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  try {
    const { rows } = await pool.query(
      `SELECT
         r.id, r.rating, r.comment, r.created_at,
         u.full_name,
         p.name       AS product_name,
         p.image_url  AS product_image,
         p.id         AS product_id
       FROM reviews r
       JOIN users    u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       WHERE r.rating >= 4
         AND r.comment IS NOT NULL
         AND LENGTH(TRIM(r.comment)) > 10
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /reviews/homepage', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/my ────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         r.id, r.rating, r.comment, r.created_at, r.updated_at,
         p.id         AS product_id,
         p.name       AS product_name,
         p.image_url  AS product_image,
         p.price      AS product_price,
         p.category   AS product_category
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.user_id = $1
       ORDER BY r.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /reviews/my', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/check/:productId ─────────────────────────
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, rating, comment, created_at, updated_at
       FROM reviews
       WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, req.params.productId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('GET /reviews/check', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/purchasable ──────────────────────────────
// Auth required. Products the user bought (non-cancelled) but hasn't reviewed yet.
router.get('/purchasable', auth, async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      `SELECT id, items_snapshot, status
       FROM orders
       WHERE user_id = $1
         AND status NOT IN ('cancelled')`,
      [req.user.id]
    );

    // Collect unique product IDs across all qualifying orders
    const productIdSet = new Set();
    for (const order of orders) {
      const ids = extractProductIds(order.items_snapshot);
      ids.forEach(id => productIdSet.add(id));
    }

    if (productIdSet.size === 0) return res.json([]);

    // Remove already-reviewed products
    const { rows: alreadyReviewed } = await pool.query(
      `SELECT product_id FROM reviews WHERE user_id = $1`,
      [req.user.id]
    );
    const reviewedSet = new Set(alreadyReviewed.map(r => Number(r.product_id)));
    const unreviewedIds = [...productIdSet].filter(id => !reviewedSet.has(id));

    if (unreviewedIds.length === 0) return res.json([]);

    const { rows: products } = await pool.query(
      `SELECT id, name, image_url, price, category
       FROM products
       WHERE id = ANY($1::int[])
       ORDER BY name`,
      [unreviewedIds]
    );

    res.json(products);
  } catch (err) {
    console.error('GET /reviews/purchasable', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/product/:productId ───────────────────────
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const [reviewsResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name, u.id AS user_id
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int                            AS total,
           ROUND(AVG(rating), 1)::float             AS average,
           COUNT(*) FILTER (WHERE rating = 5)::int  AS five,
           COUNT(*) FILTER (WHERE rating = 4)::int  AS four,
           COUNT(*) FILTER (WHERE rating = 3)::int  AS three,
           COUNT(*) FILTER (WHERE rating = 2)::int  AS two,
           COUNT(*) FILTER (WHERE rating = 1)::int  AS one
         FROM reviews WHERE product_id = $1`,
        [productId]
      ),
    ]);
    res.json({ reviews: reviewsResult.rows, stats: statsResult.rows[0] });
  } catch (err) {
    console.error('GET /reviews/product', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/admin/all ─────────────────────────────────
router.get('/admin/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { minRating = 1, maxRating = 5, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.full_name, u.email, p.name AS product_name, p.id AS product_id
       FROM reviews r
       JOIN users    u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       WHERE r.rating BETWEEN $1 AND $2
       ORDER BY r.created_at DESC
       LIMIT $3 OFFSET $4`,
      [minRating, maxRating, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /reviews/admin/all', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/reviews ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id)                         return badReq(res, 'product_id is required');
  if (!rating || rating < 1 || rating > 5) return badReq(res, 'rating must be 1–5');
  if (comment && comment.length > 1000)    return badReq(res, 'comment too long (max 1000 chars)');

  try {
    // Purchase check via items_snapshot
    const { rows: orders } = await pool.query(
      `SELECT items_snapshot FROM orders
       WHERE user_id = $1 AND status NOT IN ('cancelled')`,
      [req.user.id]
    );

    const hasPurchased = orders.some(order => {
      const ids = extractProductIds(order.items_snapshot);
      return ids.includes(Number(product_id));
    });

    if (!hasPurchased) {
      return res.status(403).json({
        error: 'You can only review products you have purchased.',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, rating, comment, created_at`,
      [req.user.id, product_id, rating, comment?.trim() || null]
    );
    res.status(201).json(rows[0]);

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'You have already reviewed this product. Use PATCH to update it.',
      });
    }
    console.error('POST /reviews', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/reviews/:id ─────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { rating, comment } = req.body;
  if (rating !== undefined && (rating < 1 || rating > 5)) return badReq(res, 'rating must be 1–5');
  if (comment && comment.length > 1000)                   return badReq(res, 'comment too long (max 1000 chars)');
  try {
    const { rows } = await pool.query(
      `UPDATE reviews
       SET rating  = COALESCE($1, rating),
           comment = COALESCE($2, comment)
       WHERE id = $3 AND user_id = $4
       RETURNING id, rating, comment, updated_at`,
      [rating || null, comment?.trim() || null, req.params.id, req.user.id]
    );
    if (!rows.length) return notFound(res);
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /reviews/:id', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/reviews/:id ────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query   = isAdmin
      ? `DELETE FROM reviews WHERE id = $1`
      : `DELETE FROM reviews WHERE id = $1 AND user_id = $2`;
    const params  = isAdmin ? [req.params.id] : [req.params.id, req.user.id];
    const { rowCount } = await pool.query(query, params);
    if (!rowCount) return notFound(res);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('DELETE /reviews/:id', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;