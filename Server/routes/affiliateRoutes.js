const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/affiliateController');

// Admin endpoints
router.post('/salespersons', auth, adminOnly, ctrl.createSalesperson);
router.get('/salespersons', auth, adminOnly, ctrl.listSalespersons);
router.patch('/salespersons/:id/payout', auth, adminOnly, ctrl.markPaid);

// Salesperson-facing (self only)
router.get('/me', auth, ctrl.getMyStats);

module.exports = router;