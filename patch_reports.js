const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

code = code.replace(
  "if (role !== 'Manager') {",
  "if (role !== 'Manager' && role !== 'HR') {"
);

fs.writeFileSync('src/app/reports/page.tsx', code);
console.log("Updated src/app/reports/page.tsx");
