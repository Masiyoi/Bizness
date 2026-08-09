const fs = require("fs");
const MEMBERS_PATH = "Server/controllers/membersController.js";
function patch(path, oldStr, newStr, label) {
  const content = fs.readFileSync(path, "utf-8");
  if (!content.includes(oldStr)) {
    console.log(`✗ pattern not found: ${label}`);
    return false;
  }
  fs.writeFileSync(path + ".bak", content, "utf-8");
  fs.writeFileSync(path, content.replace(oldStr, newStr), "utf-8");
  console.log(`[OK] ${label}`);
  return true;
}
// Insert a lifetime-earned query right after the 404 check
patch(
  MEMBERS_PATH,
  "if (!member) return res.status(404).json({ error: 'Not a member' });",
  "if (!member) return res.status(404).json({ error: 'Not a member' });\r\n\r\n    // Lifetime total ever earned — differs from member.points once you add\r\n    // a redemption/spend feature, since points can drop but this won't.\r\n    const { rows: [{ total_earned }] } = await pool.query(\r\n      'SELECT COALESCE(SUM(points), 0)::int AS total_earned FROM member_activities WHERE member_id = $1 AND points > 0',\r\n      [member.id]\r\n    );",
  "membersController.js: query lifetime total_earned"
);
// Include it in the response
patch(
  MEMBERS_PATH,
  "referral_code: member.referral_code,",
  "referral_code: member.referral_code,\r\n      total_points_earned: total_earned,",
  "membersController.js: include total_points_earned in response"
);
console.log("\nDone.");
