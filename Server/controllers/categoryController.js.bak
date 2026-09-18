const db = require('../config/db');
// ── GET /api/categories/tree  (public) ────────────────────────────────────────
// Returns { men: { footwear: [...], clothing: [...] }, women: { footwear: [...], clothing: [...] } }
exports.getCategoryTree = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, gender, department, name, slug, sort_order
       FROM categories
       ORDER BY gender, department, sort_order`
    );
    const tree = {
      men:   { footwear: [], clothing: [] },
      women: { footwear: [], clothing: [] },
    };
    for (const row of result.rows) {
      tree[row.gender][row.department].push(row);
    }
    res.json(tree);
  } catch (err) {
    console.error('getCategoryTree error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
// ── GET /api/categories  (public, flat + filterable) ──────────────────────────
// Handy for admin cascading dropdowns: /api/categories?gender=men&department=footwear
exports.getCategoriesFlat = async (req, res) => {
  try {
    const { gender, department } = req.query;
    let query = `SELECT id, gender, department, name, slug, sort_order FROM categories WHERE 1=1`;
    const vals = [];
    if (gender)     { vals.push(gender);     query += ` AND gender = $${vals.length}`; }
    if (department) { vals.push(department); query += ` AND department = $${vals.length}`; }
    query += ` ORDER BY gender, department, sort_order`;
    const result = await db.query(query, vals);
    res.json(result.rows);
  } catch (err) {
    console.error('getCategoriesFlat error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};