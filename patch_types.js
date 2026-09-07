const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace(
  "export type EmployeeRole = 'Manager' | 'Team Lead' | 'Sales Executive';",
  "export type EmployeeRole = 'Manager' | 'Team Lead' | 'Sales Executive' | 'HR';"
);
fs.writeFileSync('src/types/index.ts', code);
console.log("Updated src/types/index.ts");
