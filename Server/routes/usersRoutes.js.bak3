// src/routes/usersRoutes.js
//
// Routes for logged-in user profile management: read/update profile details,
// change password while signed in. All routes require authentication.

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const usersController = require('../controllers/usersController');

// All routes require auth middleware
router.get('/me',                  auth, usersController.getMe);
router.patch('/me',                auth, usersController.updateMe);
router.post('/me/change-password', auth, usersController.changePassword);

module.exports = router;