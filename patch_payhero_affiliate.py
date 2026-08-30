import shutil
from pathlib import Path

TARGET = Path("Server/controllers/payheroController.js")

def read_text(p: Path) -> str:
    raw = p.read_bytes()
    return raw.decode("utf-8").replace("\r\n", "\n")

def write_text(p: Path, text: str, had_crlf: bool):
    if had_crlf:
        text = text.replace("\n", "\r\n")
    p.write_bytes(text.encode("utf-8"))

def apply_patch(path: Path, replacements):
    if not path.exists():
        print(f"[SKIP] {path} not found")
        return
    raw = path.read_bytes()
    had_crlf = b"\r\n" in raw
    text = read_text(path)

    backup = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup)
    print(f"[BACKUP] {backup}")

    changed = 0
    for label, old, new in replacements:
        count = text.count(old)
        if count == 0:
            print(f"[X] pattern not found: {label}")
        elif count > 1:
            print(f"[X] pattern not unique ({count}x), skipped: {label}")
        else:
            text = text.replace(old, new)
            print(f"[OK] {label}")
            changed += 1

    if changed:
        write_text(path, text, had_crlf)
        print(f"[WRITTEN] {path} ({changed}/{len(replacements)} patches applied)")
    else:
        print(f"[NO CHANGES] {path}")

replacements = [
    (
        "stkPush: accept + validate affiliate_code from request body",
        """exports.stkPush = async (req, res) => {
  const {
    phone,
    delivery_zone,
    delivery_fee = 0,
    shipping       = {},
    selectedColors = {},
    selectedSizes  = {},
    reserved_order_number = null,
  } = req.body;
  const userId = req.user.id;

  if (!phone) {
    return res.status(400).json({ msg: 'Phone is required' });
  }""",
        """exports.stkPush = async (req, res) => {
  const {
    phone,
    delivery_zone,
    delivery_fee = 0,
    shipping       = {},
    selectedColors = {},
    selectedSizes  = {},
    reserved_order_number = null,
    affiliate_code = null,
  } = req.body;
  let validatedAffiliateCode = null;
  if (affiliate_code) {
    try {
      const spRes = await db.query(
        `SELECT coupon_code FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,
        [String(affiliate_code).trim().toUpperCase()]
      );
      if (spRes.rows.length > 0) {
        validatedAffiliateCode = spRes.rows[0].coupon_code;
      }
    } catch (err) {
      console.error('Affiliate code validation error:', err.message);
    }
  }
  const userId = req.user.id;

  if (!phone) {
    return res.status(400).json({ msg: 'Phone is required' });
  }""",
    ),
    (
        "stkPush: persist validated affiliate_code into shipping_meta",
        """        JSON.stringify({
          shipping, selectedColors, selectedSizes, delivery_zone, delivery_fee,
          discount_amount: discountInfo.discountAmount,
          discount_type: discountInfo.eligible ? 'first_order' : null,
          reserved_order_number,
          external_reference: externalReference,
        }),""",
        """        JSON.stringify({
          shipping, selectedColors, selectedSizes, delivery_zone, delivery_fee,
          discount_amount: discountInfo.discountAmount,
          discount_type: discountInfo.eligible ? 'first_order' : null,
          reserved_order_number,
          external_reference: externalReference,
          affiliate_code: validatedAffiliateCode,
        }),""",
    ),
    (
        "fulfillPayHeroPayment: read affiliateCode from shipping_meta",
        """  const payment       = paymentRes.rows[0];
  const shippingMeta  = payment.shipping_meta || {};
  const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
  const deliveryZone  = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
  const deliveryFee   = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
  const discountAmount = Number(shippingMeta.discount_amount) || 0;
  const discountType   = shippingMeta.discount_type || null;
  const reservedOrderNumber = shippingMeta.reserved_order_number || null;

  const cartRes = await db.query(
    `SELECT
       ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
       p.name, p.image_url, p.category,
       CASE
          WHEN p.sale_price IS NOT NULL
           AND p.sale_price < p.price
           AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
         THEN p.sale_price
         ELSE p.price
       END AS effective_price
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products   p  ON p.id = ci.product_id
     WHERE c.user_id = $1`,
    [payment.user_id]
  );""",
        """  const payment       = paymentRes.rows[0];
  const shippingMeta  = payment.shipping_meta || {};
  const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
  const deliveryZone  = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
  const deliveryFee   = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
  const discountAmount = Number(shippingMeta.discount_amount) || 0;
  const discountType   = shippingMeta.discount_type || null;
  const reservedOrderNumber = shippingMeta.reserved_order_number || null;
  const affiliateCode  = shippingMeta.affiliate_code || null;

  const cartRes = await db.query(
    `SELECT
       ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
       p.name, p.image_url, p.category,
       CASE
          WHEN p.sale_price IS NOT NULL
           AND p.sale_price < p.price
           AND (p.sale_ends_at IS NULL OR p.sale_ends_at > NOW())
         THEN p.sale_price
         ELSE p.price
       END AS effective_price
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products   p  ON p.id = ci.product_id
     WHERE c.user_id = $1`,
    [payment.user_id]
  );""",
    ),
    (
        "fulfillPayHeroPayment: add affiliate_code to orders INSERT + record commission",
        """  await db.query(
    `INSERT INTO orders
       (user_id, payment_id, status, tracking_status, total, delivery_fee,
        delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
        discount_type, discount_amount, order_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      payment.user_id,
      payment.id,
      'confirmed',
      'Payment Confirmed',
      payment.amount,
      deliveryFee,
      deliveryZone,
      JSON.stringify(itemsSnapshot),
      shipping.firstName || 'Customer',
      shipping.phone || payment.phone,
      confirmationCode,
      discountType,
      discountAmount,
      reservedOrderNumber,
    ]
  );

  await db.query(
    `DELETE FROM cart_items
     WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
    [payment.user_id]
  );

  await awardOrderPoints(payment.user_id, payment.amount);
  console.log(`✅ PayHero order fulfilled — user ${payment.user_id} — ref ${confirmationCode}`);
};""",
        """  const orderInsertRes = await db.query(
    `INSERT INTO orders
       (user_id, payment_id, status, tracking_status, total, delivery_fee,
        delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
        discount_type, discount_amount, order_number, affiliate_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id`,
    [
      payment.user_id,
      payment.id,
      'confirmed',
      'Payment Confirmed',
      payment.amount,
      deliveryFee,
      deliveryZone,
      JSON.stringify(itemsSnapshot),
      shipping.firstName || 'Customer',
      shipping.phone || payment.phone,
      confirmationCode,
      discountType,
      discountAmount,
      reservedOrderNumber,
      affiliateCode,
    ]
  );
  const newOrderId = orderInsertRes.rows[0]?.id;

  if (affiliateCode && newOrderId) {
    try {
      const spRes = await db.query(
        `SELECT id, commission_pct FROM salespersons WHERE coupon_code = $1 AND status = 'active'`,
        [affiliateCode]
      );
      if (spRes.rows.length > 0) {
        const sp = spRes.rows[0];
        const commissionAmount = (Number(payment.amount) * Number(sp.commission_pct)) / 100;
        await db.query(
          `INSERT INTO affiliate_earnings (salesperson_id, order_id, order_total, commission_amount)
           VALUES ($1, $2, $3, $4)`,
          [sp.id, newOrderId, payment.amount, commissionAmount]
        );
      }
    } catch (commErr) {
      console.error('Affiliate commission recording error:', commErr.message);
    }
  }

  await db.query(
    `DELETE FROM cart_items
     WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
    [payment.user_id]
  );

  await awardOrderPoints(payment.user_id, payment.amount);
  console.log(`✅ PayHero order fulfilled — user ${payment.user_id} — ref ${confirmationCode}`);
};""",
    ),
    (
        "payHeroCallback failure branch: track affiliateCode + add to cancelled-order INSERT",
        """          const payment      = paymentRes.rows[0];
          const shippingMeta = payment.shipping_meta || {};
          const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
          const deliveryZone = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
          const deliveryFee  = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
          const discountAmount = Number(shippingMeta.discount_amount) || 0;
          const discountType   = shippingMeta.discount_type || null;
          const reservedOrderNumber = shippingMeta.reserved_order_number || null;

          const cartRes = await db.query(
            `SELECT
               ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
               p.name, p.price, p.image_url, p.category
             FROM carts c
             JOIN cart_items ci ON ci.cart_id = c.id
             JOIN products   p  ON p.id = ci.product_id
             WHERE c.user_id = $1`,
            [payment.user_id]
          );

          const itemsArray = cartRes.rows.map(item => ({
            id:             item.id,
            product_id:     item.product_id,
            name:           item.name,
            price:          item.price,
            image_url:      item.image_url,
            category:       item.category,
            quantity:       item.quantity,
            selected_color: item.selected_color || selectedColors[String(item.id)] || null,
            selected_size:  item.selected_size  || selectedSizes[String(item.id)]  || null,
          }));

          const itemsSnapshot = { items: itemsArray, shipping, deliveryZone };

          await db.query(
            `INSERT INTO orders
               (user_id, payment_id, status, tracking_status, total, delivery_fee,
                delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
                discount_type, discount_amount, order_number)
             VALUES ($1, $2, 'cancelled', 'Payment Failed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              payment.user_id,
              payment.id,
              payment.amount,
              deliveryFee,
              deliveryZone,
              JSON.stringify(itemsSnapshot),
              shipping.firstName || 'Customer',
              shipping.phone || payment.phone,
              null,
              discountType,
              discountAmount,
              reservedOrderNumber,
            ]
          );

          console.log(`📋 Cancelled-order record created for user ${payment.user_id}`);""",
        """          const payment      = paymentRes.rows[0];
          const shippingMeta = payment.shipping_meta || {};
          const { shipping = {}, selectedColors = {}, selectedSizes = {} } = shippingMeta;
          const deliveryZone = shippingMeta.delivery_zone || payment.delivery_zone || 'cbd';
          const deliveryFee  = shippingMeta.delivery_fee  || payment.delivery_fee  || 0;
          const discountAmount = Number(shippingMeta.discount_amount) || 0;
          const discountType   = shippingMeta.discount_type || null;
          const reservedOrderNumber = shippingMeta.reserved_order_number || null;
          const affiliateCode = shippingMeta.affiliate_code || null;

          const cartRes = await db.query(
            `SELECT
               ci.id, ci.product_id, ci.quantity, ci.selected_color, ci.selected_size,
               p.name, p.price, p.image_url, p.category
             FROM carts c
             JOIN cart_items ci ON ci.cart_id = c.id
             JOIN products   p  ON p.id = ci.product_id
             WHERE c.user_id = $1`,
            [payment.user_id]
          );

          const itemsArray = cartRes.rows.map(item => ({
            id:             item.id,
            product_id:     item.product_id,
            name:           item.name,
            price:          item.price,
            image_url:      item.image_url,
            category:       item.category,
            quantity:       item.quantity,
            selected_color: item.selected_color || selectedColors[String(item.id)] || null,
            selected_size:  item.selected_size  || selectedSizes[String(item.id)]  || null,
          }));

          const itemsSnapshot = { items: itemsArray, shipping, deliveryZone };

          await db.query(
            `INSERT INTO orders
               (user_id, payment_id, status, tracking_status, total, delivery_fee,
                delivery_zone, items_snapshot, customer_name, mpesa_phone, mpesa_receipt,
                discount_type, discount_amount, order_number, affiliate_code)
             VALUES ($1, $2, 'cancelled', 'Payment Failed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              payment.user_id,
              payment.id,
              payment.amount,
              deliveryFee,
              deliveryZone,
              JSON.stringify(itemsSnapshot),
              shipping.firstName || 'Customer',
              shipping.phone || payment.phone,
              null,
              discountType,
              discountAmount,
              reservedOrderNumber,
              affiliateCode,
            ]
          );

          console.log(`📋 Cancelled-order record created for user ${payment.user_id}`);""",
    ),
]

apply_patch(TARGET, replacements)