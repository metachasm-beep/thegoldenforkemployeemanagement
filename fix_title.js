const fs = require('fs');
let code = fs.readFileSync('src/app/components/ManagerView.tsx', 'utf8');

code = code.replace('<h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-balance">Master Payroll Ledger</h2>', '');

fs.writeFileSync('src/app/components/ManagerView.tsx', code);
console.log("Removed duplicate title from ManagerView");
