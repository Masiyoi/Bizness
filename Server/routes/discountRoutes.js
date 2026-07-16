const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth'); // ⚠ verify this matches your actual auth middleware path
const { getDiscountPreview } = require('../controllers/discountController');

router.get('/preview', auth, getDiscountPreview);

module.exports = router;
