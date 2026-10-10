// server/utils/webPush.js
//
// Setup:
//   npm install web-push
//   npx web-push generate-vapid-keys   (run once, save both keys)

//   FRONTEND_URL=https://lukuprime.com   (no trailing slash, no #)
const webpush = require('web-push');
const pool = require('../config/db');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:you@lukuprime.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Mirrors ROUTE_OVERRIDE in src/pages/Notifications.tsx — keep the two in
// sync whenever you add a new notification type. App.tsx uses HashRouter,
// so every in-app path needs a leading '/#'.
const ROUTE_OVERRIDE = {
  points: '/members-club',
  tier_upgrade: '/members-club',
  review_reminder: '/reviews',
  new_arrival: '/categories/new-arrivals',
  commission: '/profile/affiliate',
  payout: '/profile/affiliate',
  discount: '/profile/discounts',
  order_confirmed: '/orders',
  order_delivered: '/orders',
  flash_sale: '/notifications',
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://plugwalk.co';

function urlFor(type) {
  const path = ROUTE_OVERRIDE[type] || '/notifications';
  return `${FRONTEND_URL}/#${path}`;
}

/**
 * Sends a push to every device this user has subscribed on. Never throws —
 * a push failure must never break the order/points/commission flow that
 * triggered it. Dead subscriptions (404/410) are cleaned up automatically.
 *
 * Usage: sendPush(userId, { type: 'commission', title: '...', body: '...' })
 */
async function sendPush(userId, { type, title, body }) {
  if (!userId) return;
  try {
    const { rows } = await pool.query(
      'SELECT id, subscription FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    if (rows.length === 0) return;

    const payload = JSON.stringify({ title, body, url: urlFor(type) });

    await Promise.all(rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription is dead (uninstalled, permission revoked, etc.)
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [row.id]).catch(() => {});
        } else {
          console.error('sendPush error:', err.message);
        }
      }
    }));
  } catch (err) {
    console.error('sendPush lookup error:', err.message);
  }
}

const ksh = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
/**
 * Sends a push to every device subscribed by an admin user. Never throws.
 * `path` is the in-app hash route opened when the notification is tapped.
 */
async function sendPushToAdmins({ title, body, path = '/admin' }) {
  try {
    const { rows } = await pool.query(
      `SELECT ps.id, ps.subscription
       FROM push_subscriptions ps
       JOIN users u ON u.id = ps.user_id
       WHERE u.role = 'admin'`
    );
    if (rows.length === 0) return;
    const payload = JSON.stringify({ title, body, url: `${FRONTEND_URL}/#${path}` });
    await Promise.all(rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [row.id]).catch(() => {});
        } else {
          console.error('sendPushToAdmins error:', err.message);
        }
      }
    }));
  } catch (err) {
    console.error('sendPushToAdmins lookup error:', err.message);
  }
}
/**
 * outcome: 'confirmed' | 'failed'. `order` needs order_number/id, total, customer_name.
 * `reason` is optional (e.g. the M-Pesa ResultDesc for a failed payment).
 */
function notifyAdminsOfOrder(order, outcome, reason) {
  const ref  = order.order_number || `#${order.id}`;
  const who  = order.customer_name || 'A customer';
  if (outcome === 'confirmed') {
    return sendPushToAdmins({
      title: `New order ${ref}`,
      body:  `${who} · ${ksh(order.total)} has been confirmed.`,
    });
  }
  return sendPushToAdmins({
    title: `Payment failed ${ref}`,
    body:  `${who} · ${ksh(order.total)}${reason ? ' · ' + reason : ''}`,
  });
}
module.exports = { sendPush, sendPushToAdmins, notifyAdminsOfOrder };