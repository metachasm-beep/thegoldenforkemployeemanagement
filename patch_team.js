const fs = require('fs');
let code = fs.readFileSync('src/app/team/page.tsx', 'utf8');

code = code.replace(
  "if (role !== 'Manager' && role !== 'Team Lead') {",
  "if (role !== 'Manager' && role !== 'Team Lead' && role !== 'HR') {"
);

code = code.replace(
  "const isManager = role === 'Manager';",
  "const isManager = role === 'Manager' || role === 'HR';"
);

fs.writeFileSync('src/app/team/page.tsx', code);
console.log("Updated src/app/team/page.tsx");
