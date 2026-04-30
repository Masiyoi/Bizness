const axios = require('axios');
const db    = require('../config/db');

// ── Pesapal base URLs ─────────────────────────────────────────────────────────
const PESAPAL_BASE = process.env.PESAPAL_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Authenticate with Pesapal and return a Bearer token.
 * Tokens are valid for 5 minutes — fetch fresh on every request (simple & safe).
 */
const getPesapalToken = async () => {
  const res = await axios.post(
    `${PESAPAL_BASE}/api/Auth/RequestToken`,
    {
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );

  if (!res.data.token) throw new Error('Pesapal auth failed: no token returned');
  return res.data.token;
};

/**
 * Register (or re-register) your IPN URL with Pesapal.
 * Returns the notification_id needed when submitting orders.
 * Call this once at server start or whenever your IPN URL changes.
 */
const registerIPN = async (token) => {
  const res = await axios.post(
    `${PESAPAL_BASE}/api/URLSetup/RegisterIPN`,
    {
      url:                   process.env.PESAPAL_IPN_URL,  // e.g. https://yoursite.com/api/payments/pesapal/ipn
      ipn_notification_type: 'POST',
    },
    {
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
    }
  );

  if (!res.data.ipn_id) throw new Error('IPN registration failed');
  return res.data.ipn_id;
};

// ── POST /api/payments/pesapal/initiate ───────────────────────────────────────
/**
 * Creates a Pesapal order and returns a redirect_url.
 * The frontend redirects the customer there (or embeds it in an iframe).
 *
 * Body: { amount, delivery_zone, delivery_fee, shipping, selectedColors, selectedSizes }
 */
exports.initiatePayment = async (req, res) => {
  const {
    amount,
    delivery_zone,
    delivery_fee,
    shipping       = {},
    selectedColors = {},
    selectedSizes  = {},
  } = req.body;
  const userId = req.user.id;

  if (!amount) return res.status(400).json({ msg: 'Amount is required' });

  const roundedAmount = Math.ceil(Number(amount));

  // Generate a unique merchant reference for this order
  const merchantReference = `PP-${userId}-${Date.now()}`;

  try {
    const token = await getPesapalToken();

    // Get (or refresh) the IPN notification id
    // In production you'd cache this; for simplicity we re-register on each call
    // (Pesapal deduplicates by URL so this is safe)
    const notificationId = await registerIPN(token);

    const orderPayload = {
      id:           merchantReference,
      currency:     'KES',
      amount:       roundedAmount,
      description:  'LukuPrime Order',
      callback_url: process.env.PESAPAL_CALLBACK_URL,  // e.g. https://yoursite.com/payment-complete
      redirect_mode: '',                                // '' = redirect | 'TOP_WINDOW' = same tab
      notification_id: notificationId,
      branch: 'LukuPrime',
      billing_address: {
        email_address: shipping.email       || '',
        phone_number:  shipping.phone       || '',
        country_code:  'KE',
        first_name:    shipping.firstName   || 'Customer',
        last_name:     shipping.lastName    || '',
        line_1:        shipping.address     || '',
        city:          shipping.city        || '',
      },
    };

    const orderRes = await axios.post(
      `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
      orderPayload,
      {
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
      }
    );

    const { order_tracking_id, redirect_url, status, error } = orderRes.data;

    if (error || !redirect_url) {
      console.error('Pesapal order error:', orderRes.data);
      return res.status(400).json({ msg: error?.message || 'Failed to create Pesapal order' });
    }

    // Persist a pending payment row — mirrors your M-Pesa pattern
    await db.query(
      `INSERT INTO payments
         (user_id, checkout_request_id, merchant_request_id, amount, phone,
          status, delivery_zone, delivery_fee, shipping_meta, payment_method)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, 'pesapal')
       ON CONFLICT (checkout_request_id) DO NOTHING`,
      [
        userId,
        order_tracking_id,           // reuse checkout_request_id column for tracking
        merchantReference,           // reuse merchant_request_id column
        roundedAmount,
        shipping.phone || '',
        delivery_zone  || 'cbd',
        delivery_fee   || 0,
        JSON.stringify({ shipping, selectedColors, selectedSizes, delivery_zone, delivery_fee }),
      ]
    );

    return res.json({
      msg:             'Redirect customer to the payment page.',
      redirectUrl:     redirect_url,
      orderTrackingId: order_tracking_id,
      merchantReference,
    });
  } catch (err) {
    console.error('Pesapal initiate error:', err.response?.data || err.message);
    return res.status(500).json({ msg: 'Payment initiation failed. Try again.' });
  }
};

// ── POST /api/payments/pesapal/ipn  (called by Pesapal servers) ───────────────
/**
 * Pesapal posts here whenever a transaction status changes.
 * We MUST respond 200 immediately, then verify and fulfil the order.
 */
exports.pesapalIPN = async (req, res) => {
  // Always acknowledge immediately so Pesapal stops retrying
  res.json({ orderNotificationType: 'IPN_CHANGE', orderTrackingId: req.body.OrderTrackingId, orderMerchantReference: req.body.OrderMerchantReference, status: '200' });

  const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.body;

  if (!OrderTrackingId) return; // nothing to process

  try {
    const token     = await getPesapalToken();
    const statusRes = await axios.get(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:        'application/json',
        },
      }
    );

    const { payment_status_description, confirmation_code, amount } = statusRes.data;
    // payment_status_description: 'Completed' | 'Failed' | 'Pending' | 'Invalid'
    const status = payment_status_description?.toLowerCase();

    if (status === 'completed') {
      // 1. Mark payment completed
      await db.query(
        `UPDATE payments
         SET status = 'completed', mpesa_receipt = $1, result_desc = $2, updated_at = NOW()
         WHERE checkout_request_id = $3`,
        [confirmation_code, payment_status_description, OrderTrackingId]
      );

      // 2. Fetch the payment row
      const paymentRes = await db.query(
        `SELECT id, user_id, amount, phone, delivery_zone, delivery_fee, shipping_meta
         FROM payments WHERE checkout_request_id = $1`,
        [OrderTrackingId]
      );

      if (paymentRes.rows.length === 0) {
        return console.error('Pesapal IPN: payment row not found for', OrderTrackingId);
      }

      const payment     = paymentRes.rows[0];
      const shippingMeta = payment.shipping_meta || {};
      const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
      const deliveryZone = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
      const deliveryFee  = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;

      // 3. Fetch cart items
      const cartRes = await db.query(
        `SELECT
           ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
           p.name, p.price, p.image_url, p.category
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         JOIN products   p  ON p.id = ci.product_id
         WHERE c.user_id = $1`,
        [payment.user_id]
      );

      const itemsArray = cartRes.rows.map(item => ({
        id:             item.id,
        product_id:     item.product_id,
        name:           item.name,
        price:          item.price,
        image_url:      item.image_url,
        category:       item.category,
        quantity:       item.quantity,
        selected_color: item.selected_color || selectedColors[String(item.id)] || null,
        selected_size:  item.selected_size  || selectedSizes[String(item.id)]  || null,
      }));

      const itemsSnapshot = { items: itemsArray, shipping, deliveryZone };

      // 4. Create the order — same structure as M-Pesa orders
      await db.query(
        `INSERT INTO orders
           (user_id, payment_id, status, tracking_status, total, delivery_fee,
            delivery_zone, items_snapshot, customer_name, customer_email, mpesa_phone, mpesa_receipt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          payment.user_id,
          payment.id,
          'confirmed',
          'Payment Confirmed',
          payment.amount,
          deliveryFee,
          deliveryZone,
          JSON.stringify(itemsSnapshot),
          `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Customer',
          shipping.email || '',
          shipping.phone || payment.phone,
          confirmation_code,
        ]
      );

      // 5. Clear cart
      await db.query(
        `DELETE FROM cart_items
         WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
        [payment.user_id]
      );

      console.log(`✅ Pesapal order created — user ${payment.user_id} — ref ${confirmation_code} — KSh ${amount}`);

    } else if (status === 'failed' || status === 'invalid') {
      await db.query(
        `UPDATE payments SET status = 'failed', result_desc = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [payment_status_description, OrderTrackingId]
      );
      console.log(`❌ Pesapal payment ${status}: ${OrderTrackingId}`);
    }
    // 'pending' — do nothing, wait for next IPN

  } catch (err) {
    console.error('Pesapal IPN error:', err.response?.data || err.message);
  }
};

// ── GET /api/payments/pesapal/status/:orderTrackingId  (polled by frontend) ───
/**
 * Frontend polls this after the customer is redirected back from Pesapal.
 * Mirrors your existing /status/:checkoutRequestId endpoint.
 */
exports.getPesapalStatus = async (req, res) => {
  const { orderTrackingId } = req.params;
  try {
    // First check our DB
    const dbResult = await db.query(
      `SELECT status, mpesa_receipt AS confirmation_code, result_desc, amount
       FROM payments WHERE checkout_request_id = $1`,
      [orderTrackingId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    const payment = dbResult.rows[0];

    // If still pending, do a live check with Pesapal
    if (payment.status === 'pending') {
      try {
        const token     = await getPesapalToken();
        const statusRes = await axios.get(
          `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        const { payment_status_description, confirmation_code } = statusRes.data;
        const liveStatus = payment_status_description?.toLowerCase();

        if (liveStatus === 'completed') {
          await db.query(
            `UPDATE payments SET status = 'completed', mpesa_receipt = $1, updated_at = NOW()
             WHERE checkout_request_id = $2`,
            [confirmation_code, orderTrackingId]
          );
          payment.status            = 'completed';
          payment.confirmation_code = confirmation_code;
        } else if (liveStatus === 'failed' || liveStatus === 'invalid') {
          await db.query(
            `UPDATE payments SET status = 'failed', updated_at = NOW()
             WHERE checkout_request_id = $1`,
            [orderTrackingId]
          );
          payment.status = 'failed';
        }
      } catch (liveErr) {
        console.error('Live Pesapal status check failed:', liveErr.message);
        // Return whatever we have in DB — frontend will retry
      }
    }

    return res.json(payment);
  } catch (err) {
    console.error('Pesapal status error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};