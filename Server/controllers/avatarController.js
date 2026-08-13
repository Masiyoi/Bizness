const db          = require('../config/db');
const cloudinary  = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const uploadAvatarToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bizna_avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const RETURN_COLS = `id, full_name, email, role, is_verified, profile_picture, avatar_type, avatar_color`;

// PUT /api/users/avatar/upload  (multipart, field name "avatar")
exports.uploadAvatarImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No image file provided.' });

    const result = await uploadAvatarToCloudinary(req.file.buffer);

    const { rows } = await db.query(
      `UPDATE users
       SET profile_picture = $1, avatar_type = 'image', avatar_color = NULL, updated_at = NOW()
       WHERE id = $2
       RETURNING ${RETURN_COLS}`,
      [result.secure_url, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('uploadAvatarImage error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// PUT /api/users/avatar/color   body: { color: '#RRGGBB' }
exports.setAvatarColor = async (req, res) => {
  try {
    const { color } = req.body;
    if (!color || !HEX_COLOR_RE.test(color))
      return res.status(400).json({ msg: 'Valid hex color required, e.g. #111111.' });

    const { rows } = await db.query(
      `UPDATE users
       SET avatar_color = $1, avatar_type = 'color', updated_at = NOW()
       WHERE id = $2
       RETURNING ${RETURN_COLS}`,
      [color, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('setAvatarColor error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// DELETE /api/users/avatar — reset to initials.
// NOTE: this also clears profile_picture, so for Google-signup users it
// wipes their original Google photo too, not just an uploaded one. Fine as
// a deliberate "reset" action, just flagging the tradeoff.
exports.resetAvatar = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users
       SET avatar_type = 'initials', avatar_color = NULL, profile_picture = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING ${RETURN_COLS}`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('resetAvatar error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};
