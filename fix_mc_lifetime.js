const fs = require("fs");
const MC_PATH = "frontend/src/pages/MembersClub.tsx";
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
// Add the field to the TS interface
patch(
  MC_PATH,
  "  joined_at:     string;",
  "  joined_at:     string;\r\n  total_points_earned: number;",
  "MembersClub.tsx: add total_points_earned to MemberProfile interface"
);
// Display it under "Member since", in the points hero card
patch(
  MC_PATH,
  "              Member since {fmtDate(profile.joined_at)}",
  "              Member since {fmtDate(profile.joined_at)}\r\n            </p>\r\n            <p style={{ fontFamily: \"'Jost', sans-serif\", fontSize: 11, color: '#bbb', marginTop: 6, letterSpacing: '1px' }}>\r\n              {(profile.total_points_earned ?? profile.points).toLocaleString()} points earned all-time",
  "MembersClub.tsx: display total_points_earned"
);
console.log("\nDone.");
