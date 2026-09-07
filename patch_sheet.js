const fs = require('fs');
let code = fs.readFileSync('src/app/components/AuditLogsWidget.tsx', 'utf8');

code = code.replace(
  'className="fixed top-0 right-0 h-screen sm:h-screen w-full sm:max-w-xl p-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden z-[50]"',
  'className="fixed inset-y-0 right-0 h-[100dvh] max-h-[100dvh] w-full sm:max-w-xl p-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden z-[50]"'
);

fs.writeFileSync('src/app/components/AuditLogsWidget.tsx', code);
console.log("Patched SheetContent classes 2");
