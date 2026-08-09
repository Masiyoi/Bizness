const fs = require("fs");
const SERVER_PATH = "Server/index.js"; // adjust if your entry file has a different name/path
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
  SERVER_PATH,
  "const discountRoutes   = require('./routes/discountRoutes');",
  "const discountRoutes   = require('./routes/discountRoutes');\r\nconst membersRoutes     = require('./routes/membersRoutes');",
  "server.js: require membersRoutes"
);
patch(
  SERVER_PATH,
  "app.use('/api/discount',    discountRoutes);",
  "app.use('/api/discount',    discountRoutes);\r\napp.use('/api/members',     membersRoutes);",
  "server.js: mount membersRoutes at /api/members"
);
console.log("\nDone.");
