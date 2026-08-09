const fs = require("fs");
const AUTH_PATH    = "Server/controllers/authController.js";
const MEMBERS_PATH = "Server/controllers/membersController.js";
// Files on disk use CRLF (\r\n). Our search/replace strings are written with
// plain \n. Convert \n -> \r\n in both oldStr and newStr before matching, so
// the multi-line blocks line up exactly with what's actually on disk.
function patch(path, oldStrRaw, newStrRaw, label) {
  const content = fs.readFileSync(path, "utf-8");
  const oldStr = oldStrRaw.replace(/\n/g, "\r\n");
  const newStr = newStrRaw.replace(/\n/g, "\r\n");
  if (!content.includes(oldStr)) {
    console.log(`✗ pattern not found: ${label}`);
    const firstLine = oldStrRaw.split("\n").find(l => l.trim().length > 0);
    const idx = content.indexOf(firstLine.trim());
    if (idx === -1) {
      console.log(`    anchor line also not found: ${JSON.stringify(firstLine)}`);
    } else {
      const actualLine = content.slice(idx, idx + firstLine.length + 40);
      console.log(`    anchor found, but context differs. Actual file text there:`);
      console.log(`    ${JSON.stringify(actualLine)}`);
    }
    return false;
  }
  fs.writeFileSync(path + ".bak", content, "utf-8");
  fs.writeFileSync(path, content.replace(oldStr, newStr), "utf-8");
  console.log(`[OK] ${label}`);
  return true;
}
// ── FIX 1: membersController.js — replace the whole getProfile function ─────
const oldGetProfile = `// GET /api/members/profile
async function getProfile(req, res) {
  const userId = req.user.id;
  try {
    const { rows: [member] } = await pool.query(
      'SELECT id, points, tier, club_joined, joined_at FROM members WHERE user_id = $1',
      [userId]
    );
    if (!member) return res.status(404).json({ error: 'Not a member' });
    const { rows: activities } = await pool.query(
      'SELECT id, description, points, created_at FROM member_activities WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20',
      [member.id]
    );
    res.json({
      points: member.points,
      tier: member.tier,
      club_joined: member.club_joined,
      joined_at: member.joined_at,
      activities,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Could not load profile' });
  }
}`;
const newGetProfile = `// GET /api/members/profile
async function getProfile(req, res) {
  const userId = req.user.id;
  try {
    const { rows: [member] } = await pool.query(
      \`SELECT m.id, m.points, m.tier, m.club_joined, m.joined_at, u.referral_code
       FROM members m
       JOIN users u ON u.id = m.user_id
       WHERE m.user_id = $1\`,
      [userId]
    );
    if (!member) return res.status(404).json({ error: 'Not a member' });
    const { rows: activities } = await pool.query(
      'SELECT id, description, points, created_at FROM member_activities WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20',
      [member.id]
    );
    res.json({
      points: member.points,
      tier: member.tier,
      club_joined: member.club_joined,
      joined_at: member.joined_at,
      referral_code: member.referral_code,
      activities,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Could not load profile' });
  }
}`;
patch(MEMBERS_PATH, oldGetProfile, newGetProfile, "membersController.js: getProfile returns referral_code");
// ── FIX 2a: authController.js — replace the whole verifyEmail function ──────
const oldVerifyEmail = `exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await db.query(
      \`SELECT * FROM users WHERE verification_token = $1 AND verification_token_expiry > NOW() AND is_verified = FALSE\`,
      [token]
    );
    if (!result.rows.length)
      return res.status(400).json({ msg: 'Verification link is invalid or has expired.' });
    await db.query(
      \`UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL WHERE id = $1\`,
      [result.rows[0].id]
    );
    return res.json({ msg: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};`;
const newVerifyEmail = `exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await db.query(
      \`SELECT * FROM users WHERE verification_token = $1 AND verification_token_expiry > NOW() AND is_verified = FALSE\`,
      [token]
    );
    if (!result.rows.length)
      return res.status(400).json({ msg: 'Verification link is invalid or has expired.' });
    await db.query(
      \`UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL WHERE id = $1\`,
      [result.rows[0].id]
    );
    // Create the members-club record + pay the signup bonus now that the
    // account is verified. Kept in its own try/catch so a points failure
    // never blocks email verification itself.
    try {
      await registerMember(result.rows[0].id);
    } catch (memberErr) {
      console.error('registerMember error (verifyEmail):', memberErr.message);
    }
    return res.json({ msg: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err.message);
    return res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};`;
patch(AUTH_PATH, oldVerifyEmail, newVerifyEmail, "authController.js: call registerMember in verifyEmail");
// ── FIX 2b: authController.js — patch the googleAuth "else" (new user) block ─
const oldGoogleElse = `    } else {
      const newUser = await db.query(
        \`INSERT INTO users (full_name, email, google_id, is_verified, profile_picture)
         VALUES ($1, $2, $3, TRUE, $4) RETURNING id, full_name, email, is_verified, role, profile_picture\`,
        [full_name, email.toLowerCase(), google_id, picture]
      );
      user = newUser.rows[0];
    }`;
const newGoogleElse = `    } else {
      const ownReferralCode = await generateReferralCode();
      const newUser = await db.query(
        \`INSERT INTO users (full_name, email, google_id, is_verified, profile_picture, referral_code)
         VALUES ($1, $2, $3, TRUE, $4, $5) RETURNING id, full_name, email, is_verified, role, profile_picture\`,
        [full_name, email.toLowerCase(), google_id, picture, ownReferralCode]
      );
      user = newUser.rows[0];
      try {
        await registerMember(user.id);
      } catch (memberErr) {
        console.error('registerMember error (googleAuth):', memberErr.message);
      }
    }`;
patch(AUTH_PATH, oldGoogleElse, newGoogleElse, "authController.js: call registerMember + generate referral_code in googleAuth");
console.log("\nDone.");
