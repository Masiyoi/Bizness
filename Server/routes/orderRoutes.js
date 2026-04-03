const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getOrders, getOrderById } = require('../controllers/ordersController');

router.get('/',    auth, getOrders);
router.get('/:id', auth, getOrderById);

module.exports = router;