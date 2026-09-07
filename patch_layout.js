const fs = require('fs');
let code = fs.readFileSync('src/app/components/DashboardLayout.tsx', 'utf8');

code = code.replace(
  "const isManager = role === 'Manager';",
  "const isManager = role === 'Manager' || role === 'HR';"
);

code = code.replace(
  '<NavLink href="/leads/new" icon={Target} label="Log New Lead" />',
  '{role !== "HR" && <NavLink href="/leads/new" icon={Target} label="Log New Lead" />}'
);

fs.writeFileSync('src/app/components/DashboardLayout.tsx', code);
console.log("Updated DashboardLayout.tsx");
