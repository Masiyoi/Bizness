// services/activityLogger.js
const db = require('../config/db');

async function logActivity({ userId = null, eventType, metadata = {}, req = null }) {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, event_type, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        eventType,
        JSON.stringify(metadata),
        req?.ip || null,
        req?.headers['user-agent'] || null,
      ]
    );
  } catch (err) {
    console.error('activityLogger failed:', err);
  }
}

module.exports = { logActivity };