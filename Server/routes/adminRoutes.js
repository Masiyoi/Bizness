const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct, updateStock,
  getOrders, updateOrderStatus,
  getStats,
  getCustomers, verifyCustomer,          // ← add these two
} = require('../controllers/adminController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/products',     getProducts);
router.get('/products/:id', getProductById);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get   ('/admin/stats',                 auth, adminOnly, getStats);
router.get   ('/admin/orders',                auth, adminOnly, getOrders);
router.patch ('/admin/orders/:id/status',     auth, adminOnly, updateOrderStatus);
router.post  ('/admin/products',              auth, adminOnly, upload.array('images', 8), createProduct);
router.put   ('/admin/products/:id',          auth, adminOnly, upload.array('images', 8), updateProduct);
router.patch ('/admin/products/:id/stock',    auth, adminOnly, updateStock);
router.delete('/admin/products/:id',          auth, adminOnly, deleteProduct);
router.get   ('/admin/customers',             auth, adminOnly, getCustomers);        // ← fixed
router.patch ('/admin/customers/:id/verify',  auth, adminOnly, verifyCustomer);     // ← fixed

module.exports = router;