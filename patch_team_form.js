const fs = require('fs');
let code = fs.readFileSync('src/app/team/page.tsx', 'utf8');

code = code.replace(
  "<EmployeeForm teamLeads={allEmployees.filter(e => e.role === 'Team Lead')} />",
  "<EmployeeForm teamLeads={allEmployees.filter(e => e.role === 'Team Lead')} currentUserRole={role} />"
);

fs.writeFileSync('src/app/team/page.tsx', code);
console.log("Updated team page to pass currentUserRole");
