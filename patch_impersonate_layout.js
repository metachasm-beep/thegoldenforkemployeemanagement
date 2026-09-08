const fs = require('fs');

let page = fs.readFileSync('src/app/team/impersonate/[id]/page.tsx', 'utf8');

// Replace the first <DashboardLayout> (for not found)
page = page.replace(
  '<DashboardLayout>',
  '<DashboardLayout role="Employee">'
);

// Replace the second <DashboardLayout> (main content)
// We need to extract `emp` earlier.
page = page.replace(
  'const reports = generateSalaryReport(employees, leads, invoices);',
  'const emp = employees.find(e => e.id === id);\n  const reports = generateSalaryReport(employees, leads, invoices);'
);

page = page.replace(
  '<DashboardLayout>',
  '<DashboardLayout role={emp?.role || "Employee"}>'
);

page = page.replace(
  'const emp = employees.find(e => e.id === id);\n          if (!emp) return null;',
  'if (!emp) return null;'
);

fs.writeFileSync('src/app/team/impersonate/[id]/page.tsx', page);
console.log("Patched impersonate layout role");
