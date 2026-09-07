const fs = require('fs');
let code = fs.readFileSync('src/app/components/EmployeeForm.tsx', 'utf8');

code = code.replace(
  "export default function EmployeeForm({ teamLeads }: { teamLeads: Employee[] }) {",
  "export default function EmployeeForm({ teamLeads, currentUserRole }: { teamLeads: Employee[], currentUserRole?: string }) {"
);

// We define available roles based on currentUserRole
const rolesLogic = `
  const availableRoles = currentUserRole === 'HR' 
    ? ['Sales Executive', 'Team Lead'] 
    : ['Sales Executive', 'Team Lead', 'HR', 'Manager'];
`;

code = code.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n" + rolesLogic
);

// We change the input type="text" to a select dropdown
const oldInput = `<input type="text" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" />`;

const newInput = `<select name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors">
                  <option value="" disabled>Select a role...</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>`;

code = code.replace(oldInput, newInput);

fs.writeFileSync('src/app/components/EmployeeForm.tsx', code);
console.log("Updated EmployeeForm.tsx");
