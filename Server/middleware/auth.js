const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Accept token from Authorization header OR cookie
  const token =
    req.cookies?.token ||
    req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ msg: 'No token — authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is invalid or expired.' });
  }
};