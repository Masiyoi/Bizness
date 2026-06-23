// backend/routes/analyticsRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Mount this file in your main app/index.js:
//   const analyticsRoutes = require('./routes/analyticsRoutes');
//   app.use('/api/admin', adminMiddleware, analyticsRoutes);
//
// (adminMiddleware = your existing JWT + role==='admin' guard)
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();

const {
  getAnalytics,
  getSalesReport,
  getInventoryReport,
  getProfitReport,
  updateCostPrice,
} = require('../controllers/analyticsController');

// ── Analytics (date-ranged, for the Analytics tab) ────────────────────────────
// GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/analytics', getAnalytics);

// ── Reports (printable, for the Reports tab) ─────────────────────────────────
// GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/reports/sales', getSalesReport);

// GET /api/admin/reports/inventory
router.get('/reports/inventory', getInventoryReport);

// GET /api/admin/reports/profit?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/reports/profit', getProfitReport);

// ── Product cost price ────────────────────────────────────────────────────────
// PATCH /api/admin/products/:id/cost   body: { cost_price: number }
router.patch('/products/:id/cost', updateCostPrice);

module.exports = router;