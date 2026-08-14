const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth'); // ⚠ verify this matches your actual auth middleware path
const { getDiscountPreview, getDiscountHistory } = require('../controllers/discountController');

router.get('/preview', auth, getDiscountPreview);
router.get('/history', auth, getDiscountHistory);

module.exports = router;
