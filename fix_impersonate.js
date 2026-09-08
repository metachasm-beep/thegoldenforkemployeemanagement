const fs = require('fs');
let code = fs.readFileSync('src/app/team/impersonate/[id]/page.tsx', 'utf8');

code = code.replace(
  "import EmployeeDashboard from '@/app/components/EmployeeDashboard';",
  "import EmployeeView from '@/app/components/EmployeeView';"
);

code = code.replace(
  "<EmployeeDashboard report={myReport} settings={settings} />",
  "<EmployeeView loggedInEmployeeId={id} employees={employees} leads={leads} reports={reports} settings={settings} />"
);

fs.writeFileSync('src/app/team/impersonate/[id]/page.tsx', code);
console.log("Updated impersonate page");
