const db = require('../config/db');

// ── GET /api/orders  — all orders for the logged-in user ─────────────────────
exports.getOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT
         o.id,
         o.created_at,
         o.updated_at,
         o.status,
         o.tracking_status,
         o.total,
         o.delivery_fee,
         o.delivery_zone,
         o.items_snapshot,
         p.mpesa_receipt,
         p.phone,
         p.amount AS paid_amount,
         ROW_NUMBER() OVER (
           PARTITION BY o.user_id
           ORDER BY o.created_at ASC
         ) AS user_order_number
       FROM orders o
       LEFT JOIN payments p ON p.id = o.payment_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = result.rows.map(row => {
      const snapshot = row.items_snapshot || {};
      return {
        id:               row.id,
        user_order_number: parseInt(row.user_order_number), // e.g. 1, 2, 3...
        created_at:       row.created_at,
        updated_at:       row.updated_at,
        status:           row.status,
        tracking_status:  row.tracking_status,
        total_amount:     row.total,
        delivery_fee:     row.delivery_fee,
        delivery_zone:    row.delivery_zone,
        mpesa_receipt:    row.mpesa_receipt,
        phone:            row.phone,
        items:            Array.isArray(snapshot.items) ? snapshot.items : [],
        shipping:         snapshot.shipping || null,
        snapshot_zone:    snapshot.deliveryZone || row.delivery_zone,
      };
    });

    return res.json(orders);
  } catch (err) {
    console.error('getOrders error:', err.message);
    return res.status(500).json({ msg: 'Failed to fetch orders' });
  }
};

// ── GET /api/orders/:id  — single order (must belong to user) ────────────────
exports.getOrderById = async (req, res) => {
  const userId  = req.user.id;
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return res.status(400).json({ msg: 'Invalid order ID' });
  }

  try {
    const result = await db.query(
      `SELECT
         o.id,
         o.created_at,
         o.updated_at,
         o.status,
         o.tracking_status,
         o.total,
         o.delivery_fee,
         o.delivery_zone,
         o.items_snapshot,
         p.mpesa_receipt,
         p.phone,
         p.amount AS paid_amount,
         ROW_NUMBER() OVER (
           PARTITION BY o.user_id
           ORDER BY o.created_at ASC
         ) AS user_order_number
       FROM orders o
       LEFT JOIN payments p ON p.id = o.payment_id
       WHERE o.id = $1 AND o.user_id = $2`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const row      = result.rows[0];
    const snapshot = row.items_snapshot || {};

    return res.json({
      id:                row.id,
      user_order_number: parseInt(row.user_order_number),
      created_at:        row.created_at,
      updated_at:        row.updated_at,
      status:            row.status,
      tracking_status:   row.tracking_status,
      total_amount:      row.total,
      delivery_fee:      row.delivery_fee,
      delivery_zone:     row.delivery_zone,
      mpesa_receipt:     row.mpesa_receipt,
      phone:             row.phone,
      items:             Array.isArray(snapshot.items) ? snapshot.items : [],
      shipping:          snapshot.shipping || null,
    });
  } catch (err) {
    console.error('getOrderById error:', err.message);
    return res.status(500).json({ msg: 'Failed to fetch order' });
  }
};