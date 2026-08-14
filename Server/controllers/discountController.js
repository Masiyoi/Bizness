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

    const subtotal = cartRes.rows.reduce(
      (sum, row) => sum + Number(row.effective_price) * row.quantity, 0
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
// ── Addition to src/controllers/discountController.js ──────────────────────
// Add this export alongside the existing getDiscountPreview. It reuses your
// existing isEligibleForFirstOrderDiscount() helper (already defined at the
// top of that file) but skips the cart lookup entirely, since the profile
// page needs to show "do you have this offer" independent of what's
// currently in the cart.

// GET /api/discount/eligibility — called from the Discounts profile page.
// Unlike getDiscountPreview, this doesn't depend on cart contents.
exports.getDiscountEligibility = async (req, res) => {
  const userId = req.user.id;
  try {
    const eligible = await isEligibleForFirstOrderDiscount(userId);
    return res.json({ eligible });
  } catch (err) {
    console.error('getDiscountEligibility error:', err.message);
    return res.status(500).json({ msg: 'Failed to check discount eligibility' });
  }
};

// GET /api/discount/history — called from the Discounts profile page.
// Returns every past order where a discount was actually applied, so the
// page can show "discounts you've used". Reads generically off
// discount_type/discount_amount so it keeps working if more discount
// types get added later (currently only the first-order 10% exists).
exports.getDiscountHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT order_number, created_at, discount_type, discount_amount
       FROM orders
       WHERE user_id = $1
         AND discount_amount IS NOT NULL
         AND discount_amount > 0
       ORDER BY created_at DESC`,
      [userId]
    );
    const discounts = result.rows.map(row => ({
      order_number:    row.order_number,
      applied_at:      row.created_at,
      discount_type:   row.discount_type,
      discount_amount: Number(row.discount_amount),
    }));
    return res.json({ discounts });
  } catch (err) {
    console.error('getDiscountHistory error:', err.message);
    return res.status(500).json({ msg: 'Failed to load discount history' });
  }
};
// Exported for internal use by paymentController — the source of truth used
// when actually charging the customer, never the frontend-displayed value.
exports.calculateFirstOrderDiscount     = calculateFirstOrderDiscount;
exports.isEligibleForFirstOrderDiscount = isEligibleForFirstOrderDiscount;
