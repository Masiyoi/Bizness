const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  createSalesperson,
  listSalespersons,
  getSalesperson,
  updateSalesperson,
  markPaid,
  getMyStats,
  getMyEarnings,
} = require('../controllers/affiliateController');

// Admin routes
router.post('/salespersons', auth, adminOnly, createSalesperson);
router.get('/salespersons', auth, adminOnly, listSalespersons);
router.get('/salespersons/:id', auth, adminOnly, getSalesperson);
router.patch('/salespersons/:id', auth, adminOnly, updateSalesperson);
router.patch('/salespersons/:id/payout', auth, adminOnly, markPaid);

// User routes
router.get('/me', auth, getMyStats);
router.get('/me/earnings', auth, getMyEarnings);

module.exports = router;