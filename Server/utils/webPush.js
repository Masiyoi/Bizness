// server/utils/webPush.js
//
// Setup:
//   npm install web-push
//   npx web-push generate-vapid-keys   (run once, save both keys)
// .env:
//   VAPID_PUBLIC_KEY=BKzyX7tfGxVfDULg0jYTJsuIi42XGl9UyVAkV1QO_als_5i-JMxVopkc0WFAUPrdwo2zmY7q0GO92u64mwOt-sE
//   VAPID_PRIVATE_KEY=uA4VN_H0mh0MWPNdSxfS3HPEXyNF9oZ8Ylq4WNniRfY
//   VAPID_SUBJECT=mailto:you@lukuprime.com
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

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lukuprime.com';

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

module.exports = { sendPush };