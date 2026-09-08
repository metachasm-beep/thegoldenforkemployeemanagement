const fs = require('fs');

let page = fs.readFileSync('src/app/team/impersonate/[id]/page.tsx', 'utf8');
page = page.replace(
  "if (!session || ((session.user as any).role !== 'Manager' && (session.user as any).role !== 'HR')) redirect('/');",
  "if (!session || (session.user as any).role !== 'Manager') redirect('/');"
);
fs.writeFileSync('src/app/team/impersonate/[id]/page.tsx', page);
console.log("Patched impersonate backend");
