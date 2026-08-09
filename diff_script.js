const fs = require("fs");
const MEMBERS_PATH = "Server/controllers/membersController.js";
const content = fs.readFileSync(MEMBERS_PATH, "utf-8");
const marker = "// GET /api/members/profile";
const idx = content.indexOf(marker);
if (idx === -1) {
  console.log("Marker not found at all — something bigger is off.");
  process.exit(1);
}
const expectedRaw = `// GET /api/members/profile
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
const expected = expectedRaw.replace(/\n/g, "\r\n");
const actual = content.slice(idx, idx + expected.length);
if (actual === expected) {
  console.log("They match exactly?! Re-run the patch script, this was a fluke.");
  process.exit(0);
}
console.log(`Lengths — expected: ${expected.length}, actual: ${actual.length}`);
let diffAt = -1;
for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
  if (expected[i] !== actual[i]) { diffAt = i; break; }
}
console.log(`First difference at character offset ${diffAt}`);
console.log("Expected around that point:", JSON.stringify(expected.slice(Math.max(0, diffAt - 30), diffAt + 30)));
console.log("Actual around that point:  ", JSON.stringify(actual.slice(Math.max(0, diffAt - 30), diffAt + 30)));
