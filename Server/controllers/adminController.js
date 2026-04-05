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
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// ── Safely convert any value to a valid JSON array string for ::jsonb cast ────
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
  images:   Array.isArray(p.images)   ? p.images   : [],
  features: Array.isArray(p.features) ? p.features : [],
  colors:   Array.isArray(p.colors)   ? p.colors   : [],
  sizes:    Array.isArray(p.sizes)    ? p.sizes    : [],
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
    const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(normaliseProduct(result.rows[0]));
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
      category    = null,
      description = null,
      features    = '[]',
      stock       = '0',
      colors      = '[]',
      sizes       = '[]',
    } = req.body;

    if (!name || !price) return res.status(400).json({ msg: 'Name and price are required' });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
      imageUrls = uploads.map(u => u.secure_url);
    }

    const featuresJson = toJsonString(features);
    const colorsJson   = toJsonString(colors);
    const sizesJson    = toJsonString(sizes);
    const imagesJson   = JSON.stringify(imageUrls);

    const result = await db.query(
      `INSERT INTO products
         (name, price, category, description, features, stock, images, image_url, colors, sizes)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb)
       RETURNING *`,
      [
        name,
        price,
        category    || null,
        description || null,
        featuresJson,
        parseInt(stock) || 0,
        imagesJson,
        imageUrls[0] || null,
        colorsJson,
        sizesJson,
      ]
    );

    res.status(201).json(normaliseProduct(result.rows[0]));
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    console.log('=== UPDATE PRODUCT DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files?.length, 'files');
    console.log('sizes value:', req.body.sizes);
    console.log('===========================');

    const {
      name,
      price,
      category       = null,
      description    = null,
      features       = '[]',
      stock          = '0',
      existingImages = '[]',
      colors         = '[]',
      sizes          = '[]',
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
    } catch {
      keptImages = [];
    }
    const allImgs = [...keptImages, ...newUrls];

    const featuresJson = toJsonString(features);
    const colorsJson   = toJsonString(colors);
    const sizesJson    = toJsonString(sizes);
    const imagesJson   = JSON.stringify(allImgs);

    const result = await db.query(
      `UPDATE products
       SET name        = $1,
           price       = $2,
           category    = $3,
           description = $4,
           features    = $5::jsonb,
           stock       = $6,
           images      = $7::jsonb,
           image_url   = $8,
           colors      = $9::jsonb,
           sizes       = $10::jsonb,
           updated_at  = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        price,
        category    || null,
        description || null,
        featuresJson,
        parseInt(stock) || 0,
        imagesJson,
        allImgs[0] || null,
        colorsJson,
        sizesJson,
        productId,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(normaliseProduct(result.rows[0]));
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
// COALESCE prefers columns stored directly on the orders row (set by the new
// mpesaCallback), then falls back to the JOIN values for older orders.
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
exports.getStats = async (req, res) => {
  try {
    const [
      totalOrdersRes,
      totalProductsRes,
      totalRevenueRes,
      totalUsersRes,
      activeOrdersRes,
      recentOrdersRes,
      topProductsRes,
      lowStockRes,
      revenueByDayRes,
      ordersByStatusRes,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM orders`),
      db.query(`SELECT COUNT(*) FROM products`),
      db.query(`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders WHERE status NOT IN ('cancelled', 'pending')
      `),
      db.query(`SELECT COUNT(*) FROM users WHERE role != 'admin'`),
      db.query(`
        SELECT COUNT(*) FROM orders
        WHERE status NOT IN ('delivered', 'cancelled')
      `),
      // COALESCE applied here too for the dashboard recent-orders panel
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
               COALESCE(SUM(o.total),0) AS total_revenue
        FROM products p
        LEFT JOIN orders o
          ON o.items_snapshot::text ILIKE '%"product_id":' || p.id || '%'
        GROUP BY p.id
        ORDER BY order_count DESC, p.created_at DESC LIMIT 5
      `),
      db.query(`
        SELECT id, name, stock, image_url, price
        FROM products WHERE stock <= 5
        ORDER BY stock ASC LIMIT 6
      `),
      db.query(`
        SELECT DATE(created_at)        AS day,
               COALESCE(SUM(total), 0) AS revenue,
               COUNT(*)                AS orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND status NOT IN ('cancelled', 'pending')
        GROUP BY DATE(created_at) ORDER BY day ASC
      `),
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM orders GROUP BY status ORDER BY count DESC
      `),
    ]);

    res.json({
      totalOrders:    parseInt(totalOrdersRes.rows[0].count),
      totalProducts:  parseInt(totalProductsRes.rows[0].count),
      totalRevenue:   parseFloat(totalRevenueRes.rows[0].total),
      totalUsers:     parseInt(totalUsersRes.rows[0].count),
      activeOrders:   parseInt(activeOrdersRes.rows[0].count),
      recentOrders:   recentOrdersRes.rows,
      topProducts:    topProductsRes.rows,
      lowStock:       lowStockRes.rows,
      revenueByDay:   revenueByDayRes.rows,
      ordersByStatus: ordersByStatusRes.rows,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};