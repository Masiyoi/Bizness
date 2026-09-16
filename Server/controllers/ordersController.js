const db = require('../config/db');
const { sendMetaEvent } = require('../services/metaCapi');

// ── GET /api/orders/reserve-number  — reserve the next order number ─────────
/**
 * Pulls the next value from the order_number sequence and formats it the
 * same way the DB trigger (trg_generate_order_number) does, WITHOUT
 * inserting an orders row. The frontend calls this once when the checkout
 * summary loads so it can display the order number before payment starts.
 * The reserved value is then threaded through stk-push / pesapal-initiate
 * and set explicitly on the eventual INSERT INTO orders — the trigger only
 * fires when order_number IS NULL, so it just no-ops there.
 *
 * Also fires the InitiateCheckout CAPI event, since this is the one place
 * in the checkout flow guaranteed to run exactly once per checkout attempt,
 * with full req context (IP, user-agent, _fbc/_fbp cookies) available.
 */
exports.reserveOrderNumber = async (req, res) => {
  let orderNumber;
  try {
    const result = await db.query(`SELECT nextval('orders_order_number_seq') AS n`);
    orderNumber = 'ON-' + String(result.rows[0].n).padStart(6, '0');
  } catch (err) {
    console.error('reserveOrderNumber error:', err.message);
    return res.status(500).json({ msg: 'Failed to reserve order number' });
  }

  // ── InitiateCheckout CAPI event ─────────────────────────────────────────
  // Fire-and-forget, in its own try/catch — a Meta API hiccup or a bad cart
  // query here must never fail the order-number reservation itself.
  try {
    const cartRes = await db.query(
      `SELECT ci.quantity, ci.product_id,
              CASE
                WHEN p.sale_price IS NOT NULL
                 AND p.sale_price < p.price
                 AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
                THEN p.sale_price
                ELSE p.price
              END AS effective_price
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    const value = cartRes.rows.reduce(
      (sum, row) => sum + Number(row.effective_price) * row.quantity, 0
    );

    sendMetaEvent({
      eventName: 'InitiateCheckout',
      eventId: `ic-${orderNumber}`,
      req,
      userData: {
        email: req.user.email,
        phone: req.user.phone,
      },
      customData: {
        currency: 'KES',
        value,
        content_ids: cartRes.rows.map(r => r.product_id),
        num_items: cartRes.rows.reduce((n, r) => n + r.quantity, 0),
      },
    }).catch(() => {});
  } catch (err) {
    console.error('InitiateCheckout CAPI error:', err.message);
  }

  return res.json({ reserved_order_number: orderNumber });
};

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
         o.discount_type,
         o.discount_amount,
         o.affiliate_code,
         p.mpesa_receipt,
         p.phone,
         p.amount AS paid_amount,
         o.order_number,
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
        order_number:     row.order_number,
        user_order_number: parseInt(row.user_order_number), // e.g. 1, 2, 3...
        created_at:       row.created_at,
        updated_at:       row.updated_at,
        status:           row.status,
        tracking_status:  row.tracking_status,
        total_amount:     row.total,
        discount_type:    row.discount_type,
        discount_amount:  row.discount_amount ? Number(row.discount_amount) : 0,
        affiliate_code:   row.affiliate_code,
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
         o.discount_type,
         o.discount_amount,
         o.affiliate_code,
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
      discount_type:     row.discount_type,
      discount_amount:   row.discount_amount ? Number(row.discount_amount) : 0,
      affiliate_code:    row.affiliate_code,
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