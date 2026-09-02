const fs = require('fs');
let code = fs.readFileSync('src/app/components/EditEmployeeModal.tsx', 'utf8');

code = code.replace(/baseSalary: employee.baseSalary.toString\(\),/g, "baseSalary: employee.baseSalary.toString(),\n    probationSalary: employee.probationSalary?.toString() || '15000',");

const newInputs = `<div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Salary</label>
                <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Probation Salary</label>
                <input type="number" name="probationSalary" value={formData.probationSalary} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>`;

code = code.replace(/<div>\s*<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Salary<\/label>\s*<input type="number" name="baseSalary" value={formData.baseSalary}.*?<\/div>/, newInputs);

fs.writeFileSync('src/app/components/EditEmployeeModal.tsx', code);
