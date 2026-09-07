const fs = require('fs');
let code = fs.readFileSync('src/app/leads/new/page.tsx', 'utf8');

code = code.replace(
  "const loggedInEmployeeId = (session.user as any).employeeId;",
  "const loggedInEmployeeId = (session.user as any).employeeId;\n  if (role === 'HR') redirect('/');"
);

fs.writeFileSync('src/app/leads/new/page.tsx', code);
console.log("Updated /leads/new/page.tsx");
