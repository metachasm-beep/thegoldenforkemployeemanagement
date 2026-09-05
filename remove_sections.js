const fs = require('fs');
let code = fs.readFileSync('src/app/components/ManagerView.tsx', 'utf8');

const targetSection = `      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeeForm teamLeads={teamLeads} />

        <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-balance">Log a New Lead</h2>
          <LeadForm employees={employees} />
        </section>
      </div>`;

if (code.includes(targetSection)) {
  code = code.replace(targetSection, '');
  
  // also remove the imports to clean it up
  code = code.replace(`import EmployeeForm from './EmployeeForm';\n`, '');
  code = code.replace(`import LeadForm from './LeadForm';\n`, '');
  
  fs.writeFileSync('src/app/components/ManagerView.tsx', code);
  console.log("Patched ManagerView.tsx");
} else {
  console.log("Could not find the target section.");
}
