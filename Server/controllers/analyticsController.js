// backend/controllers/analyticsController.js
// ─────────────────────────────────────────────────────────────────────────────
// All heavy-lifting analytics queries for the admin panel.
// Every endpoint expects req.user.role === 'admin' (enforced by adminMiddleware).
// ─────────────────────────────────────────────────────────────────────────────

const pool = require('../config/db');  // adjust path to your pg Pool instance

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse ?from / ?to query params.
 * Falls back to last 7 days if missing.
 */
function parseDateRange(query) {
  const to   = query.to   ? new Date(query.to)   : new Date();
  const from = query.from ? new Date(query.from)  : new Date(Date.now() - 6 * 86400000);

  // Clamp to full days
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);

  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Shift a date range back by the same number of days (for period comparison).
 */
function previousPeriod(from, to) {
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.round((t - f) / 86400000) + 1;
  const pTo   = new Date(f.getTime() - 1);              // day before from
  const pFrom = new Date(pTo.getTime() - (days - 1) * 86400000);
  pFrom.setHours(0, 0, 0, 0);
  pTo.setHours(23, 59, 59, 999);
  return { from: pFrom.toISOString(), to: pTo.toISOString() };
}

function pct(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
// Main analytics payload: revenue, category, top customers, AOV, comparisons.

async function getAnalytics(req, res) {
  try {
    const { from, to } = parseDateRange(req.query);
    const prev         = previousPeriod(from, to);

    // ── Revenue by day (with cost & profit) ──────────────────────────────────
    const revenueByDayQ = await pool.query(`
      SELECT
        DATE(o.created_at AT TIME ZONE 'Africa/Nairobi') AS day,
        COALESCE(SUM(o.total::numeric), 0)               AS revenue,
        COUNT(o.id)                                       AS orders,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(
             (item->>'quantity')::numeric *
             COALESCE(p.cost_price, 0)
           ), 0)
           FROM jsonb_array_elements(
             CASE
               WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
                 THEN o.items_snapshot::jsonb
               ELSE '[]'::jsonb
             END
           ) AS item
           LEFT JOIN products p ON p.id = (item->>'product_id')::int
          )
        ), 0) AS cost
      FROM orders o
      WHERE o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled')
      GROUP BY day
      ORDER BY day
    `, [from, to]);

    const revenueByDay = revenueByDayQ.rows.map(r => ({
      day:     r.day,
      revenue: r.revenue,
      orders:  r.orders,
      cost:    r.cost,
      profit:  parseFloat(r.revenue) - parseFloat(r.cost),
    }));

    // ── Category breakdown ────────────────────────────────────────────────────
    const categoryQ = await pool.query(`
      SELECT
        COALESCE(p.category, 'Uncategorised')   AS category,
        COALESCE(SUM(
          (item->>'quantity')::numeric * (item->>'price')::numeric
        ), 0)                                    AS revenue,
        COUNT(DISTINCT o.id)                     AS orders,
        COALESCE(SUM((item->>'quantity')::numeric), 0) AS units_sold,
        COALESCE(AVG((item->>'price')::numeric),  0)   AS avg_price,
        COALESCE(SUM(
          (item->>'quantity')::numeric * COALESCE(p.cost_price, 0)
        ), 0)                                    AS total_cost
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
            THEN o.items_snapshot::jsonb
          ELSE '[]'::jsonb
        END
      ) AS item
      LEFT JOIN products p ON p.id = (item->>'product_id')::int
      WHERE o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled')
      GROUP BY category
      ORDER BY revenue DESC
    `, [from, to]);

    const categoryStats = categoryQ.rows.map(r => {
      const revenue    = parseFloat(r.revenue);
      const total_cost = parseFloat(r.total_cost);
      const profit     = revenue - total_cost;
      return {
        category:   r.category,
        revenue,
        orders:     parseInt(r.orders),
        units_sold: parseInt(r.units_sold),
        avg_price:  parseFloat(r.avg_price),
        total_cost,
        profit,
        margin_pct: revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0,
      };
    });

    // ── Top 10 customers ──────────────────────────────────────────────────────
    const topCustomersQ = await pool.query(`
      SELECT
        u.id,
        u.full_name  AS name,
        u.email,
        COALESCE(SUM(o.total::numeric), 0)  AS total_spent,
        COUNT(o.id)                         AS order_count,
        COALESCE(AVG(o.total::numeric), 0)  AS avg_order,
        MAX(o.created_at)                   AS last_order
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled')
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_spent DESC
      LIMIT 10
    `, [from, to]);

    const topCustomers = topCustomersQ.rows.map(r => ({
      id:          r.id,
      name:        r.name,
      email:       r.email,
      total_spent: parseFloat(r.total_spent),
      order_count: parseInt(r.order_count),
      avg_order:   parseFloat(r.avg_order),
      last_order:  r.last_order,
    }));

    // ── AOV by day ────────────────────────────────────────────────────────────
    const aovQ = await pool.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Africa/Nairobi') AS day,
        COALESCE(AVG(total::numeric), 0)               AS aov,
        COUNT(id)                                      AS orders
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
        AND status NOT IN ('cancelled')
      GROUP BY day
      ORDER BY day
    `, [from, to]);

    const aovByDay = aovQ.rows.map(r => ({
      day:    r.day,
      aov:    parseFloat(r.aov),
      orders: parseInt(r.orders),
    }));

    // ── Current period totals ─────────────────────────────────────────────────
    const curQ = await pool.query(`
      SELECT
        COALESCE(SUM(total::numeric), 0) AS revenue,
        COUNT(id)                        AS orders,
        COALESCE(AVG(total::numeric), 0) AS aov
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
        AND status NOT IN ('cancelled')
    `, [from, to]);

    // ── Previous period totals ────────────────────────────────────────────────
    const prevQ = await pool.query(`
      SELECT
        COALESCE(SUM(total::numeric), 0) AS revenue,
        COUNT(id)                        AS orders,
        COALESCE(AVG(total::numeric), 0) AS aov
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
        AND status NOT IN ('cancelled')
    `, [prev.from, prev.to]);

    const cur  = curQ.rows[0];
    const prv  = prevQ.rows[0];

    res.json({
      revenueByDay,
      categoryStats,
      topCustomers,
      aovByDay,
      currentRevenue:  parseFloat(cur.revenue),
      previousRevenue: parseFloat(prv.revenue),
      currentOrders:   parseInt(cur.orders),
      previousOrders:  parseInt(prv.orders),
      currentAOV:      parseFloat(cur.aov),
      previousAOV:     parseFloat(prv.aov),
      revenueVsPrev:   pct(parseFloat(cur.revenue), parseFloat(prv.revenue)),
      ordersVsPrev:    pct(parseInt(cur.orders),    parseInt(prv.orders)),
      aovVsPrev:       pct(parseFloat(cur.aov),     parseFloat(prv.aov)),
      from,
      to,
    });
  } catch (err) {
    console.error('[analytics] getAnalytics:', err);
    res.status(500).json({ msg: 'Failed to fetch analytics' });
  }
}

// ── GET /api/admin/reports/sales ──────────────────────────────────────────────

async function getSalesReport(req, res) {
  try {
    const { from, to } = parseDateRange(req.query);

    const q = await pool.query(`
      SELECT
        o.id                                         AS order_id,
        o.created_at,
        u.full_name                                  AS customer_name,
        o.total::numeric                             AS total,
        o.status,
        o.delivery_zone,
        o.mpesa_receipt,
        (
          SELECT COUNT(*)
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
                THEN o.items_snapshot::jsonb
              ELSE '[]'::jsonb
            END
          )
        )                                            AS items_count,
        (
          SELECT COALESCE(SUM(
            (item->>'quantity')::numeric *
            COALESCE(p.cost_price, 0)
          ), 0)
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
                THEN o.items_snapshot::jsonb
              ELSE '[]'::jsonb
            END
          ) AS item
          LEFT JOIN products p ON p.id = (item->>'product_id')::int
        )                                            AS cost
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN $1 AND $2
      ORDER BY o.created_at DESC
    `, [from, to]);

    const rows = q.rows.map(r => {
      const total  = parseFloat(r.total);
      const cost   = parseFloat(r.cost);
      const profit = total - cost;
      return {
        order_id:      r.order_id,
        created_at:    r.created_at,
        customer_name: r.customer_name || 'Unknown',
        items_count:   parseInt(r.items_count),
        total,
        cost,
        profit,
        margin_pct:    total > 0 ? parseFloat(((profit / total) * 100).toFixed(1)) : 0,
        status:        r.status,
        delivery_zone: r.delivery_zone || '—',
        mpesa_receipt: r.mpesa_receipt || '—',
      };
    });

    const nonCancelled = rows.filter(r => r.status !== 'cancelled');
    const summary = {
      total_orders:  rows.length,
      total_revenue: nonCancelled.reduce((s, r) => s + r.total,  0),
      total_cost:    nonCancelled.reduce((s, r) => s + r.cost,   0),
      total_profit:  nonCancelled.reduce((s, r) => s + r.profit, 0),
      avg_order:     nonCancelled.length
        ? nonCancelled.reduce((s, r) => s + r.total, 0) / nonCancelled.length
        : 0,
      avg_margin: nonCancelled.length
        ? nonCancelled.reduce((s, r) => s + r.margin_pct, 0) / nonCancelled.length
        : 0,
    };

    res.json({ from, to, rows, summary });
  } catch (err) {
    console.error('[analytics] getSalesReport:', err);
    res.status(500).json({ msg: 'Failed to generate sales report' });
  }
}

// ── GET /api/admin/reports/inventory ─────────────────────────────────────────

async function getInventoryReport(req, res) {
  try {
    const q = await pool.query(`
      SELECT
        id,
        name,
        COALESCE(category, 'Uncategorised') AS category,
        COALESCE(stock, 0)                  AS stock,
        price::numeric                      AS price,
        cost_price::numeric                 AS cost_price
      FROM products
      ORDER BY stock ASC, name ASC
    `);

    let total_retail_value      = 0;
    let total_cost_value        = 0;
    let total_potential_profit  = 0;
    let margin_sum              = 0;
    let margin_count            = 0;
    let out_of_stock_count      = 0;
    let low_stock_count         = 0;

    const rows = q.rows.map(r => {
      const stock      = parseInt(r.stock);
      const price      = parseFloat(r.price);
      const cost       = r.cost_price ? parseFloat(r.cost_price) : null;
      const stock_val  = stock * price;
      const cost_val   = cost !== null ? stock * cost : 0;
      const pot_profit = cost !== null ? stock * (price - cost) : 0;
      const margin     = cost !== null && price > 0
        ? parseFloat((((price - cost) / price) * 100).toFixed(1))
        : null;

      total_retail_value     += stock_val;
      total_cost_value       += cost_val;
      total_potential_profit += pot_profit;
      if (margin !== null) { margin_sum += margin; margin_count++; }
      if (stock === 0) out_of_stock_count++;
      if (stock > 0 && stock <= 5) low_stock_count++;

      return {
        id: r.id,
        name: r.name,
        category: r.category,
        stock,
        price,
        cost_price:       cost,
        stock_value:      stock_val,
        cost_value:       cost_val,
        potential_profit: pot_profit,
        margin_pct:       margin,
      };
    });

    res.json({
      generated_at:           new Date().toISOString(),
      rows,
      total_retail_value,
      total_cost_value,
      total_potential_profit,
      avg_margin:             margin_count > 0 ? parseFloat((margin_sum / margin_count).toFixed(1)) : 0,
      out_of_stock_count,
      low_stock_count,
    });
  } catch (err) {
    console.error('[analytics] getInventoryReport:', err);
    res.status(500).json({ msg: 'Failed to generate inventory report' });
  }
}

// ── GET /api/admin/reports/profit ────────────────────────────────────────────

async function getProfitReport(req, res) {
  try {
    const { from, to } = parseDateRange(req.query);

    // Unpack items_snapshot JSON in Postgres and join products for cost_price.
    // Works for snapshot arrays like [{product_id, quantity, price}, ...]
    const q = await pool.query(`
      SELECT
        p.id                                                     AS product_id,
        p.name                                                   AS product_name,
        COALESCE(p.category, 'Uncategorised')                    AS category,
        SUM((item->>'quantity')::numeric)                        AS units_sold,
        SUM((item->>'quantity')::numeric * (item->>'price')::numeric) AS revenue,
        SUM((item->>'quantity')::numeric * COALESCE(p.cost_price, 0)) AS cost
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
            THEN o.items_snapshot::jsonb
          ELSE '[]'::jsonb
        END
      ) AS item
      LEFT JOIN products p ON p.id = (item->>'product_id')::int
      WHERE o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled')
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
    `, [from, to]);

    const rows = q.rows.map(r => {
      const revenue = parseFloat(r.revenue);
      const cost    = parseFloat(r.cost);
      const profit  = revenue - cost;
      return {
        product_id:   r.product_id,
        product_name: r.product_name || 'Unknown Product',
        category:     r.category,
        units_sold:   parseInt(r.units_sold),
        revenue,
        cost,
        profit,
        margin_pct: revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0,
      };
    });

    const summary = {
      total_revenue: rows.reduce((s, r) => s + r.revenue, 0),
      total_cost:    rows.reduce((s, r) => s + r.cost,    0),
      total_profit:  rows.reduce((s, r) => s + r.profit,  0),
      avg_margin:    rows.length
        ? parseFloat((rows.reduce((s, r) => s + r.margin_pct, 0) / rows.length).toFixed(1))
        : 0,
    };

    res.json({ from, to, rows, summary });
  } catch (err) {
    console.error('[analytics] getProfitReport:', err);
    res.status(500).json({ msg: 'Failed to generate profit report' });
  }
}

// ── PATCH /api/admin/products/:id/cost ───────────────────────────────────────

async function updateCostPrice(req, res) {
  const { id } = req.params;
  const { cost_price } = req.body;

  if (cost_price === undefined || cost_price === null || isNaN(parseFloat(cost_price))) {
    return res.status(400).json({ msg: 'cost_price must be a number' });
  }
  if (parseFloat(cost_price) < 0) {
    return res.status(400).json({ msg: 'cost_price cannot be negative' });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET    cost_price = $1
       WHERE  id         = $2
       RETURNING id, name, price, cost_price`,
      [parseFloat(cost_price), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[analytics] updateCostPrice:', err);
    res.status(500).json({ msg: 'Failed to update cost price' });
  }
}

module.exports = {
  getAnalytics,
  getSalesReport,
  getInventoryReport,
  getProfitReport,
  updateCostPrice,
};