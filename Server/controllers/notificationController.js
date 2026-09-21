// controllers/notificationController.js
const db = require('../config/db');
// Where tapping a notification takes the user. Adjust to match your React routes.
const LINKS = {
  orders:    '/orders',
  members:   '/members',
  affiliate: '/affiliate',
  product:   (id) => `/product/${id}`,
};
const DAY = 24 * 60 * 60 * 1000;
const ksh = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
// One failing source (e.g. a column named differently in your schema) is logged
// and skipped instead of taking the whole feed down.
const safe = async (label, fn, fallback = []) => {
  try { return await fn(); }
  catch (err) { console.error(`notifications [${label}] error:`, err.message); return fallback; }
};
const itemsOf = (snap) => {
  let s = snap;
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch { return []; } }
  if (Array.isArray(s)) return s;
  return Array.isArray(s?.items) ? s.items : [];
};
// GET /api/notifications
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const [orders, reviewed, arrivals, flash, activities, earnings] = await Promise.all([
      safe('orders', async () => (await db.query(
        `SELECT id, order_number, status, tracking_status, total, discount_type,
                discount_amount, created_at, updated_at, items_snapshot
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`, [userId])).rows),
      // null = lookup failed -> review reminders are skipped rather than wrongly shown
      safe('reviews', async () => new Set((await db.query(
        `SELECT DISTINCT product_id FROM reviews WHERE user_id = $1`, [userId]
      )).rows.map(r => Number(r.product_id))), null),
      safe('arrivals', async () => (await db.query(
        `SELECT id, name, price, image_url, created_at FROM products
         WHERE created_at >= NOW() - INTERVAL '3 weeks'
         ORDER BY created_at DESC LIMIT 6`)).rows),
      safe('flash', async () => (await db.query(
        `SELECT p.id, p.name, p.price, p.sale_price, p.sale_ends_at, p.image_url,
                COALESCE((to_jsonb(p)->>'updated_at')::timestamptz, p.created_at) AS at
         FROM products p
         WHERE p.sale_price IS NOT NULL AND p.sale_price < p.price
           AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
         ORDER BY (p.price - p.sale_price) DESC LIMIT 5`)).rows),
      safe('members', async () => (await db.query(
        `SELECT ma.id, ma.description, ma.points, ma.created_at
         FROM member_activities ma JOIN members m ON m.id = ma.member_id
         WHERE m.user_id = $1 ORDER BY ma.created_at DESC LIMIT 20`, [userId])).rows),
      safe('affiliate', async () => (await db.query(
        `SELECT e.id, e.commission_amount, e.payout_status, e.created_at, e.paid_at, o.order_number
         FROM affiliate_earnings e
         JOIN salespersons s ON s.id = e.salesperson_id
         LEFT JOIN orders o ON o.id = e.order_id
         WHERE s.user_id = $1 ORDER BY e.created_at DESC LIMIT 30`, [userId])).rows),
    ]);
    const out = [];
    const push = (n) => out.push({ link: null, image: null, ...n, created_at: new Date(n.created_at).toISOString() });
    const now = Date.now();
    // ── Orders: confirmed, delivered, discount given, not-yet-reviewed ─────
    for (const o of orders) {
      const status   = String(o.status || '').toLowerCase();
      const tracking = String(o.tracking_status || '').toLowerCase();
      if (status === 'cancelled' || status === 'pending') continue;
      const ref = o.order_number || `#${o.id}`;
      push({ id: `order-confirmed-${o.id}`, type: 'order_confirmed', title: 'Order confirmed',
             message: `Your order ${ref} (${ksh(o.total)}) has been confirmed.`,
             link: LINKS.orders, created_at: o.created_at });
      const discount = Number(o.discount_amount) || 0;
      if (discount > 0) {
        const label = o.discount_type === 'first_order' ? 'Your 10% first-order discount' : 'A discount';
        push({ id: `discount-${o.id}`, type: 'discount', title: `You saved ${ksh(discount)}`,
               message: `${label} was applied to order ${ref}.`,
               link: LINKS.orders, created_at: o.created_at });
      }
      if (status === 'delivered' || tracking === 'delivered') {
        push({ id: `order-delivered-${o.id}`, type: 'order_delivered', title: 'Order delivered',
               message: `Your order ${ref} has been delivered. Enjoy!`,
               link: LINKS.orders, created_at: o.updated_at || o.created_at });
        // Review reminder: only for the 30 days after delivery so it doesn't nag forever
        if (reviewed && now - Date.parse(o.updated_at || o.created_at) < 30 * DAY) {
          const pending = itemsOf(o.items_snapshot).filter(i => {
            const pid = Number(i.product_id ?? i.productId);
            return pid && !reviewed.has(pid);
          });
          if (pending.length) {
            const first = pending[0];
            push({ id: `review-${o.id}`, type: 'review_reminder', title: 'How was your order?',
                   message: `${pending.length} item${pending.length > 1 ? 's' : ''} from order ${ref} still ${pending.length > 1 ? 'need' : 'needs'} your review.`,
                   link: LINKS.product(first.product_id ?? first.productId), image: first.image_url || null,
                   created_at: o.updated_at || o.created_at });
          }
        }
      }
    }
    // ── New arrivals ───────────────────────────────────────────────────────
    for (const p of arrivals) {
      push({ id: `arrival-${p.id}`, type: 'new_arrival', title: 'New arrival',
             message: `${p.name} just dropped for ${ksh(p.price)}.`,
             link: LINKS.product(p.id), image: p.image_url || null, created_at: p.created_at });
    }
    // ── Flash sale updates ─────────────────────────────────────────────────
    for (const p of flash) {
      const price = Number(p.price), sale = Number(p.sale_price);
      const off = price > 0 ? Math.round((1 - sale / price) * 100) : 0;
      const ends = p.sale_ends_at
        ? ` Ends ${new Date(p.sale_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` : '';
      push({ id: `flash-${p.id}`, type: 'flash_sale', title: `Flash sale: ${off}% off`,
             message: `${p.name} is now ${ksh(sale)}.${ends}`,
             link: LINKS.product(p.id), image: p.image_url || null, created_at: p.at });
    }
    // ── Members Club: points + tier upgrades ───────────────────────────────
    for (const a of activities) {
      const pts  = Number(a.points) || 0;
      const tier = /^Reached\s+(\w+)\s+tier/i.exec(a.description || '');
      if (tier) {
        push({ id: `tier-${a.id}`, type: 'tier_upgrade', title: `You've reached ${tier[1]} tier`,
               message: `Congratulations! A bonus of ${pts} points was added to your balance.`,
               link: LINKS.members, created_at: a.created_at });
      } else {
        push({ id: `points-${a.id}`, type: 'points', title: pts >= 0 ? `+${pts} points` : `${pts} points`,
               message: a.description || 'Members Club activity',
               link: LINKS.members, created_at: a.created_at });
      }
    }
    // ── Affiliate: commission earned + payouts (payouts grouped per batch) ─
    const payouts = new Map();
    for (const e of earnings) {
      push({ id: `commission-${e.id}`, type: 'commission', title: `Commission earned: ${ksh(e.commission_amount)}`,
             message: `Order ${e.order_number || ''} was placed with your coupon code.`.replace('  ', ' '),
             link: LINKS.affiliate, created_at: e.created_at });
      if (e.payout_status === 'paid' && e.paid_at) {
        const key = new Date(e.paid_at).toISOString();
        const cur = payouts.get(key) || { total: 0, count: 0 };
        cur.total += Number(e.commission_amount) || 0; cur.count += 1;
        payouts.set(key, cur);
      }
    }
    for (const [at, v] of payouts) {
      push({ id: `payout-${at}`, type: 'payout', title: `Commission paid: ${ksh(v.total)}`,
             message: `Your payout covering ${v.count} order${v.count > 1 ? 's' : ''} has been sent.`,
             link: LINKS.affiliate, created_at: at });
    }
    out.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    res.json({ notifications: out.slice(0, 60), serverTime: new Date().toISOString() });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ msg: 'Failed to load notifications' });
  }
};