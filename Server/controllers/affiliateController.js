const db = require('../config/db');
const { generateUniqueCouponCode } = require('../utils/generateCouponCode');

// POST /api/affiliate/salespersons
// Create a new affiliate salesperson (admin only)
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

    const userId = userRows[0].id;

    // Check if user is already an affiliate (prevents duplicates)
    const { rows: existingRows } = await db.query(
      `SELECT id FROM salespersons WHERE user_id = $1`,
      [userId]
    );
    if (existingRows[0]) {
      return res.status(409).json({ message: 'User is already an affiliate' });
    }

    // Generate unique coupon code
    const code = await generateUniqueCouponCode(fullName);
    
    // Insert salesperson record
    const { rows } = await db.query(
      `INSERT INTO salespersons (user_id, coupon_code, commission_pct, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, user_id, coupon_code, commission_pct, status, created_at`,
      [userId, code, commissionPct || 10.0]
    );

    res.status(201).json({
      message: `Added ${fullName} as affiliate`,
      data: rows[0]
    });
  } catch (err) {
    console.error('createSalesperson error:', err);
    res.status(500).json({ message: 'Failed to create salesperson' });
  }
};

// GET /api/affiliate/salespersons
// List all salespersons with earnings summary (admin only)
exports.listSalespersons = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        s.id, 
        s.user_id,
        s.coupon_code, 
        s.commission_pct, 
        s.status,
        s.created_at,
        u.full_name AS name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'paid'), 
          0
        )::NUMERIC(10,2) AS paid_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      GROUP BY s.id, s.user_id, u.id, u.full_name, u.email, s.coupon_code, s.commission_pct, s.status, s.created_at
      ORDER BY s.created_at DESC
    `);
    res.json({
      message: 'Salespersons loaded',
      data: rows
    });
  } catch (err) {
    console.error('listSalespersons error:', err);
    res.status(500).json({ message: 'Failed to load salespersons' });
  }
};

// GET /api/affiliate/salespersons/:id
// Get single salesperson details (admin only)
exports.getSalesperson = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT 
        s.id, 
        s.user_id,
        s.coupon_code, 
        s.commission_pct, 
        s.status,
        s.created_at,
        u.full_name AS name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.id = $1
      GROUP BY s.id, s.user_id, u.id, u.full_name, u.email
    `, [id]);

    if (!rows[0]) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    res.json({
      message: 'Salesperson loaded',
      data: rows[0]
    });
  } catch (err) {
    console.error('getSalesperson error:', err);
    res.status(500).json({ message: 'Failed to fetch salesperson' });
  }
};

// PATCH /api/affiliate/salespersons/:id
// Update salesperson details (admin only)
exports.updateSalesperson = async (req, res) => {
  const { id } = req.params;
  const { commissionPct, status } = req.body;
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (commissionPct !== undefined) {
      updates.push(`commission_pct = $${paramCount++}`);
      values.push(commissionPct);
    }

    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE salespersons 
      SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${paramCount}
      RETURNING id, coupon_code, commission_pct, status, updated_at
    `;

    const { rows } = await db.query(query, values);

    if (!rows[0]) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    res.json({
      message: 'Salesperson updated',
      data: rows[0]
    });
  } catch (err) {
    console.error('updateSalesperson error:', err);
    res.status(500).json({ message: 'Failed to update salesperson' });
  }
};

// PATCH /api/affiliate/salespersons/:id/payout
// Mark pending earnings as paid (admin only, with ownership verification)
exports.markPaid = async (req, res) => {
  const { id } = req.params;
  try {
    // Verify salesperson exists
    const { rows: ownerCheck } = await db.query(
      `SELECT id FROM salespersons WHERE id = $1`,
      [id]
    );
    if (!ownerCheck[0]) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    // Mark all pending earnings as paid
    const { rowCount } = await db.query(
      `UPDATE affiliate_earnings 
       SET payout_status = 'paid', paid_at = now()
       WHERE salesperson_id = $1 AND payout_status = 'pending'`,
      [id]
    );

    res.json({
      message: `Marked ${rowCount} earnings record(s) as paid`,
      recordsUpdated: rowCount
    });
  } catch (err) {
    console.error('markPaid error:', err);
    res.status(500).json({ message: 'Failed to mark payout as paid' });
  }
};

// GET /api/affiliate/me
// Get current user's affiliate stats
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
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'paid'), 
          0
        )::NUMERIC(10,2) AS paid_balance
      FROM salespersons s
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id
    `, [userId]);

    if (!rows[0]) {
      return res.status(200).json({ 
        message: 'Not an affiliate',
        isAffiliate: false 
      });
    }
    
    res.json({ 
      message: 'Affiliate stats loaded',
      isAffiliate: true, 
      data: rows[0] 
    });
  } catch (err) {
    console.error('getMyStats error:', err);
    res.status(500).json({ message: 'Failed to fetch affiliate stats' });
  }
};

// GET /api/affiliate/me/earnings
// Get current user's earnings history
exports.getMyEarnings = async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await db.query(`
      SELECT 
        e.id,
        e.order_id,
        e.commission_amount,
        e.commission_pct,
        e.payout_status,
        e.created_at,
        e.paid_at,
        o.total_price,
        o.created_at AS order_date
      FROM affiliate_earnings e
      JOIN orders o ON o.id = e.order_id
      JOIN salespersons s ON s.id = e.salesperson_id
      WHERE s.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT 100
    `, [userId]);

    res.json({
      message: 'Earnings history loaded',
      data: rows
    });
  } catch (err) {
    console.error('getMyEarnings error:', err);
    res.status(500).json({ message: 'Failed to fetch earnings history' });
  }
};

// GET /api/affiliate/salespersons/:id/orders
// Paginated order history for one salesperson, with optional month filter (admin only)
exports.getSalespersonOrders = async (req, res) => {
  const { id } = req.params;
  const { month, limit = 5, offset = 0 } = req.query;
  try {
    const params = [id];
    let monthClause = '';
    if (month) {
      params.push(`${month}-01`);
      monthClause = `AND date_trunc('month', o.created_at) = date_trunc('month', $${params.length}::date)`;
    }
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) AS total
       FROM affiliate_earnings e
       JOIN orders o ON o.id = e.order_id
       WHERE e.salesperson_id = $1
       ${monthClause}`,
      params
    );
    params.push(Number(limit));
    params.push(Number(offset));
    const { rows } = await db.query(
      `SELECT
         e.id          AS earning_id,
         e.commission_amount,
         e.payout_status,
         e.created_at  AS earning_created_at,
         o.id          AS order_id,
         o.order_number,
         o.total,
         o.created_at  AS order_date,
         o.items_snapshot
       FROM affiliate_earnings e
       JOIN orders o ON o.id = e.order_id
       WHERE e.salesperson_id = $1
       ${monthClause}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({
      message: 'Order history loaded',
      data: rows,
      total: parseInt(countRows[0].total, 10)
    });
  } catch (err) {
    console.error('getSalespersonOrders error:', err);
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
};
module.exports = exports;