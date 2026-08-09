const fs = require("fs");
const content = fs.readFileSync("frontend/src/pages/MembersClub.tsx", "utf-8");
const lines = content.split(/\r\n|\n/);
console.log(JSON.stringify(lines[398])); // line 399 (0-indexed)
console.log(JSON.stringify(lines[399])); // line 400
console.log(JSON.stringify(lines[400])); // line 401
console.log(JSON.stringify(lines[401])); // line 402
