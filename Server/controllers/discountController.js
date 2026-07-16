const db = require('../config/db');

const FIRST_ORDER_DISCOUNT_RATE = 0.10; // 10%

// ── Internal: has this user ever completed (paid) an order? ──────────────────
const isEligibleForFirstOrderDiscount = async (userId) => {
  const result = await db.query(
    `SELECT 1 FROM orders WHERE user_id = $1 AND status = 'confirmed' LIMIT 1`,
    [userId]
  );
  return result.rows.length === 0;
};

// ── Internal: compute discount for a given subtotal ───────────────────────────
// Used by the /preview endpoint (display only) AND by paymentController
// (the authoritative calculation used to build the real charge amount).
const calculateFirstOrderDiscount = async (userId, subtotal) => {
  const eligible = subtotal > 0 && await isEligibleForFirstOrderDiscount(userId);

  if (!eligible) {
    return {
      eligible: false,
      discountAmount: 0,
      discountedSubtotal: Math.round(subtotal * 100) / 100,
    };
  }

  const discountAmount = Math.round(subtotal * FIRST_ORDER_DISCOUNT_RATE * 100) / 100;
  const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;

  return { eligible: true, discountAmount, discountedSubtotal };
};

// ── GET /api/discount/preview — called from cart page & checkout page ────────
exports.getDiscountPreview = async (req, res) => {
  const userId = req.user.id;
  try {
    const cartRes = await db.query(
      `SELECT ci.quantity, p.price
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id = $1`,
      [userId]
    );

    const subtotal = cartRes.rows.reduce(
      (sum, row) => sum + Number(row.price) * row.quantity, 0
    );

    const { eligible, discountAmount, discountedSubtotal } =
      await calculateFirstOrderDiscount(userId, subtotal);

    return res.json({
      eligible,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      discountedSubtotal,
      discountLabel: eligible ? '10% off your first order' : null,
    });
  } catch (err) {
    console.error('getDiscountPreview error:', err.message);
    return res.status(500).json({ msg: 'Failed to calculate discount' });
  }
};

// Exported for internal use by paymentController — the source of truth used
// when actually charging the customer, never the frontend-displayed value.
exports.calculateFirstOrderDiscount     = calculateFirstOrderDiscount;
exports.isEligibleForFirstOrderDiscount = isEligibleForFirstOrderDiscount;
