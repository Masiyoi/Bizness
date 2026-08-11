// src/controllers/usersController.js
//
// New controller — you don't have one yet. Handles the logged-in user's own
// profile: read/update contact details + birthday month, and change password
// while already signed in (separate from the email-link forgotPassword flow
// in authController.js).
//
// Requires these new columns (adjust types/lengths as you like):
//   ALTER TABLE users ADD COLUMN phone TEXT;
//   ALTER TABLE users ADD COLUMN address TEXT;
//   ALTER TABLE users ADD COLUMN city TEXT;
//   ALTER TABLE users ADD COLUMN country TEXT;
//   ALTER TABLE users ADD COLUMN birthday_month TEXT; -- 'January' … 'December', nullable

const db     = require('../config/db');
const bcrypt = require('bcryptjs');

const MAX_NAME_LENGTH = 100;
const VALID_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// GET /api/users/me
exports.getMe = async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows: [user] } = await db.query(
      `SELECT full_name, email, phone, address, city, country, birthday_month
       FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('getMe error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// PATCH /api/users/me
// Body: any subset of { full_name, phone, address, city, country, birthday_month }
// Email is intentionally NOT editable here — changing it would need its own
// re-verification flow (token + confirmation email), same as registration.
exports.updateMe = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, address, city, country, birthday_month } = req.body;

  if (full_name !== undefined && (!full_name.trim() || full_name.trim().length > MAX_NAME_LENGTH)) {
    return res.status(400).json({ msg: `Name must be under ${MAX_NAME_LENGTH} characters.` });
  }
  if (birthday_month !== undefined && birthday_month !== '' && !VALID_MONTHS.includes(birthday_month)) {
    return res.status(400).json({ msg: 'Invalid month.' });
  }

  // Build the update dynamically so a partial body (e.g. just birthday_month
  // from the Settings page) doesn't null out the other fields.
  const fields = { full_name, phone, address, city, country, birthday_month };
  const sets = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined) continue;
    sets.push(`${key} = $${i++}`);
    values.push(key === 'full_name' ? val.trim() : val);
  }
  if (!sets.length) return res.status(400).json({ msg: 'Nothing to update.' });
  values.push(userId);

  try {
    const { rows: [updated] } = await db.query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${i}
       RETURNING full_name, email, phone, address, city, country, birthday_month`,
      values
    );
    return res.json(updated);
  } catch (err) {
    console.error('updateMe error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// POST /api/users/me/change-password
// Body: { current_password, new_password }
// Verifies the current password server-side before allowing the change —
// same bcrypt.compare pattern as authController.loginUser.
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ msg: 'Current and new password are required.' });
  }
  if (new_password.length < 8 || new_password.length > 128) {
    return res.status(400).json({ msg: 'Password must be 8–128 characters.' });
  }
  if (!/[A-Z]/.test(new_password)) {
    return res.status(400).json({ msg: 'Password must contain at least one uppercase letter.' });
  }
  if (!/[0-9]/.test(new_password)) {
    return res.status(400).json({ msg: 'Password must contain at least one number.' });
  }

  try {
    const { rows: [user] } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.password_hash) {
      return res.status(400).json({ msg: 'This account uses Google Sign-In and has no password to change.' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(new_password, salt);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, userId]);

    return res.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};