const fs = require('fs');
let code = fs.readFileSync('src/app/components/LeadsKanban.tsx', 'utf8');

// Replace transition-all with transition-colors and remove rotate-2
code = code.replace(
  'shadow-sm border transition-all mb-3',
  'shadow-sm border transition-colors mb-3'
);
code = code.replace(
  'shadow-xl border-blue-300 dark:border-blue-700 rotate-2 cursor-grabbing z-50',
  'shadow-xl border-blue-300 dark:border-blue-700 cursor-grabbing z-50'
);

fs.writeFileSync('src/app/components/LeadsKanban.tsx', code);
console.log("Patched Draggable classes");
