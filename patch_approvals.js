const fs = require('fs');
let code = fs.readFileSync('src/app/approvals/page.tsx', 'utf8');

code = code.replace(
  "if (role !== 'Manager' && role !== 'Team Lead') {",
  "if (role !== 'Manager' && role !== 'Team Lead' && role !== 'HR') {"
);
code = code.replace(
  "const isManager = role === 'Manager';",
  "const isManager = role === 'Manager' || role === 'HR';"
);

// We must also hide leads from HR
const pendingLeadsOld = `const pendingLeads = leads.filter(l => 
    l.status === 'Pending Verification' && (isManager || assignedEmployeeIds.includes(l.employeeId))
  );`;

const pendingLeadsNew = `const pendingLeads = role === 'HR' ? [] : leads.filter(l => 
    l.status === 'Pending Verification' && (isManager || assignedEmployeeIds.includes(l.employeeId))
  );`;

code = code.replace(pendingLeadsOld, pendingLeadsNew);

fs.writeFileSync('src/app/approvals/page.tsx', code);
console.log("Updated src/app/approvals/page.tsx");
