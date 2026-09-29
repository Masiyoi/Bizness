// routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pushController = require('../controllers/pushController');

router.post('/subscribe', auth, pushController.subscribe);
router.post('/unsubscribe', auth, pushController.unsubscribe);

module.exports = router;