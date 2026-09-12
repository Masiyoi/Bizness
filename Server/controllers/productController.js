// controllers/productController.js
const db = require('../config/db');

// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
  complete_the_look: parseJson(p.complete_the_look),
  sale_price:   p.sale_price   ? parseFloat(p.sale_price)  : null,
  sale_ends_at: p.sale_ends_at ?? null,
  video_url:    p.video_url ?? null,
  rating:       p.rating != null ? parseFloat(p.rating) : null,
  review_count: p.review_count != null ? parseInt(p.review_count, 10) : 0,
});

// Reused by every listing query below to attach rating + review_count
const RATING_JOIN = `
  LEFT JOIN LATERAL (
    SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
    FROM reviews WHERE reviews.product_id = p.id
  ) rv ON true
  LEFT JOIN categories c ON c.id = p.category_id`;

const RATING_SELECT = `
  p.*, rv.avg_rating::float AS rating, COALESCE(rv.review_count, 0)::int AS review_count,
  c.gender AS category_gender, c.department AS category_department,
  c.slug AS category_slug, c.name AS category_name`;

// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
exports.getProducts = async (req, res) => {
  try {
    const { category, gender, department, search, sort } = req.query;

    let query  = `SELECT ${RATING_SELECT} FROM products p ${RATING_JOIN} WHERE 1=1`;
    const vals = [];

    if (category) {
      vals.push(category);
      query += ` AND p.category_id = (SELECT id FROM categories WHERE slug = $${vals.length})`;
    } else if (gender && department) {
      vals.push(gender);
      query += ` AND p.category_id IN (SELECT id FROM categories WHERE gender = $${vals.length}`;
      vals.push(department);
      query += ` AND department = $${vals.length})`;
    } else if (gender) {
      vals.push(gender);
      query += ` AND p.category_id IN (SELECT id FROM categories WHERE gender = $${vals.length})`;
    }

    if (search) {
      vals.push(`%${search}%`);
      query += ` AND p.name ILIKE $${vals.length}`;
    }

    query +=
      sort === 'price_asc'  ? ' ORDER BY p.price ASC'  :
      sort === 'price_desc' ? ' ORDER BY p.price DESC' :
                              ' ORDER BY p.created_at DESC';

    const result = await db.query(query, vals);
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products/:id  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products/:id  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

    // Ã¢â€â‚¬Ã¢â€â‚¬ Fetch variants Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

    res.json(product);
  } catch (err) {
    console.error('getProductById error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products/new-arrivals  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
exports.getNewArrivals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await db.query(
      `SELECT ${RATING_SELECT} FROM products p
       ${RATING_JOIN}
       WHERE p.created_at >= NOW() - INTERVAL '3 weeks'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getNewArrivals error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products/best-sellers  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
exports.getBestSellers = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    // Step 1 Ã¢â‚¬â€ pull all confirmed/delivered orders with their snapshots
    const ordersResult = await db.query(
      `SELECT items_snapshot FROM orders
       WHERE status NOT IN ('cancelled', 'pending')
       AND items_snapshot IS NOT NULL`
    );

    // Step 2 Ã¢â‚¬â€ count how many times each product_id appears across all orders
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

    // Step 3 Ã¢â‚¬â€ filter to only products bought 3 or more times
    const qualifyingIds = Object.entries(countMap)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)          // most bought first
      .slice(0, parseInt(limit))
      .map(([id]) => parseInt(id));

    if (qualifyingIds.length === 0) {
      return res.json([]);
    }

    // Step 4 Ã¢â‚¬â€ fetch the actual product rows in order of popularity
    // Using unnest to preserve the sort order from countMap
    const placeholders = qualifyingIds.map((_, i) => `$${i + 1}`).join(', ');
    const productsResult = await db.query(
      `SELECT ${RATING_SELECT} FROM products p
       ${RATING_JOIN}
       WHERE p.id IN (${placeholders})`,
      qualifyingIds
    );

    // Step 5 Ã¢â‚¬â€ re-sort by our countMap order (SQL IN doesn't guarantee order)
    const sorted = productsResult.rows
      .map(normaliseProduct)
      .map(p => ({ ...p, is_bestseller: true }))
      .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));

    res.json(sorted);

  } catch (err) {
    console.error('getBestSellers error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
// Ã¢â€â‚¬Ã¢â€â‚¬ GET /api/products/flash-sales  (public) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
exports.getFlashSales = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await db.query(
      `SELECT ${RATING_SELECT} FROM products p
       ${RATING_JOIN}
       WHERE p.sale_price IS NOT NULL
         AND p.sale_price < p.price
         AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
       ORDER BY (p.price - p.sale_price) DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getFlashSales error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
