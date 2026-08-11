// src/routes/usersRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.get('/me',                  auth, usersController.getMe);
router.patch('/me',                auth, usersController.updateMe);
router.post('/me/change-password', auth, usersController.changePassword);

module.exports = router;