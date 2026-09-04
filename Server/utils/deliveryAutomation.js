const db = require('../config/db');
// Time (ms) after payment confirmation before an order auto-transitions to
// "Delivered", based on delivery_zone. Keep in sync with ZONE_LABELS in
// frontend/src/pages/admin/constants.ts.
const DELIVERY_DELAYS_MS = {
  pickup:   0,
  cbd:      60 * 60 * 1000,        // 1 hour
  environs: 2 * 60 * 60 * 1000,    // 2 hours
  county:   24 * 60 * 60 * 1000,   // 24 hours
};
// Called at order-creation time (right after payment is confirmed). Pickup
// orders are marked Delivered immediately. Every other zone starts at
// "Payment Confirmed" with an auto_deliver_at timestamp; the cron job in
// server.js flips them to Delivered once that time passes.
function computeInitialDeliveryState(deliveryZone) {
  const zone = deliveryZone || 'cbd';
  if (zone === 'pickup') {
    return { status: 'delivered', tracking_status: 'Delivered', auto_deliver_at: null };
  }
  const delayMs = DELIVERY_DELAYS_MS[zone] ?? DELIVERY_DELAYS_MS.cbd;
  return {
    status: 'confirmed',
    tracking_status: 'Payment Confirmed',
    auto_deliver_at: new Date(Date.now() + delayMs),
  };
}
// Run on a schedule (see server.js). Flips any order whose auto_deliver_at
// has passed to Delivered, unless it was cancelled or already Delivered
// (e.g. an admin manually moved it, which also clears auto_deliver_at).
async function processAutoDeliveries() {
  const result = await db.query(
    `UPDATE orders
     SET status = 'delivered', tracking_status = 'Delivered', updated_at = NOW()
     WHERE auto_deliver_at IS NOT NULL
       AND auto_deliver_at <= NOW()
       AND tracking_status NOT IN ('Delivered')
       AND status NOT IN ('cancelled')
     RETURNING id`
  );
  return result.rows.length;
}
module.exports = { computeInitialDeliveryState, processAutoDeliveries, DELIVERY_DELAYS_MS };