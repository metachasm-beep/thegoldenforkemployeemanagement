const fs = require('fs');
let code = fs.readFileSync('src/app/components/ManagerView.tsx', 'utf8');

code = code.replace(
  "export default function ManagerView({ employees, leads, reports, auditLogs }: Props) {",
  "export default function ManagerView({ employees, leads, reports, auditLogs, isHR = false }: Props & { isHR?: boolean }) {"
);

const kanbanSection = `<section className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-balance">Active Pipeline</h2>
        <LeadsKanban leads={leads} employees={employees} isManager={true} />
      </section>`;

const newKanbanSection = `{!isHR && (
        <section className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-balance">Active Pipeline</h2>
          <LeadsKanban leads={leads} employees={employees} isManager={true} />
        </section>
      )}`;

code = code.replace(kanbanSection, newKanbanSection);

fs.writeFileSync('src/app/components/ManagerView.tsx', code);
console.log("Updated src/app/components/ManagerView.tsx");
