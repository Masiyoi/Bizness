const axios = require('axios');
const db    = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTimestamp = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
};

const getPassword = (timestamp) => {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
};

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!/^254\d{9}$/.test(cleaned)) throw new Error('Invalid phone number format');
  return cleaned;
};

const getAccessToken = async () => {
  const url = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data.access_token;
};

// ── POST /api/payments/stk-push ───────────────────────────────────────────────
// Now also accepts delivery_zone and delivery_fee from the frontend
exports.stkPush = async (req, res) => {
  const { phone, amount, delivery_zone, delivery_fee } = req.body;
  const userId = req.user.id;

  if (!phone || !amount) {
    return res.status(400).json({ msg: 'Phone and amount are required' });
  }

  let formattedPhone;
  try {
    formattedPhone = formatPhone(phone);
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }

  const roundedAmount = Math.ceil(Number(amount));

  try {
    const token     = await getAccessToken();
    const timestamp = getTimestamp();
    const password  = getPassword(timestamp);

    const url = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            roundedAmount,
      PartyA:            formattedPhone,
      PartyB:            process.env.MPESA_SHORTCODE,
      PhoneNumber:       formattedPhone,
      CallBackURL:       process.env.MPESA_CALLBACK_URL,
      AccountReference:  'LukuPrime',
      TransactionDesc:   'Order Payment',
    };

    const mpesaRes = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { CheckoutRequestID, MerchantRequestID, ResponseCode, CustomerMessage } = mpesaRes.data;

    if (ResponseCode !== '0') {
      return res.status(400).json({ msg: CustomerMessage || 'STK push failed' });
    }

    // Save pending payment — also store delivery info so callback can use it
    await db.query(
      `INSERT INTO payments
         (user_id, checkout_request_id, merchant_request_id, amount, phone, status, delivery_zone, delivery_fee)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
       ON CONFLICT (checkout_request_id) DO NOTHING`,
      [
        userId,
        CheckoutRequestID,
        MerchantRequestID,
        roundedAmount,
        formattedPhone,
        delivery_zone || 'cbd',
        delivery_fee  || 0,
      ]
    );

    return res.json({
      msg: CustomerMessage || 'STK push sent. Check your phone.',
      checkoutRequestId: CheckoutRequestID,
    });
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    return res.status(500).json({
      msg: err.response?.data?.errorMessage || 'Payment initiation failed. Try again.',
    });
  }
};

// ── POST /api/payments/callback  (called by Safaricom) ───────────────────────
exports.mpesaCallback = async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = body;

    if (ResultCode === 0) {
      // ── Successful payment ───────────────────────────────────────────────
      const items   = CallbackMetadata?.Item || [];
      const get     = (name) => items.find(i => i.Name === name)?.Value;
      const receipt = get('MpesaReceiptNumber');
      const amount  = get('Amount');

      // 1. Mark payment completed
      await db.query(
        `UPDATE payments
         SET status = 'completed', mpesa_receipt = $1, result_desc = $2, updated_at = NOW()
         WHERE checkout_request_id = $3`,
        [receipt, ResultDesc, CheckoutRequestID]
      );

      // 2. Fetch the payment row (we need user_id, delivery info)
      const paymentRes = await db.query(
        `SELECT id, user_id, amount, phone, delivery_zone, delivery_fee
         FROM payments
         WHERE checkout_request_id = $1`,
        [CheckoutRequestID]
      );

      if (paymentRes.rows.length === 0) {
        console.error('Callback: payment row not found for', CheckoutRequestID);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      const payment = paymentRes.rows[0];

      // 3. Fetch the user's cart items with product details (snapshot)
      const cartRes = await db.query(
        `SELECT
           ci.product_id,
           ci.quantity,
           p.name,
           p.price,
           p.image_url,
           p.category
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         JOIN products   p  ON p.id = ci.product_id
         WHERE c.user_id = $1`,
        [payment.user_id]
      );

      const itemsSnapshot = cartRes.rows.map(r => ({
        product_id: r.product_id,
        name:       r.name,
        price:      r.price,
        image_url:  r.image_url,
        category:   r.category,
        quantity:   r.quantity,
      }));

      // 4. Create the order
      await db.query(
        `INSERT INTO orders
           (user_id, payment_id, total, delivery_fee, delivery_zone, status, tracking_status, items_snapshot)
         VALUES ($1, $2, $3, $4, $5, 'confirmed', 'Order Placed', $6)`,
        [
          payment.user_id,
          payment.id,
          payment.amount,
          payment.delivery_fee,
          payment.delivery_zone,
          JSON.stringify(itemsSnapshot),
        ]
      );

      // 5. Clear the user's cart
      await db.query(
        `DELETE FROM cart_items
         WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
        [payment.user_id]
      );

      console.log(`✅ Order created for user ${payment.user_id} — receipt ${receipt} — KSh ${amount}`);

    } else {
      // ── Failed / cancelled ───────────────────────────────────────────────
      await db.query(
        `UPDATE payments
         SET status = 'failed', result_desc = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [ResultDesc, CheckoutRequestID]
      );

      console.log(`❌ Payment failed: ${ResultDesc}`);
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err.message);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // always 200 to Safaricom
  }
};

// ── GET /api/payments/status/:checkoutRequestId  (polled by frontend) ────────
exports.getPaymentStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  try {
    const result = await db.query(
      `SELECT status, mpesa_receipt, result_desc, amount
       FROM payments WHERE checkout_request_id = $1`,
      [checkoutRequestId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Status check error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/payments/query/:checkoutRequestId  (manual STK query fallback) ──
exports.querySTK = async (req, res) => {
  const { checkoutRequestId } = req.params;
  try {
    const token     = await getAccessToken();
    const timestamp = getTimestamp();
    const password  = getPassword(timestamp);

    const url = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const mpesaRes = await axios.post(url, {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { ResultCode, ResultDesc } = mpesaRes.data;

    if (ResultCode === '0') {
      await db.query(
        `UPDATE payments SET status = 'completed', result_desc = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [ResultDesc, checkoutRequestId]
      );
    } else if (ResultCode !== undefined) {
      await db.query(
        `UPDATE payments SET status = 'failed', result_desc = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [ResultDesc, checkoutRequestId]
      );
    }

    return res.json(mpesaRes.data);
  } catch (err) {
    console.error('STK Query error:', err.response?.data || err.message);
    return res.status(500).json({ msg: 'Query failed' });
  }
};