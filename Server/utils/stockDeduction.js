const db = require('../config/db');
/**
 * Decrements stock for a completed order's items.
 * items: array of { product_id, quantity, selected_color, selected_size }
 * Decrements the matching product_variants row (by color+size) when one
 * exists, and always decrements the aggregate products.stock too — both
 * floored at 0 so stock never goes negative.
 */
const decrementStockForItems = async (items) => {
  for (const item of items || []) {
    const productId = item.product_id;
    const quantity  = Number(item.quantity) || 0;
    if (!productId || quantity <= 0) continue;
    const color = item.selected_color || null;
    const size  = item.selected_size  || null;
    try {
      if (color || size) {
        const variantRes = await db.query(
          `UPDATE product_variants
           SET stock = GREATEST(stock - $1, 0)
           WHERE product_id = $2
             AND COALESCE(color, '') = COALESCE($3, '')
             AND COALESCE(size, '')  = COALESCE($4, '')
           RETURNING id`,
          [quantity, productId, color, size]
        );
        if (variantRes.rows.length === 0) {
          console.warn(`decrementStockForItems: no matching variant for product ${productId} (${color}/${size})`);
        }
      }
      await db.query(
        `UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2`,
        [quantity, productId]
      );
    } catch (err) {
      console.error(`decrementStockForItems error for product ${productId}:`, err.message);
    }
  }
};
module.exports = { decrementStockForItems };
