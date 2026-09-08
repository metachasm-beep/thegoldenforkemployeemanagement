const fs = require('fs');
let code = fs.readFileSync('src/app/team/impersonate/[id]/page.tsx', 'utf8');

const regex = /<EmployeeView[\s\S]*?\/>/;

const newLogic = `
        {(() => {
          const emp = employees.find(e => e.id === id);
          if (!emp) return null;
          
          const isManagerRole = emp.role === 'Manager' || emp.role === 'HR';
          const isHRRole = emp.role === 'HR';

          if (isManagerRole) {
            return <ManagerView employees={employees} leads={leads} reports={reports} auditLogs={auditLogs} isHR={isHRRole} />;
          } else {
            return (
              <EmployeeView 
                loggedInEmployeeId={id} 
                employees={employees} 
                leads={leads} 
                reports={reports} 
                settings={settings} 
              />
            );
          }
        })()}
`;

code = code.replace(regex, newLogic);
code = code.replace("import EmployeeView from '@/app/components/EmployeeView';", "import EmployeeView from '@/app/components/EmployeeView';\nimport ManagerView from '@/app/components/ManagerView';\nimport { prisma } from '@/lib/prisma';");

code = code.replace(
  "const [employees, leads, settings] = await Promise.all([",
  "const [employees, leads, settings, auditLogs, invoices] = await Promise.all([\n    getEmployees(),\n    getLeads(),\n    getSystemSettings(),\n    prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 20 }),\n    prisma.invoice.findMany()\n  ]);\n\n  // "
);

// We should remove the old Promise.all
code = code.replace(
  /const \[employees, leads, settings\] = await Promise\.all\(\[\n\s*getEmployees\(\),\n\s*getLeads\(\),\n\s*getSystemSettings\(\),\n\s*\]\);/,
  ""
);

fs.writeFileSync('src/app/team/impersonate/[id]/page.tsx', code);
console.log("Fixed impersonate page to support all roles");
