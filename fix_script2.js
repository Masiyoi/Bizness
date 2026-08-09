const fs = require("fs");
const MEMBERS_PATH = "Server/controllers/membersController.js";
function patch(path, oldStrRaw, newStrRaw, label) {
  const content = fs.readFileSync(path, "utf-8");
  const oldStr = oldStrRaw.replace(/\n/g, "\r\n");
  const newStr = newStrRaw.replace(/\n/g, "\r\n");
  if (!content.includes(oldStr)) {
    console.log(`✗ pattern not found: ${label}`);
    return false;
  }
  fs.writeFileSync(path + ".bak", content, "utf-8");
  fs.writeFileSync(path, content.replace(oldStr, newStr), "utf-8");
  console.log(`[OK] ${label}`);
  return true;
}
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
console.log("\nDone.");
