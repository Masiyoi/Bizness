const axios = require('axios');
const db    = require('../config/db');
const { calculateFirstOrderDiscount } = require('./discountController');
const { awardOrderPoints } = require('./membersController');

// ── PayHero base URL ──────────────────────────────────────────────────────────
const PAYHERO_BASE = 'https://backend.payhero.co.ke/api/v2';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * PayHero uses HTTP Basic Auth — base64("username:password") from the
 * API Keys page in your dashboard (app.payhero.co.ke → API Keys).
 * Set PAYHERO_API_USERNAME / PAYHERO_API_PASSWORD in your .env.
 */
const getAuthHeader = () => {
  const token = Buffer.from(
    `${process.env.PAYHERO_API_USERNAME}:${process.env.PAYHERO_API_PASSWORD}`
  ).toString('base64');
  return `Basic ${token}`;
};

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!/^254\d{9}$/.test(cleaned)) throw new Error('Invalid phone number format');
  return cleaned;
};

// ── Shared: create the order + clear the cart for a completed PayHero payment ──
// Mirrors fulfillPesapalPayment — idempotent, safe to call from the callback
// and (if you add one later) any live-status-check fallback.
const fulfillPayHeroPayment = async (checkoutRequestId, confirmationCode) => {
  const existing = await db.query(
    `SELECT o.id FROM orders o
     JOIN payments p ON p.id = o.payment_id
     WHERE p.checkout_request_id = $1`,
    [checkoutRequestId]
  );
  if (existing.rows.length > 0) return; // already fulfilled

  const paymentRes = await db.query(
    `SELECT id, user_id, amount, phone, delivery_zone, delivery_fee, shipping_meta
     FROM payments WHERE checkout_request_id = $1`,
    [checkoutRequestId]
  );
  if (paymentRes.rows.length === 0) {
    return console.error('fulfillPayHeroPayment: payment row not found for', checkoutRequestId);
  }

  const payment       = paymentRes.rows[0];
  const shippingMeta  = payment.shipping_meta || {};
  const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
  const deliveryZone  = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
  const deliveryFee   = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
  const discountAmount = Number(shippingMeta.discount_amount) || 0;
  const discountType   = shippingMeta.discount_type || null;
  const reservedOrderNumber = shippingMeta.reserved_order_number || null;
  const affiliateCode  = shippingMeta.affiliate_code || null;

  const cartRes = await db.query(
    `SELECT
       ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
       p.name, p.image_url, p.category,
       CASE
          WHEN p.sale_price IS NOT NULL
           AND p.sale_price < p.price
           AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
         THEN p.sale_price
         ELSE p.price
       END AS effective_price
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
    price:          item.effective_price,
    image_url:      item.image_url,
    category:       item.category,
    quantity:       item.quantity,
    selected_color: item.selected_color || selectedColors[String(item.id)] || null,
    selected_size:  item.selected_size  || selectedSizes[String(item.id)]  || null,
  }));

  const itemsSnapshot = { items: itemsArray, shipping, deliveryZone };

  const orderInsertRes = await db.query(
    `INSERT INTO orders
       (user_id, payment_id, status, tracking_status, total, delivery_fee,
        delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
        discount_type, discount_amount, order_number, affiliate_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id`,
    [
      payment.user_id,
      payment.id,
      'confirmed',
      'Payment Confirmed',
      payment.amount,
      deliveryFee,
      deliveryZone,
      JSON.stringify(itemsSnapshot),
      shipping.firstName || 'Customer',
      shipping.phone || payment.phone,
      confirmationCode,
      discountType,
      discountAmount,
      reservedOrderNumber,
      affiliateCode,
    ]
  );
  const newOrderId = orderInsertRes.rows[0]?.id;

  if (affiliateCode && newOrderId) {
    try {
      const spRes = await db.query(
        `SELECT id, commission_pct FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,
        [affiliateCode]
      );
      if (spRes.rows.length > 0) {
        const sp = spRes.rows[0];
        const commissionAmount = (Number(payment.amount) * Number(sp.commission_pct)) / 100;
        await db.query(
          `INSERT INTO affiliate_earnings (salesperson_id, order_id, order_total, commission_amount)
           VALUES ($1, $2, $3, $4)`,
          [sp.id, newOrderId, payment.amount, commissionAmount]
        );
      }
    } catch (commErr) {
      console.error('Affiliate commission recording error:', commErr.message);
    }
  }

  await db.query(
    `DELETE FROM cart_items
     WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
    [payment.user_id]
  );

  await awardOrderPoints(payment.user_id, payment.amount);
  console.log(`✅ PayHero order fulfilled — user ${payment.user_id} — ref ${confirmationCode}`);
};

// ── POST /api/payments/payhero/stk-push ───────────────────────────────────────
/**
 * Triggers an M-Pesa STK push via PayHero.
 * Body: { phone, delivery_zone, delivery_fee, shipping, selectedColors, selectedSizes }
 */
exports.stkPush = async (req, res) => {
  const {
    phone,
    delivery_zone,
    delivery_fee = 0,
    shipping       = {},
    selectedColors = {},
    selectedSizes  = {},
    reserved_order_number = null,
    affiliate_code = null,
  } = req.body;
  let validatedAffiliateCode = null;
  if (affiliate_code) {
    try {
      const spRes = await db.query(
        `SELECT coupon_code FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,
        [String(affiliate_code).trim().toUpperCase()]
      );
      if (spRes.rows.length > 0) {
        validatedAffiliateCode = spRes.rows[0].coupon_code;
      }
    } catch (err) {
      console.error('Affiliate code validation error:', err.message);
    }
  }
  const userId = req.user.id;

  if (!phone) {
    return res.status(400).json({ msg: 'Phone is required' });
  }

  let formattedPhone;
  try {
    formattedPhone = formatPhone(phone);
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }

  // ── Compute the authoritative order total server-side ──────────────────────
  // Same pattern as stkPush (M-Pesa) / initiatePayment (Pesapal) — never
  // trust a client-supplied amount.
  let roundedAmount, discountInfo;
  try {
    const cartRes = await db.query(
      `SELECT ci.quantity,
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
      [userId]
    );

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ msg: 'Cart is empty' });
    }

    const subtotal = cartRes.rows.reduce(
      (sum, row) => sum + Number(row.effective_price) * row.quantity, 0
    );

    discountInfo = await calculateFirstOrderDiscount(userId, subtotal);
    const total  = discountInfo.discountedSubtotal + Number(delivery_fee || 0);
    roundedAmount = Math.ceil(total);
  } catch (err) {
    console.error('Order total calculation error:', err.message);
    return res.status(500).json({ msg: 'Failed to calculate order total' });
  }

  // Unique external reference PayHero will echo back in the callback
  const externalReference = reserved_order_number
    ? `${reserved_order_number}-${Date.now()}`
    : `PH-${userId}-${Date.now()}`;

  try {
    const payload = {
      amount:              roundedAmount,
      phone_number:        formattedPhone,
      channel_id:          Number(process.env.PAYHERO_CHANNEL_ID), // from Payment Channels → My Payment Channels
      provider:             'm-pesa',
      external_reference:   externalReference,
      customer_name:        shipping.firstName || 'Customer',
      callback_url:          process.env.PAYHERO_CALLBACK_URL, // e.g. https://yoursite.com/api/payments/payhero/callback
    };

    const phRes = await axios.post(`${PAYHERO_BASE}/payments`, payload, {
      headers: {
        Authorization:  getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const { success, status, reference, CheckoutRequestID } = phRes.data;

    if (!success || !CheckoutRequestID) {
      console.error('PayHero STK push error:', phRes.data);
      return res.status(400).json({ msg: 'Failed to initiate PayHero STK push' });
    }

    // Persist a pending payment row — same shape as your Pesapal/M-Pesa rows
    await db.query(
      `INSERT INTO payments
         (user_id, checkout_request_id, merchant_request_id, amount, phone,
          status, delivery_zone, delivery_fee, shipping_meta, payment_method)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, 'payhero')
       ON CONFLICT (checkout_request_id) DO NOTHING`,
      [
        userId,
        CheckoutRequestID,
        reference,
        roundedAmount,
        formattedPhone,
        delivery_zone || 'cbd',
        delivery_fee  || 0,
        JSON.stringify({
          shipping, selectedColors, selectedSizes, delivery_zone, delivery_fee,
          discount_amount: discountInfo.discountAmount,
          discount_type: discountInfo.eligible ? 'first_order' : null,
          reserved_order_number,
          external_reference: externalReference,
          affiliate_code: validatedAffiliateCode,
        }),
      ]
    );

    return res.json({
      msg: 'STK push sent via PayHero. Check your phone.',
      status,
      checkoutRequestId: CheckoutRequestID,
    });
  } catch (err) {
    console.error('PayHero STK push error:', err.response?.data || err.message);
    return res.status(500).json({
      msg: err.response?.data?.error || 'Payment initiation failed. Try again.',
    });
  }
};

// ── POST /api/payments/payhero/callback  (called by PayHero servers) ─────────
/**
 * PayHero posts the transaction result here once M-Pesa responds.
 * NOTE: PayHero's public docs confirm this wrapper shape for their withdraw
 * callback ({ forward_url, response: {...}, status }); the payments callback
 * has not been independently confirmed to use identical field names, so this
 * handler logs the full raw body on first hit — check your logs after your
 * first real test payment and adjust the field names below if needed.
 */
exports.payHeroCallback = async (req, res) => {
  // Always acknowledge immediately
  res.json({ received: true });

  console.log('PayHero callback raw body:', JSON.stringify(req.body));

  const payload = req.body?.response || req.body; // handle both wrapped and flat shapes
  const {
    CheckoutRequestID,
    ExternalReference,
    MpesaReceiptNumber,
    ResultCode,
    ResultDesc,
    Status,
    Amount,
  } = payload || {};

  if (!CheckoutRequestID) return;

  try {
    const succeeded = Status === 'Success' || ResultCode === 0;

    if (succeeded) {
      await db.query(
        `UPDATE payments
         SET status = 'completed', mpesa_receipt = $1, result_desc = $2, updated_at = NOW()
         WHERE checkout_request_id = $3`,
        [MpesaReceiptNumber, ResultDesc, CheckoutRequestID]
      );

      await fulfillPayHeroPayment(CheckoutRequestID, MpesaReceiptNumber);
      console.log(`✅ PayHero callback processed — ref ${MpesaReceiptNumber} — KSh ${Amount}`);
    } else {
      await db.query(
        `UPDATE payments SET status = 'failed', result_desc = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [ResultDesc || 'Payment failed', CheckoutRequestID]
      );
      console.log(`❌ PayHero payment failed: ${CheckoutRequestID} — ${ResultDesc}`);

      // Create a 'cancelled' order record, same pattern as Pesapal/M-Pesa —
      // cart intentionally left intact so the customer can retry.
      try {
        const paymentRes = await db.query(
          `SELECT id, user_id, amount, phone, delivery_zone, delivery_fee, shipping_meta
           FROM payments WHERE checkout_request_id = $1`,
          [CheckoutRequestID]
        );

        if (paymentRes.rows.length > 0) {
          const payment      = paymentRes.rows[0];
          const shippingMeta = payment.shipping_meta || {};
          const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
          const deliveryZone = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
          const deliveryFee  = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
          const discountAmount = Number(shippingMeta.discount_amount) || 0;
          const discountType   = shippingMeta.discount_type || null;
          const reservedOrderNumber = shippingMeta.reserved_order_number || null;
          const affiliateCode = shippingMeta.affiliate_code || null;

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

          await db.query(
            `INSERT INTO orders
               (user_id, payment_id, status, tracking_status, total, delivery_fee,
                delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
                discount_type, discount_amount, order_number, affiliate_code)
             VALUES ($1, $2, 'cancelled', 'Payment Failed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              payment.user_id,
              payment.id,
              payment.amount,
              deliveryFee,
              deliveryZone,
              JSON.stringify(itemsSnapshot),
              shipping.firstName || 'Customer',
              shipping.phone || payment.phone,
              null,
              discountType,
              discountAmount,
              reservedOrderNumber,
              affiliateCode,
            ]
          );

          console.log(`📋 Cancelled-order record created for user ${payment.user_id}`);
        }
      } catch (orderErr) {
        console.error('Failed to create cancelled-order record:', orderErr.message);
      }
    }
  } catch (err) {
    console.error('PayHero callback error:', err.message);
  }
};

// ── GET /api/payments/payhero/status/:checkoutRequestId  (polled by frontend) ─
/**
 * Mirrors getPaymentStatus / getPesapalStatus. Reads from our own DB, which
 * the callback above keeps up to date. (PayHero also exposes a live
 * "Get Transaction Status" query endpoint per their docs — add a live
 * fallback here the same way getPesapalStatus does, once you've confirmed
 * its exact path/params against your dashboard, in case the callback is
 * ever delayed or missed.)
 */
exports.getPayHeroStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  try {
    const result = await db.query(
      `SELECT
         p.status,
         p.mpesa_receipt AS confirmation_code,
         p.result_desc,
         p.amount,
         o.order_number,
         o.created_at AS order_created_at,
         o.total      AS order_total,
         o.delivery_fee,
         o.delivery_zone,
         o.items_snapshot,
         o.discount_type,
         o.discount_amount
       FROM payments p
       LEFT JOIN orders o ON o.payment_id = p.id
       WHERE p.checkout_request_id = $1`,
      [checkoutRequestId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('PayHero status error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};