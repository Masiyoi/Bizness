const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getOrders, getOrderById, reserveOrderNumber } = require('../controllers/ordersController');

router.post('/reserve-number', auth, reserveOrderNumber);
router.get('/',    auth, getOrders);
router.get('/:id', auth, getOrderById);

module.exports = router;