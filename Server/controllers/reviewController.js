// ─────────────────────────────────────────────────────────────
//  reviewController.js  ·  Luku Prime Reviews API
//  Mount in your router:  app.use('/api/reviews', reviewRouter)
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');          // your pg Pool instance
const auth    = require('../middleware/auth'); // JWT middleware → sets req.user

// ── helpers ────────────────────────────────────────────────────
const notFound = (res, msg = 'Review not found') => res.status(404).json({ error: msg });
const badReq   = (res, msg)                       => res.status(400).json({ error: msg });

// ── GET /api/reviews/product/:productId ────────────────────────
// Public. Returns all reviews + aggregate stats for a product.
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const [reviewsResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT
           r.id,
           r.rating,
           r.comment,
           r.created_at,
           u.full_name,
           u.id AS user_id
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int                          AS total,
           ROUND(AVG(rating), 1)::float           AS average,
           COUNT(*) FILTER (WHERE rating = 5)::int AS five,
           COUNT(*) FILTER (WHERE rating = 4)::int AS four,
           COUNT(*) FILTER (WHERE rating = 3)::int AS three,
           COUNT(*) FILTER (WHERE rating = 2)::int AS two,
           COUNT(*) FILTER (WHERE rating = 1)::int AS one
         FROM reviews
         WHERE product_id = $1`,
        [productId]
      ),
    ]);

    res.json({
      reviews:    reviewsResult.rows,
      stats:      statsResult.rows[0],
    });
  } catch (err) {
    console.error('GET /reviews/product', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/homepage ──────────────────────────────────
// Public. Returns the latest N high-rated reviews for the homepage
// showcase (default: 12, configurable via ?limit=N).
router.get('/homepage', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  try {
    const { rows } = await db.query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         u.full_name,
         p.name  AS product_name,
         p.image_url AS product_image,
         p.id    AS product_id
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
// Auth required. Returns all reviews written by the logged-in user.
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         r.updated_at,
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
// Auth required. Returns the current user's review for a product
// (or null). Useful to pre-fill the review form.
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
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

// ── POST /api/reviews ──────────────────────────────────────────
// Auth required. Create a new review (one per user per product).
router.post('/', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id)                              return badReq(res, 'product_id is required');
  if (!rating || rating < 1 || rating > 5)      return badReq(res, 'rating must be 1–5');
  if (comment && comment.length > 1000)         return badReq(res, 'comment too long (max 1000 chars)');

  // Only buyers who ordered the product can review it
  const orderCheck = await db.query(
    `SELECT 1 FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1
       AND oi.product_id = $2
       AND o.status NOT IN ('cancelled')
     LIMIT 1`,
    [req.user.id, product_id]
  ).catch(() => ({ rows: [] }));

  if (!orderCheck.rows.length) {
    return res.status(403).json({ error: 'You can only review products you have purchased.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, rating, comment, created_at`,
      [req.user.id, product_id, rating, comment?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {             // unique violation
      return res.status(409).json({ error: 'You have already reviewed this product. Use PATCH to update.' });
    }
    console.error('POST /reviews', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/reviews/:id ─────────────────────────────────────
// Auth required. Update own review's rating and/or comment.
router.patch('/:id', auth, async (req, res) => {
  const { rating, comment } = req.body;
  const reviewId = req.params.id;

  if (rating !== undefined && (rating < 1 || rating > 5)) return badReq(res, 'rating must be 1–5');
  if (comment && comment.length > 1000)                   return badReq(res, 'comment too long (max 1000 chars)');

  try {
    const { rows } = await db.query(
      `UPDATE reviews
       SET
         rating  = COALESCE($1, rating),
         comment = COALESCE($2, comment)
       WHERE id = $3 AND user_id = $4
       RETURNING id, rating, comment, updated_at`,
      [rating || null, comment?.trim() || null, reviewId, req.user.id]
    );
    if (!rows.length) return notFound(res);
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /reviews/:id', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/reviews/:id ────────────────────────────────────
// Auth required. Delete own review (admins can delete any review).
router.delete('/:id', auth, async (req, res) => {
  try {
    const condition = req.user.role === 'admin'
      ? 'WHERE id = $1'
      : 'WHERE id = $1 AND user_id = $2';
    const params = req.user.role === 'admin'
      ? [req.params.id]
      : [req.params.id, req.user.id];

    const { rowCount } = await pool.query(
      `DELETE FROM reviews ${condition}`,
      params
    );
    if (!rowCount) return notFound(res);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('DELETE /reviews/:id', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reviews/admin/all ─────────────────────────────────
// Admin only. Full list with user + product info, filterable.
router.get('/admin/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { minRating = 1, maxRating = 5, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(
      `SELECT
         r.id, r.rating, r.comment, r.created_at,
         u.full_name, u.email,
         p.name AS product_name, p.id AS product_id
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

module.exports = router;