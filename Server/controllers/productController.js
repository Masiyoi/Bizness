const db = require('../config/db');

// Helper — safely parse a JSON column that might already be an array
const parseJson = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

// @desc  Get all products
// @route GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');

    const products = result.rows.map(p => ({
      ...p,
      images:   parseJson(p.images),
      features: parseJson(p.features),
      colors:   parseJson(p.colors),          // ← this is what was missing
    }));

    res.status(200).json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc  Get single product
// @route GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = result.rows[0];
    res.status(200).json({
      ...p,
      images:   parseJson(p.images),
      features: parseJson(p.features),
      colors:   parseJson(p.colors),          // ← same fix here
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};