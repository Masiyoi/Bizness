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

// ── GET /api/products  (public) ───────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query  = `SELECT * FROM products WHERE 1=1`;
    const vals = [];
    if (category) { vals.push(category);       query += ` AND category = $${vals.length}`; }
    if (search)   { vals.push(`%${search}%`);  query += ` AND name ILIKE $${vals.length}`; }
    query +=
      sort === 'price_asc'  ? ' ORDER BY price ASC'  :
      sort === 'price_desc' ? ' ORDER BY price DESC' :
                              ' ORDER BY created_at DESC';
    const result = await db.query(query, vals);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/products/:id  (public) ──────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── POST /api/admin/products ──────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, description, features, stock } = req.body;
    if (!name || !price) return res.status(400).json({ msg: 'Name and price are required' });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
      imageUrls = uploads.map(u => u.secure_url);
    }

    const parsedFeatures =
      typeof features === 'string' ? JSON.parse(features || '[]') : (features || []);

    const result = await db.query(
      `INSERT INTO products (name, price, category, description, features, stock, images, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        name, price, category || null, description || null,
        JSON.stringify(parsedFeatures), parseInt(stock) || 0,
        JSON.stringify(imageUrls), imageUrls[0] || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, category, description, features, stock, existingImages } = req.body;
    const productId = req.params.id;

    let newUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
      newUrls = uploads.map(u => u.secure_url);
    }

    const kept    = typeof existingImages === 'string'
      ? JSON.parse(existingImages || '[]') : (existingImages || []);
    const allImgs = [...kept, ...newUrls];
    const parsedFeatures =
      typeof features === 'string' ? JSON.parse(features || '[]') : (features || []);

    const result = await db.query(
      `UPDATE products
       SET name=$1, price=$2, category=$3, description=$4,
           features=$5, stock=$6, images=$7, image_url=$8
       WHERE id=$9 RETURNING *`,
      [
        name, price, category || null, description || null,
        JSON.stringify(parsedFeatures), parseInt(stock) || 0,
        JSON.stringify(allImgs), allImgs[0] || null,
        productId,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── PATCH /api/admin/products/:id/stock  (quick stock update) ─────────────────
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || parseInt(stock) < 0)
      return res.status(400).json({ msg: 'Valid stock value required' });
    const result = await db.query(
      `UPDATE products SET stock=$1 WHERE id=$2 RETURNING id, name, stock`,
      [parseInt(stock), req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    // NOTE: users table uses full_name (not name)
    const result = await db.query(
      `SELECT o.*,
              u.full_name   AS customer_name,
              u.email       AS customer_email,
              p.phone       AS mpesa_phone,
              p.mpesa_receipt
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
      `UPDATE orders SET status=$1, tracking_status=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status, tracking_status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ msg: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
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

      // Total orders
      db.query(`SELECT COUNT(*) FROM orders`),

      // Total products
      db.query(`SELECT COUNT(*) FROM products`),

      // Revenue — only confirmed/processing/shipped/delivered orders
      db.query(`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders
        WHERE status NOT IN ('cancelled', 'pending')
      `),

      // Customers (non-admin users)
      db.query(`SELECT COUNT(*) FROM users WHERE role != 'admin'`),

      // Active orders needing attention
      db.query(`
        SELECT COUNT(*) FROM orders
        WHERE status NOT IN ('delivered', 'cancelled')
      `),

      // Recent 8 orders with customer info
      db.query(`
        SELECT o.id, o.total, o.status, o.tracking_status, o.created_at,
               u.full_name  AS customer_name,
               u.email      AS customer_email,
               p.phone      AS mpesa_phone,
               p.mpesa_receipt
        FROM orders o
        LEFT JOIN users    u ON o.user_id    = u.id
        LEFT JOIN payments p ON o.payment_id = p.id
        ORDER BY o.created_at DESC
        LIMIT 8
      `),

      // Top 5 products by number of orders (approximate via JSON snapshot)
      db.query(`
        SELECT p.id, p.name, p.price, p.image_url, p.stock,
               COUNT(o.id)              AS order_count,
               COALESCE(SUM(o.total),0) AS total_revenue
        FROM products p
        LEFT JOIN orders o
          ON o.items_snapshot::text ILIKE '%"product_id":' || p.id || '%'
        GROUP BY p.id
        ORDER BY order_count DESC, p.created_at DESC
        LIMIT 5
      `),

      // Low stock (≤ 5 units)
      db.query(`
        SELECT id, name, stock, image_url, price
        FROM products
        WHERE stock <= 5
        ORDER BY stock ASC
        LIMIT 6
      `),

      // Revenue per day — last 7 days
      db.query(`
        SELECT DATE(created_at)           AS day,
               COALESCE(SUM(total), 0)    AS revenue,
               COUNT(*)                   AS orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND status NOT IN ('cancelled', 'pending')
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),

      // Order breakdown by status
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
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
    console.error('Stats error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};