const jwt = require('jsonwebtoken');
const db  = require('../config/db');

module.exports = async (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers['authorization']?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ msg: 'No token — authorization denied.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch fresh user with role from DB
    const result = await db.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ msg: 'User not found.' });
    req.user = result.rows[0]; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is invalid or expired.' });
  }
};