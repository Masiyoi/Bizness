const db = require('../config/db');
const FIRST_ORDER_DISCOUNT_RATE = 0.10; // 10%
const LOYALTY_DISCOUNT_RATE = 0.10; // 10%
const LOYALTY_CYCLE = 4; // every 4th confirmed order is discounted
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
// ── Internal: how many confirmed orders has this user completed? ─────────────
// Mirrors the exact definition isEligibleForFirstOrderDiscount uses, so a
// "completed order" means the same thing everywhere in this file.
const getConfirmedOrderCount = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS n FROM orders WHERE user_id = $1 AND status = 'confirmed'`,
    [userId]
  );
  return result.rows[0].n;
};
// ── Internal: is the user's NEXT order the 4th/8th/12th... confirmed order? ──
const getLoyaltyStatus = async (userId) => {
  const confirmedOrders = await getConfirmedOrderCount(userId);
  const nextOrderNumber = confirmedOrders + 1;
  const eligible = nextOrderNumber % LOYALTY_CYCLE === 0;
  const ordersUntilNext = eligible
    ? 0
    : (LOYALTY_CYCLE - (nextOrderNumber % LOYALTY_CYCLE)) % LOYALTY_CYCLE;
  return { confirmedOrders, nextOrderNumber, eligible, ordersUntilNext };
};
// ── Internal: which discount (if any) applies to the order about to be placed.
// First-order discount only ever fires on order #1, so it never actually
// competes with loyalty (which starts at order #4) — kept explicit in case
// that ever changes.
const calculateOrderDiscount = async (userId, subtotal) => {
  if (!(subtotal > 0)) {
    return {
      discountType: null, eligible: false, discountAmount: 0,
      discountedSubtotal: Math.round(subtotal * 100) / 100,
    };
  }
  const firstOrder = await calculateFirstOrderDiscount(userId, subtotal);
  if (firstOrder.eligible) {
    return { discountType: 'first_order', ...firstOrder };
  }
  const loyalty = await getLoyaltyStatus(userId);
  if (loyalty.eligible) {
    const discountAmount = Math.round(subtotal * LOYALTY_DISCOUNT_RATE * 100) / 100;
    const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;
    return { discountType: 'loyalty', eligible: true, discountAmount, discountedSubtotal };
  }
  return {
    discountType: null, eligible: false, discountAmount: 0,
    discountedSubtotal: Math.round(subtotal * 100) / 100,
  };
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
    const discount = await calculateOrderDiscount(userId, subtotal);
    const loyalty  = await getLoyaltyStatus(userId);
    return res.json({
      eligible: discount.eligible,
      discountType: discount.discountType,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: discount.discountAmount,
      discountedSubtotal: discount.discountedSubtotal,
      discountLabel:
        discount.discountType === 'first_order' ? '10% off your first order' :
        discount.discountType === 'loyalty'     ? '10% off — loyalty reward unlocked' :
        null,
      loyalty: { eligible: loyalty.eligible, ordersUntilNext: loyalty.ordersUntilNext },
    });
  } catch (err) {
    console.error('getDiscountPreview error:', err.message);
    return res.status(500).json({ msg: 'Failed to calculate discount' });
  }
};
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
// GET /api/admin/discount/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Called from the Admin > Discounts tab. Returns total discount amount
// given (optionally within a date range) plus the full list of orders
// that had a discount applied, so admin can see who bought what on
// discount and when.
exports.getAdminDiscountSummary = async (req, res) => {
  const { from, to } = req.query;
  try {
    const params = [];
    let dateFilter = '';
    if (from) { params.push(from); dateFilter += ` AND created_at >= $${params.length}`; }
    if (to)   { params.push(to);   dateFilter += ` AND created_at <= $${params.length}::date + interval '1 day'`; }
    const totalsRes = await db.query(
      `SELECT COALESCE(SUM(discount_amount), 0) AS total_discount,
              COUNT(*) AS orders_count
       FROM orders
       WHERE discount_amount IS NOT NULL AND discount_amount > 0 ${dateFilter}`,
      params
    );
    const ordersRes = await db.query(
      `SELECT order_number, customer_name, customer_email, mpesa_phone,
              total, discount_type, discount_amount, created_at
       FROM orders
       WHERE discount_amount IS NOT NULL AND discount_amount > 0 ${dateFilter}
       ORDER BY created_at DESC`,
      params
    );
    return res.json({
      totalDiscountAmount: Number(totalsRes.rows[0].total_discount),
      ordersCount: Number(totalsRes.rows[0].orders_count),
      orders: ordersRes.rows.map(r => ({
        order_number:    r.order_number,
        customer_name:   r.customer_name,
        customer_email:  r.customer_email,
        mpesa_phone:     r.mpesa_phone,
        total:           Number(r.total),
        discount_type:   r.discount_type,
        discount_amount: Number(r.discount_amount),
        created_at:      r.created_at,
      })),
    });
  } catch (err) {
    console.error('getAdminDiscountSummary error:', err.message);
    return res.status(500).json({ msg: 'Failed to load discount summary' });
  }
};
// Exported for internal use by paymentController — the source of truth used
// when actually charging the customer, never the frontend-displayed value.
exports.calculateFirstOrderDiscount     = calculateFirstOrderDiscount;
exports.isEligibleForFirstOrderDiscount = isEligibleForFirstOrderDiscount;
exports.calculateOrderDiscount          = calculateOrderDiscount;
exports.getLoyaltyStatus                = getLoyaltyStatus;