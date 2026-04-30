const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  stkPush,
  mpesaCallback,
  getPaymentStatus,
  querySTK,
} = require('../controllers/paymentController');
const {
  initiatePayment,
  pesapalIPN,
  getPesapalStatus,
} = require('../controllers/pesapalController');

// Protected — user must be logged in
router.post('/stk-push',          auth, stkPush);
router.get ('/status/:checkoutRequestId', auth, getPaymentStatus);
router.get ('/query/:checkoutRequestId',  auth, querySTK);

// Public — called by Safaricom servers (no auth)
router.post('/callback', mpesaCallback);

// Protected — user must be logged in
router.post('/pesapal/initiate',                  auth, initiatePayment);
router.get ('/pesapal/status/:orderTrackingId',   auth, getPesapalStatus);
 
// Public — called by Pesapal servers (no auth)
router.post('/pesapal/ipn', pesapalIPN);

module.exports = router;