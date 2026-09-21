const express = require('express');
const auth    = require('../middleware/auth');
const { getNotifications } = require('../controllers/notificationController');
const router = express.Router();
// GET /api/notifications
router.get('/', auth, getNotifications);
module.exports = router;