require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');
const { notifyAdminsOfOrder } = require('../utils/webPush');
(async () => {
  const admins = await pool.query(
    `SELECT u.id, u.email, u.role, COUNT(ps.id)::int AS subs
     FROM users u LEFT JOIN push_subscriptions ps ON ps.user_id = u.id
     WHERE u.role = 'admin' GROUP BY u.id, u.email, u.role`
  );
  console.log('Admins:', admins.rows);
  const subs = await pool.query(
    `SELECT ps.id, ps.user_id, left(ps.endpoint, 45) AS endpoint
     FROM push_subscriptions ps JOIN users u ON u.id = ps.user_id
     WHERE u.role = 'admin'`
  );
  console.log('Admin subscriptions:', subs.rows);
  console.log('Sending test push...');
  await notifyAdminsOfOrder(
    { order_number: 'TEST-001', total: 1234, customer_name: 'Test Customer' },
    'confirmed'
  );
  console.log('Done. Any errors would be printed above as "sendPushToAdmins error".');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });