const fs = require('fs');
let code = fs.readFileSync('src/app/components/ManagerDashboard.tsx', 'utf8');

code = code.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">', '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">');

fs.writeFileSync('src/app/components/ManagerDashboard.tsx', code);
console.log("Patched ManagerDashboard grid");
