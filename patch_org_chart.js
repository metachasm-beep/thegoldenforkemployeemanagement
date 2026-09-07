const fs = require('fs');
let code = fs.readFileSync('src/app/team/org-chart/page.tsx', 'utf8');

code = code.replace(
  "if (role !== 'Manager' && role !== 'Team Lead') {",
  "if (role !== 'Manager' && role !== 'Team Lead' && role !== 'HR') {"
);

fs.writeFileSync('src/app/team/org-chart/page.tsx', code);
console.log("Updated src/app/team/org-chart/page.tsx");
