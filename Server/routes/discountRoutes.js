const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth'); // ⚠ verify this matches your actual auth middleware path
const { getDiscountPreview, getDiscountHistory, getDiscountEligibility } = require('../controllers/discountController');

router.get('/preview', auth, getDiscountPreview);
router.get('/history', auth, getDiscountHistory);
router.get('/eligibility', auth, getDiscountEligibility);

module.exports = router;
