// Server/controllers/affiliateController.js
const pool = require('../db');
const { generateUniqueCouponCode } = require('../utils/generateCouponCode');

// POST /api/affiliate/salespersons  { userId, fullName, commissionPct? }
exports.createSalesperson = async (req, res) => {
  const { userId, fullName, commissionPct } = req.body;
  try {
    const code = await generateUniqueCouponCode(fullName);
    const { rows } = await pool.query(
      `INSERT INTO salespersons (user_id, coupon_code, commission_pct)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, code, commissionPct || 10.00]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create salesperson' });
  }
};

// GET /api/affiliate/salespersons  (admin list w/ aggregated stats)
exports.listSalespersons = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.id, s.coupon_code, s.commission_pct, s.status,
           u.name, u.email,
           COUNT(e.id) AS total_sales,
           COALESCE(SUM(e.commission_amount), 0) AS total_earned,
           COALESCE(SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 0) AS pending_balance
    FROM salespersons s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
    GROUP BY s.id, u.name, u.email
    ORDER BY s.created_at DESC
  `);
  res.json(rows);
};

// PATCH /api/affiliate/salespersons/:id/payout  (mark pending earnings as paid)
exports.markPaid = async (req, res) => {
  const { id } = req.params;
  await pool.query(
    `UPDATE affiliate_earnings SET payout_status = 'paid', paid_at = now()
     WHERE salesperson_id = $1 AND payout_status = 'pending'`,
    [id]
  );
  res.json({ message: 'Payout marked as paid' });
};
// createSalesperson — swap userId for an email lookup
exports.createSalesperson = async (req, res) => {
  const { email, fullName, commissionPct } = req.body;
  try {
    const { rows: userRows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (!userRows[0]) return res.status(404).json({ message: 'No user found with that email' });

    const code = await generateUniqueCouponCode(fullName);
    const { rows } = await pool.query(
      `INSERT INTO salespersons (user_id, coupon_code, commission_pct)
       VALUES ($1, $2, $3) RETURNING *`,
      [userRows[0].id, code, commissionPct || 10.00]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create salesperson' });
  }
};

// GET /api/affiliate/me — logged-in user's own affiliate stats
exports.getMyStats = async (req, res) => {
  const userId = req.user.id; // adjust to however req.user is set in your auth middleware
  try {
    const { rows } = await pool.query(`
      SELECT s.coupon_code, s.commission_pct, s.status, s.created_at,
             COUNT(e.id) AS total_sales,
             COALESCE(SUM(e.commission_amount), 0) AS total_earned,
             COALESCE(SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 0) AS pending_balance
      FROM salespersons s
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id
    `, [userId]);

    if (!rows[0]) return res.status(404).json({ isAffiliate: false });
    res.json({ isAffiliate: true, ...rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch affiliate stats' });
  }
};
