// Server/routes/productRoutes.js
const express   = require('express');
const router    = express.Router();

const {
  getProducts,
  getProductById,
  getNewArrivals,
  getBestSellers,
} = require('../controllers/productController');

// ── Public ─────────────────────────────────────────────────────────
// Named routes MUST come before /:id
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/',             getProducts);
router.get('/:id',          getProductById);

module.exports = router;