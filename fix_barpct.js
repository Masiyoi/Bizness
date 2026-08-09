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
patch(
  MC_PATH,
  "width: ${barPct}%,",
  "width: `${barPct}%`,",
  "MembersClub.tsx: wrap barPct width in backticks"
);
console.log("\nDone.");
