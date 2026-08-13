// src/routes/usersRoutes.js
//
// Routes for logged-in user profile management: read/update profile details,
// change password while signed in. All routes require authentication.

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const multer  = require('multer');
const usersController  = require('../controllers/usersController');
const avatarController = require('../controllers/avatarController');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

// All routes require auth middleware
router.get('/me',                  auth, usersController.getMe);
router.patch('/me',                auth, usersController.updateMe);
router.post('/me/change-password', auth, usersController.changePassword);

// Profile avatar — upload an image (Cloudinary) or set a solid color
router.put('/avatar/upload', auth, avatarUpload.single('avatar'), avatarController.uploadAvatarImage);
router.put('/avatar/color',  auth, avatarController.setAvatarColor);
router.delete('/avatar',     auth, avatarController.resetAvatar);

module.exports = router;