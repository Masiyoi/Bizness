const db = require('../config/db');
const { generateUniqueCouponCode } = require('../utils/generateCouponCode');

// POST /api/affiliate/salespersons
exports.createSalesperson = async (req, res) => {
  const { email, fullName, commissionPct } = req.body;
  try {
    if (!email || !fullName) {
      return res.status(400).json({ message: 'Email and fullName required' });
    }

    // Lookup user by email
    const { rows: userRows } = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );
    if (!userRows[0]) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Generate unique coupon code
    const code = await generateUniqueCouponCode(fullName);
    
    // Insert salesperson record
    const { rows } = await db.query(
      `INSERT INTO salespersons (user_id, coupon_code, commission_pct, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, coupon_code, commission_pct, status`,
      [userRows[0].id, code, commissionPct || 10.0]
    );

    res.status(201).json({ ...rows[0], message: `Added ${fullName}` });
  } catch (err) {
    console.error('createSalesperson error:', err);
    res.status(500).json({ message: 'Failed to create salesperson' });
  }
};

// GET /api/affiliate/salespersons
exports.listSalespersons = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        s.id, 
        s.coupon_code, 
        s.commission_pct, 
        s.status,
        u.name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        ) AS pending_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      GROUP BY s.id, u.id, u.name, u.email
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('listSalespersons error:', err);
    res.status(500).json({ message: 'Failed to load salespersons' });
  }
};

// PATCH /api/affiliate/salespersons/:id/payout
exports.markPaid = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE affiliate_earnings 
       SET payout_status = 'paid', paid_at = now()
       WHERE salesperson_id = $1 AND payout_status = 'pending'`,
      [id]
    );
    res.json({ message: 'Payout marked as paid' });
  } catch (err) {
    console.error('markPaid error:', err);
    res.status(500).json({ message: 'Failed to mark payout as paid' });
  }
};

// GET /api/affiliate/me
exports.getMyStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await db.query(`
      SELECT 
        s.id,
        s.coupon_code, 
        s.commission_pct, 
        s.status, 
        s.created_at,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        ) AS pending_balance
      FROM salespersons s
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id
    `, [userId]);

    if (!rows[0]) {
      return res.status(404).json({ isAffiliate: false });
    }
    
    res.json({ isAffiliate: true, ...rows[0] });
  } catch (err) {
    console.error('getMyStats error:', err);
    res.status(500).json({ message: 'Failed to fetch affiliate stats' });
  }
};