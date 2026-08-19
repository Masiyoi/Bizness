const express      = require('express');
const multer       = require('multer');
const cloudinary   = require('cloudinary').v2;
const streamifier  = require('streamifier');
const auth         = require('../middleware/auth'); // adjust to your actual auth middleware
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadReviewImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bizna_review_media', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
const uploadReviewVideo = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bizna_review_media_video', resource_type: 'video' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
router.post('/upload-media', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file provided' });
    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) return res.status(400).json({ msg: 'Only images and videos are allowed' });
    const result = isImage
      ? await uploadReviewImage(req.file.buffer)
      : await uploadReviewVideo(req.file.buffer);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      media_type: isImage ? 'image' : 'video',
    });
  } catch (err) {
    console.error('upload-media error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});
module.exports = router;