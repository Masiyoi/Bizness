// server/controllers/pushController.js
const pool = require('../config/db');

// POST /api/push/subscribe   (auth required)
// Body: the raw PushSubscription object returned by pushManager.subscribe()
exports.subscribe = async (req, res) => {
  const userId = req.user.id;
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ msg: 'Invalid subscription' });
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE
         SET subscription = EXCLUDED.subscription, user_id = EXCLUDED.user_id`,
      [userId, subscription.endpoint, subscription]
    );
    res.status(201).json({ subscribed: true });
  } catch (err) {
    console.error('push subscribe error:', err.message);
    res.status(500).json({ msg: 'Could not save subscription' });
  }
};

// POST /api/push/unsubscribe   (auth required)
// Body: { endpoint }
exports.unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ msg: 'endpoint required' });
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ unsubscribed: true });
  } catch (err) {
    console.error('push unsubscribe error:', err.message);
    res.status(500).json({ msg: 'Could not remove subscription' });
  }
};