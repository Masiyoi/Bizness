const pool = require('../config/db');
const cloudinary = require('../config/cloudinary'); // adjust to your actual config module
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB, videos need headroom
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(ok ? null : new Error('Only image or video files are allowed'), ok);
  },
});

function uploadToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bizna_member_updates', resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// GET /api/members/updates — public, active items only, for MembersClub.tsx
async function getPublicUpdates(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, media_url AS src, title, subtitle
       FROM member_updates WHERE is_active = true ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getPublicUpdates error:', err);
    res.status(500).json({ error: 'Could not load updates' });
  }
}

// GET /api/members/admin/updates — everything, for the admin panel
async function adminListUpdates(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM member_updates ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('adminListUpdates error:', err);
    res.status(500).json({ error: 'Could not load updates' });
  }
}

// POST /api/members/admin/updates  (multipart: file, title, subtitle?)
async function adminCreateUpdate(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Media file is required' });
    const { title, subtitle } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);

    const { rows: [{ next_order }] } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM member_updates`
    );

    const { rows: [item] } = await pool.query(
      `INSERT INTO member_updates (type, media_url, cloudinary_public_id, title, subtitle, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [resourceType, uploaded.secure_url, uploaded.public_id, title, subtitle || null, next_order]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error('adminCreateUpdate error:', err);
    res.status(500).json({ error: 'Could not upload update' });
  }
}

// PUT /api/members/admin/updates/:id  (title/subtitle/is_active, optional new file to replace media)
async function adminUpdateUpdate(req, res) {
  try {
    const { id } = req.params;
    const { title, subtitle, is_active } = req.body;

    const { rows: [existing] } = await pool.query('SELECT * FROM member_updates WHERE id = $1', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    let mediaUrl = existing.media_url;
    let publicId = existing.cloudinary_public_id;
    let type = existing.type;

    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);
      // best-effort cleanup of the old asset
      cloudinary.uploader.destroy(existing.cloudinary_public_id, { resource_type: existing.type }).catch(() => {});
      mediaUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
      type = resourceType;
    }

    const { rows: [item] } = await pool.query(
      `UPDATE member_updates SET
         title = COALESCE($1, title),
         subtitle = $2,
         is_active = COALESCE($3, is_active),
         media_url = $4, cloudinary_public_id = $5, type = $6
       WHERE id = $7 RETURNING *`,
      [title ?? existing.title, subtitle !== undefined ? subtitle : existing.subtitle,
       is_active !== undefined ? is_active === 'true' || is_active === true : existing.is_active,
       mediaUrl, publicId, type, id]
    );
    res.json(item);
  } catch (err) {
    console.error('adminUpdateUpdate error:', err);
    res.status(500).json({ error: 'Could not update' });
  }
}

// DELETE /api/members/admin/updates/:id
async function adminDeleteUpdate(req, res) {
  try {
    const { id } = req.params;
    const { rows: [item] } = await pool.query('DELETE FROM member_updates WHERE id = $1 RETURNING *', [id]);
    if (!item) return res.status(404).json({ error: 'Not found' });
    cloudinary.uploader.destroy(item.cloudinary_public_id, { resource_type: item.type }).catch(() => {});
    res.json({ deleted: true });
  } catch (err) {
    console.error('adminDeleteUpdate error:', err);
    res.status(500).json({ error: 'Could not delete' });
  }
}

// PUT /api/members/admin/updates/reorder  { order: [id1, id2, id3, ...] }
async function adminReorderUpdates(req, res) {
  const client = await pool.connect();
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
    await client.query('BEGIN');
    for (let i = 0; i < order.length; i++) {
      await client.query('UPDATE member_updates SET sort_order = $1 WHERE id = $2', [i, order[i]]);
    }
    await client.query('COMMIT');
    res.json({ reordered: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('adminReorderUpdates error:', err);
    res.status(500).json({ error: 'Could not reorder' });
  } finally {
    client.release();
  }
}

module.exports = {
  upload, getPublicUpdates, adminListUpdates,
  adminCreateUpdate, adminUpdateUpdate, adminDeleteUpdate, adminReorderUpdates,
};