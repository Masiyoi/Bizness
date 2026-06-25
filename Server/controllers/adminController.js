const db          = require('../config/db');
const cloudinary  = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Upload helper ─────────────────────────────────────────────────────────────
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bizna_products',
        transformation: [
          { width: 800, height: 1000, crop: 'pad', background: 'white', gravity: 'center' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// ── Save variants for a product (upsert all, delete removed) ─────────────────
const saveVariants = async (productId, variantsJson) => {
  let variants = [];
  try {
    const parsed = typeof variantsJson === 'string' ? JSON.parse(variantsJson) : variantsJson;
    variants = Array.isArray(parsed) ? parsed : [];
  } catch {
    variants = [];
  }

  if (!variants.length) return;

  await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

  for (const v of variants) {
    const color = v.color || null;
    const size  = v.size  || null;
    if (!color && !size) continue;
    // zero-stock variants are valid — do not skip them
    await db.query(
      `INSERT INTO product_variants (product_id, color, size, stock, sku)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, color, size, parseInt(v.stock) || 0, v.sku || null]
    );
  }
};

// ── Fetch variants for a product ──────────────────────────────────────────────
const getVariants = async (productId) => {
  const result = await db.query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color, size',
    [productId]
  );
  return result.rows;
};

// ── Compute total stock from variants ─────────────────────────────────────────
const sumVariantStock = (variants) =>
  variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

// ── Safely convert any value to a valid JSON array string ────────────────────
const toJsonString = (val) => {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch {
      return '[]';
    }
  }
  return '[]';
};

// ── Normalise a product row before sending to the client ─────────────────────
const normaliseProduct = (p) => ({
  ...p,
  images:      Array.isArray(p.images)   ? p.images   : [],
  features:    Array.isArray(p.features) ? p.features : [],
  colors:      Array.isArray(p.colors)   ? p.colors   : [],
  sizes:       Array.isArray(p.sizes)    ? p.sizes    : [],
  cost_price:  p.cost_price  ? parseFloat(p.cost_price)  : null,
  sale_price:  p.sale_price  ? parseFloat(p.sale_price)  : null,
  sale_ends_at: p.sale_ends_at ?? null,
});

// ── GET /api/products  (public) ───────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query  = `SELECT * FROM products WHERE 1=1`;
    const vals = [];

    if (category) { vals.push(category);      query += ` AND category = $${vals.length}`; }
    if (search)   { vals.push(`%${search}%`); query += ` AND name ILIKE $${vals.length}`; }

    query +=
      sort === 'price_asc'  ? ' ORDER BY price ASC'  :
      sort === 'price_desc' ? ' ORDER BY price DESC' :
                              ' ORDER BY created_at DESC';

    const result = await db.query(query, vals);
    res.json(result.rows.map(normaliseProduct));
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/products/:id  (public) ──────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });

    const product = normaliseProduct(result.rows[0]);

    const variantResult = await db.query(
      `SELECT id, product_id, color, size,
              stock::integer AS stock,
              sku, created_at
       FROM product_variants
       WHERE product_id = $1
       ORDER BY color, size`,
      [req.params.id]
    );

    product.variants = variantResult.rows;

    if (product.variants.length > 0) {
      product.colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
      product.sizes  = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
    }

    res.json(product);
  } catch (err) {
    console.error('getProductById error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── POST /api/admin/products ──────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      cost_price   = null,   // NEW
      category     = null,
      description  = null,
      features     = '[]',
      colors       = '[]',
      sizes        = '[]',
      variants     = '[]',
      sale_price   = null,
      sale_ends_at = null,
    } = req.body;

    if (!name || !price) return res.status(400).json({ msg: 'Name and price are required' });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
      imageUrls = uploads.map(u => u.secure_url);
    }

    let parsedVariants = [];
    try { parsedVariants = JSON.parse(variants); } catch { parsedVariants = []; }
    const stockValue = parsedVariants.length ? sumVariantStock(parsedVariants) : 0;

    const featuresJson = toJsonString(features);
    const colorsJson   = toJsonString(colors);
    const sizesJson    = toJsonString(sizes);
    const imagesJson   = JSON.stringify(imageUrls);

    const result = await db.query(
      `INSERT INTO products
         (name, price, cost_price, category, description, features, stock, images, image_url, colors, sizes, sale_price, sale_ends_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10::jsonb, $11::jsonb, $12, $13)
       RETURNING *`,
      [
        name,
        price,
        cost_price   ? parseFloat(cost_price)   : null,
        category     || null,
        description  || null,
        featuresJson,
        stockValue,
        imagesJson,
        imageUrls[0] || null,
        colorsJson,
        sizesJson,
        sale_price   || null,
        sale_ends_at || null,
      ]
    );

    const newProduct = normaliseProduct(result.rows[0]);
    await saveVariants(newProduct.id, variants);
    newProduct.variants = await getVariants(newProduct.id);

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      cost_price     = null,   // NEW
      category       = null,
      description    = null,
      features       = '[]',
      existingImages = '[]',
      colors         = '[]',
      sizes          = '[]',
      variants       = '[]',
      sale_price     = null,
      sale_ends_at   = null,
    } = req.body;

    const productId = req.params.id;

    let newUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
      newUrls = uploads.map(u => u.secure_url);
    }

    let keptImages = [];
    try {
      const parsed = JSON.parse(existingImages);
      keptImages = Array.isArray(parsed) ? parsed : [];
    } catch { keptImages = []; }

    const allImgs = [...keptImages, ...newUrls];

    let parsedVariants = [];
    try { parsedVariants = JSON.parse(variants); } catch { parsedVariants = []; }
    const stockValue = parsedVariants.length ? sumVariantStock(parsedVariants) : parseInt(req.body.stock) || 0;

    const featuresJson = toJsonString(features);
    const colorsJson   = toJsonString(colors);
    const sizesJson    = toJsonString(sizes);
    const imagesJson   = JSON.stringify(allImgs);

    const result = await db.query(
      `UPDATE products
       SET name         = $1,
           price        = $2,
           cost_price   = $3,
           category     = $4,
           description  = $5,
           features     = $6::jsonb,
           stock        = $7,
           images       = $8::jsonb,
           image_url    = $9,
           colors       = $10::jsonb,
           sizes        = $11::jsonb,
           sale_price   = $12,
           sale_ends_at = $13,
           updated_at   = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        name,
        price,
        cost_price   ? parseFloat(cost_price)   : null,
        category     || null,
        description  || null,
        featuresJson,
        stockValue,
        imagesJson,
        allImgs[0]   || null,
        colorsJson,
        sizesJson,
        sale_price   || null,
        sale_ends_at || null,
        productId,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });

    const updated = normaliseProduct(result.rows[0]);
    await saveVariants(productId, variants);
    updated.variants = await getVariants(productId);

    res.json(updated);
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PATCH /api/admin/products/:id/stock ──────────────────────────────────────
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || parseInt(stock) < 0)
      return res.status(400).json({ msg: 'Valid stock value required' });

    const result = await db.query(
      `UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stock`,
      [parseInt(stock), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateStock error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PATCH /api/admin/products/:id/cost ───────────────────────────────────────
exports.updateCostPrice = async (req, res) => {
  try {
    const { cost_price } = req.body;
    if (cost_price === undefined || isNaN(parseFloat(cost_price)) || parseFloat(cost_price) < 0)
      return res.status(400).json({ msg: 'Valid cost_price required' });

    const result = await db.query(
      `UPDATE products SET cost_price = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, name, price, cost_price`,
      [parseFloat(cost_price), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCostPrice error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error('deleteProduct error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*,
              COALESCE(o.customer_name,  u.full_name)    AS customer_name,
              COALESCE(o.customer_email, u.email)         AS customer_email,
              COALESCE(o.mpesa_phone,    p.phone)         AS mpesa_phone,
              COALESCE(o.mpesa_receipt,  p.mpesa_receipt) AS mpesa_receipt
       FROM orders o
       LEFT JOIN users    u ON o.user_id    = u.id
       LEFT JOIN payments p ON o.payment_id = p.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getOrders error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PATCH /api/admin/orders/:id/status ───────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, tracking_status } = req.body;
    const result = await db.query(
      `UPDATE orders
       SET status = $1, tracking_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, tracking_status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateOrderStatus error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Now supports ?from=YYYY-MM-DD&to=YYYY-MM-DD for date-ranged KPIs.
// Falls back to last 7 days when params are absent (backwards-compatible).
exports.getStats = async (req, res) => {
  try {
    // ── Date range ────────────────────────────────────────────────────────────
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();
    const from = req.query.from ? new Date(req.query.from)  : new Date(Date.now() - 6 * 86400000);
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    // Previous period (same length) for % change comparison
    const days  = Math.round((to - from) / 86400000) + 1;
    const pTo   = new Date(from.getTime() - 1);
    const pFrom = new Date(pTo.getTime() - (days - 1) * 86400000);
    pFrom.setHours(0, 0, 0, 0);
    pTo.setHours(23, 59, 59, 999);

    const pct = (cur, prev) =>
      !prev ? (cur > 0 ? 100 : 0)
            : parseFloat((((cur - prev) / prev) * 100).toFixed(1));

    const [
      totalsRes,
      prevTotalsRes,
      totalProductsRes,
      totalUsersRes,
      activeOrdersRes,
      recentOrdersRes,
      topProductsRes,
      lowStockRes,
      revenueByDayRes,
      ordersByStatusRes,
    ] = await Promise.all([

      // ── Current period: revenue + cost (for profit) ───────────────────────
      db.query(`
        SELECT
          COALESCE(SUM(o.total::numeric), 0) AS revenue,
          COUNT(o.id)                        AS orders,
          COALESCE(SUM(
            (
              SELECT COALESCE(SUM(
                (item->>'quantity')::numeric *
                COALESCE(p.cost_price, 0)
              ), 0)
              FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
                  THEN o.items_snapshot::jsonb
                  ELSE '[]'::jsonb
                END
              ) AS item
              LEFT JOIN products p ON p.id = (item->>'product_id')::int
            )
          ), 0) AS total_cost
        FROM orders o
        WHERE o.created_at BETWEEN $1 AND $2
          AND o.status NOT IN ('cancelled', 'pending')
      `, [from.toISOString(), to.toISOString()]),

      // ── Previous period: revenue + orders for % comparison ────────────────
      db.query(`
        SELECT
          COALESCE(SUM(total::numeric), 0) AS revenue,
          COUNT(id)                        AS orders
        FROM orders
        WHERE created_at BETWEEN $1 AND $2
          AND status NOT IN ('cancelled', 'pending')
      `, [pFrom.toISOString(), pTo.toISOString()]),

      db.query(`SELECT COUNT(*) FROM products`),
      db.query(`SELECT COUNT(*) FROM users WHERE role != 'admin'`),

      db.query(`
        SELECT COUNT(*) FROM orders
        WHERE status NOT IN ('delivered', 'cancelled')
      `),

      // Recent orders (always latest 8, not date-filtered)
      db.query(`
        SELECT o.id, o.total, o.status, o.tracking_status, o.created_at,
               COALESCE(o.customer_name,  u.full_name)    AS customer_name,
               COALESCE(o.customer_email, u.email)         AS customer_email,
               COALESCE(o.mpesa_phone,    p.phone)         AS mpesa_phone,
               COALESCE(o.mpesa_receipt,  p.mpesa_receipt) AS mpesa_receipt
        FROM orders o
        LEFT JOIN users    u ON o.user_id    = u.id
        LEFT JOIN payments p ON o.payment_id = p.id
        ORDER BY o.created_at DESC LIMIT 8
      `),

      db.query(`
        SELECT p.id, p.name, p.price, p.image_url, p.stock,
               COUNT(o.id)              AS order_count,
               COALESCE(SUM(o.total::numeric), 0) AS total_revenue
        FROM products p
        LEFT JOIN orders o
          ON o.items_snapshot::text ILIKE '%"product_id":' || p.id || '%'
        GROUP BY p.id
        ORDER BY order_count DESC, p.created_at DESC LIMIT 5
      `),

      // Low stock — prefer variant sum, fallback to products.stock
      db.query(`
        SELECT
          p.id, p.name, p.image_url, p.price,
          COALESCE(
            (SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id),
            p.stock
          ) AS stock
        FROM products p
        WHERE COALESCE(
          (SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id),
          p.stock
        ) <= 5
        ORDER BY stock ASC LIMIT 6
      `),

      // Revenue by day in range (with cost for profit overlay)
      db.query(`
        SELECT
          DATE(o.created_at)                   AS day,
          COALESCE(SUM(o.total::numeric), 0)   AS revenue,
          COUNT(o.id)                          AS orders,
          COALESCE(SUM(
            (
              SELECT COALESCE(SUM(
                (item->>'quantity')::numeric *
                COALESCE(p.cost_price, 0)
              ), 0)
              FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(o.items_snapshot::jsonb) = 'array'
                  THEN o.items_snapshot::jsonb
                  ELSE '[]'::jsonb
                END
              ) AS item
              LEFT JOIN products p ON p.id = (item->>'product_id')::int
            )
          ), 0) AS cost
        FROM orders o
        WHERE o.created_at BETWEEN $1 AND $2
          AND o.status NOT IN ('cancelled', 'pending')
        GROUP BY DATE(o.created_at)
        ORDER BY day ASC
      `, [from.toISOString(), to.toISOString()]),

      db.query(`
        SELECT status, COUNT(*) AS count
        FROM orders GROUP BY status ORDER BY count DESC
      `),
    ]);

    const t       = totalsRes.rows[0];
    const pt      = prevTotalsRes.rows[0];
    const revenue = parseFloat(t.revenue);
    const cost    = parseFloat(t.total_cost);
    const profit  = revenue - cost;
    const orders  = parseInt(t.orders);
    const pRev    = parseFloat(pt.revenue);
    const pOrds   = parseInt(pt.orders);
    const aov     = orders > 0 ? revenue / orders : 0;

    // Attach profit to each day row
    const revenueByDay = revenueByDayRes.rows.map(r => ({
      day:     r.day,
      revenue: r.revenue,
      orders:  r.orders,
      cost:    r.cost,
      profit:  (parseFloat(r.revenue) - parseFloat(r.cost)).toFixed(2),
    }));

    res.json({
      totalOrders:    orders,
      totalProducts:  parseInt(totalProductsRes.rows[0].count),
      totalRevenue:   revenue,
      totalUsers:     parseInt(totalUsersRes.rows[0].count),
      activeOrders:   parseInt(activeOrdersRes.rows[0].count),
      avgOrderValue:  parseFloat(aov.toFixed(2)),
      totalCost:      parseFloat(cost.toFixed(2)),
      totalProfit:    parseFloat(profit.toFixed(2)),
      profitMargin:   revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0,
      revenueVsPrev:  pct(revenue, pRev),
      ordersVsPrev:   pct(orders,  pOrds),
      recentOrders:   recentOrdersRes.rows,
      topProducts:    topProductsRes.rows,
      lowStock:       lowStockRes.rows,
      revenueByDay,
      ordersByStatus: ordersByStatusRes.rows,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/admin/customers ──────────────────────────────────────────────────
exports.getCustomers = async (req, res) => {
  try {
    const usersResult = await db.query(`
      SELECT id, full_name AS name, email, role,
             is_verified, profile_picture, created_at
      FROM users
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `);

    const users = usersResult.rows;
    if (!users.length) return res.json([]);

    const userIds = users.map(u => u.id);

    const ordersResult = await db.query(`
      SELECT id, user_id, total, status, created_at
      FROM orders
      WHERE user_id = ANY($1::int[])
      ORDER BY created_at DESC
    `, [userIds]);

    const ordersByUser = {};
    for (const o of ordersResult.rows) {
      if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
      ordersByUser[o.user_id].push(o);
    }

    const customers = users.map(u => {
      const orders = ordersByUser[u.id] || [];
      const total_spent = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      return { ...u, orders, total_spent };
    });

    res.json(customers);
  } catch (err) {
    console.error('getCustomers error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PATCH /api/admin/customers/:id/verify ────────────────────────────────────
exports.verifyCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE users
       SET is_verified              = TRUE,
           verification_token       = NULL,
           verification_token_expiry = NULL
       WHERE id = $1 AND role != 'admin'
       RETURNING id, full_name, email, is_verified`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('verifyCustomer error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};