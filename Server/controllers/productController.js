// controllers/productController.js
const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseJson = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

const normaliseProduct = (p) => ({
  ...p,
  images:   parseJson(p.images),
  features: parseJson(p.features),
  colors:   parseJson(p.colors),
  sizes:    parseJson(p.sizes),
});

// ── GET /api/products  (public) ───────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let query  = `SELECT * FROM products WHERE 1=1`;
    const vals = [];

    if (category) {
      vals.push(category);
      query += ` AND category = $${vals.length}`;
    }

    if (search) {
      vals.push(`%${search}%`);
      query += ` AND name ILIKE $${vals.length}`;
    }

    query +=
      sort === 'price_asc'  ? ' ORDER BY price ASC'  :
      sort === 'price_desc' ? ' ORDER BY price DESC' :
                              ' ORDER BY created_at DESC';

    const result = await db.query(query, vals);
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/products/:id  (public) ──────────────────────────────────────────
// ── GET /api/products/:id  (public) ──────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = normaliseProduct(result.rows[0]);

    // ── Fetch variants ────────────────────────────────────────────────────
    const variantResult = await db.query(
      `SELECT id, product_id, color, size,
              stock::integer AS stock,
              sku, created_at
       FROM product_variants
       WHERE product_id = $1
       ORDER BY color, size`,
      [req.params.id]
    );

    product.variants = variantResult.rows;

    if (product.variants.length > 0) {
      product.colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
      product.sizes  = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
    }
    // ─────────────────────────────────────────────────────────────────────

    res.json(product);
  } catch (err) {
    console.error('getProductById error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/products/new-arrivals  (public) ──────────────────────────────────
exports.getNewArrivals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await db.query(
      `SELECT * FROM products
       WHERE created_at >= NOW() - INTERVAL '3 weeks'
       ORDER BY created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getNewArrivals error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/products/best-sellers  (public) ──────────────────────────────────
exports.getBestSellers = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    // Step 1 — pull all confirmed/delivered orders with their snapshots
    const ordersResult = await db.query(
      `SELECT items_snapshot FROM orders
       WHERE status NOT IN ('cancelled', 'pending')
       AND items_snapshot IS NOT NULL`
    );

    // Step 2 — count how many times each product_id appears across all orders
    const countMap = {};

    for (const row of ordersResult.rows) {
      let items = row.items_snapshot;

      // Parse if it came back as a string
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { continue; }
      }

      // Handle both array format and { items: [...] } object format
      if (!Array.isArray(items)) {
        if (Array.isArray(items?.items)) items = items.items;
        else continue;
      }

      for (const item of items) {
        const id = item.product_id ?? item.id ?? item.productId;
        if (!id) continue;
        const qty = parseInt(item.quantity) || 1;
        countMap[id] = (countMap[id] || 0) + qty;
      }
    }

    // Step 3 — filter to only products bought 3 or more times
    const qualifyingIds = Object.entries(countMap)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)          // most bought first
      .slice(0, parseInt(limit))
      .map(([id]) => parseInt(id));

    if (qualifyingIds.length === 0) {
      return res.json([]);
    }

    // Step 4 — fetch the actual product rows in order of popularity
    // Using unnest to preserve the sort order from countMap
    const placeholders = qualifyingIds.map((_, i) => `$${i + 1}`).join(', ');
    const productsResult = await db.query(
      `SELECT * FROM products
       WHERE id IN (${placeholders})`,
      qualifyingIds
    );

    // Step 5 — re-sort by our countMap order (SQL IN doesn't guarantee order)
    const sorted = productsResult.rows
      .map(normaliseProduct)
      .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));

    res.json(sorted);

  } catch (err) {
    console.error('getBestSellers error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};