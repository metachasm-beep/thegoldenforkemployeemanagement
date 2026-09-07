const fs = require('fs');
let code = fs.readFileSync('src/app/team/impersonate/[id]/page.tsx', 'utf8');

code = code.replace(
  "if (!session || (session.user as any).role !== 'Manager') redirect('/');",
  "if (!session || ((session.user as any).role !== 'Manager' && (session.user as any).role !== 'HR')) redirect('/');"
);

fs.writeFileSync('src/app/team/impersonate/[id]/page.tsx', code);
console.log("Updated impersonate");
