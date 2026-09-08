const fs = require('fs');
let code = fs.readFileSync('src/app/approvals/page.tsx', 'utf8');

code = code.replace(
  'variant="outline" className="py.1.5 px.3 text-xs"',
  'className="py-1.5 px-3 text-xs"' // Actually, I'll just remove variant="outline" using regex
);

code = code.replace(
  /variant="outline"/g,
  ''
);

fs.writeFileSync('src/app/approvals/page.tsx', code);
console.log("Fixed variant");
