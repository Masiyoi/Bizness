const fs = require("fs");
const file = "C:\\Users\\Administrator\\bizness\\Server\\controllers\\pesapalController.js";
let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
let missed = [];
function replaceOnce(label, oldStr, newStr) {
  if (content.includes(newStr)) { console.log("[SKIP] " + label + " already applied"); return; }
  const count = content.split(oldStr).length - 1;
  if (count !== 1) { console.warn("[MISS] " + label + " -- found " + count + " matches (need exactly 1)"); missed.push(label); return; }
  content = content.replace(oldStr, newStr);
  console.log("[OK] " + label);
}
replaceOnce(
  "Edit 1 (declare affiliateCode in fulfillPesapalPayment)",
  "  const reservedOrderNumber = shippingMeta.reserved_order_number || null;\n\n  // NOTE:",
  "  const reservedOrderNumber = shippingMeta.reserved_order_number || null;\n  const affiliateCode = shippingMeta.affiliate_code || null;\n\n  // NOTE:"
);
replaceOnce(
  "Edit 2a (capture orderInsertRes + add column)",
  "\n  await db.query(\n    `INSERT INTO orders\n       (user_id, payment_id, status, tracking_status, total, delivery_fee,\n        delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,\n        discount_type, discount_amount, order_number)\n     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,",
  "\n  const orderInsertRes = await db.query(\n    `INSERT INTO orders\n       (user_id, payment_id, status, tracking_status, total, delivery_fee,\n        delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,\n        discount_type, discount_amount, order_number, affiliate_code)\n     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)\n     RETURNING id`,"
);
replaceOnce(
  "Edit 2b (params + commission insert)",
  "      discountAmount,\n      reservedOrderNumber,\n    ]\n  );\n\n  await db.query(\n    `DELETE FROM cart_items",
  "      discountAmount,\n      reservedOrderNumber,\n      affiliateCode,\n    ]\n  );\n  const newOrderId = orderInsertRes.rows[0]?.id;\n\n  if (affiliateCode && newOrderId) {\n    try {\n      const spRes = await db.query(\n        `SELECT id, commission_pct FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,\n        [affiliateCode]\n      );\n      if (spRes.rows.length > 0) {\n        const sp = spRes.rows[0];\n        const commissionAmount = (Number(payment.amount) * Number(sp.commission_pct)) / 100;\n        await db.query(\n          `INSERT INTO affiliate_earnings (salesperson_id, order_id, order_total, commission_amount)\n           VALUES ($1, $2, $3, $4)`,\n          [sp.id, newOrderId, payment.amount, commissionAmount]\n        );\n      }\n    } catch (commErr) {\n      console.error('Affiliate commission recording error:', commErr.message);\n    }\n  }\n\n  await db.query(\n    `DELETE FROM cart_items"
);
replaceOnce(
  "Edit 4 (validate code in initiatePayment)",
  "    return res.status(500).json({ msg: 'Failed to calculate order total' });\n  }\n\n  // Generate a unique merchant reference for this order",
  "    return res.status(500).json({ msg: 'Failed to calculate order total' });\n  }\n\n  let validatedAffiliateCode = null;\n  if (affiliate_code) {\n    try {\n      const spRes = await db.query(\n        `SELECT coupon_code FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,\n        [String(affiliate_code).trim().toUpperCase()]\n      );\n      if (spRes.rows.length > 0) {\n        validatedAffiliateCode = spRes.rows[0].coupon_code;\n      }\n    } catch (err) {\n      console.error('Affiliate code validation error:', err.message);\n    }\n  }\n\n  // Generate a unique merchant reference for this order"
);
replaceOnce(
  "Edit 6 (declare affiliateCode in cancelled branch)",
  "          const reservedOrderNumber = shippingMeta.reserved_order_number || null;\n\n          const cartRes = await db.query(",
  "          const reservedOrderNumber = shippingMeta.reserved_order_number || null;\n          const affiliateCode = shippingMeta.affiliate_code || null;\n\n          const cartRes = await db.query("
);
if (missed.length) {
  console.log("\nFile NOT written -- missed: " + missed.join(", "));
  process.exit(1);
} else {
  content = content.replace(/\n/g, "\r\n");
  fs.writeFileSync(file, content, "utf8");
  console.log("\nSUCCESS: pesapalController.js updated");
}
