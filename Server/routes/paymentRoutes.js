const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  stkPush,
  mpesaCallback,
  getPaymentStatus,
  querySTK,
} = require('../controllers/paymentController');

// Protected — user must be logged in
router.post('/stk-push',          auth, stkPush);
router.get ('/status/:checkoutRequestId', auth, getPaymentStatus);
router.get ('/query/:checkoutRequestId',  auth, querySTK);

// Public — called by Safaricom servers (no auth)
router.post('/callback', mpesaCallback);

module.exports = router;