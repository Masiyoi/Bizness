const fs = require("fs");
const MEMBERS_PATH = "Server/controllers/membersController.js";
function patch(path, oldStr, newStr, label) {
  const content = fs.readFileSync(path, "utf-8");
  if (!content.includes(oldStr)) {
    console.log(`✗ pattern not found: ${label}`);
    console.log(`    looking for: ${JSON.stringify(oldStr)}`);
    return false;
  }
  fs.writeFileSync(path + ".bak2", content, "utf-8");
  fs.writeFileSync(path, content.replace(oldStr, newStr), "utf-8");
  console.log(`[OK] ${label}`);
  return true;
}
// ── Edit 1: swap the query string (single line, no newlines to mismatch) ────
const oldQueryLine = `'SELECT id, points, tier, club_joined, joined_at FROM members WHERE user_id = $1'`;
const newQueryLine = `\`SELECT m.id, m.points, m.tier, m.club_joined, m.joined_at, u.referral_code FROM members m JOIN users u ON u.id = m.user_id WHERE m.user_id = $1\``;
patch(MEMBERS_PATH, oldQueryLine, newQueryLine, "membersController.js: getProfile query includes referral_code");
// ── Edit 2: add referral_code to the res.json response (single-line anchor) ─
const oldJsonLine = `joined_at: member.joined_at,`;
const newJsonLine = `joined_at: member.joined_at,\r\n      referral_code: member.referral_code,`;
patch(MEMBERS_PATH, oldJsonLine, newJsonLine, "membersController.js: res.json includes referral_code");
console.log("\nDone.");
