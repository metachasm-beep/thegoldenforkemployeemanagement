const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  "const isManager = role === 'Manager';",
  "const isManager = role === 'Manager' || role === 'HR';\n  const isHR = role === 'HR';"
);

code = code.replace(
  "<ManagerView employees={employees} leads={leads} reports={reports} auditLogs={auditLogs} />",
  "<ManagerView employees={employees} leads={leads} reports={reports} auditLogs={auditLogs} isHR={isHR} />"
);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated src/app/page.tsx");
