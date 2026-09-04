const fs = require('fs');
let code = fs.readFileSync('src/app/components/LeadsKanban.tsx', 'utf8');

// Replace space-y-3 with just standard classes
code = code.replace(
  'className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4"',
  'className="flex-1 overflow-y-auto pr-1 pb-4"'
);

// Add mb-3 to the Draggable div
code = code.replace(
  /} \${isCompact ? 'p-3' : 'p-4'}\`}/g,
  '} ${isCompact ? \'p-3\' : \'p-4\'} mb-3`}'
);

fs.writeFileSync('src/app/components/LeadsKanban.tsx', code);
console.log("Patched LeadsKanban");
