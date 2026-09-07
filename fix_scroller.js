const fs = require('fs');

// 1. Update AnimatedList.tsx
let animatedCode = fs.readFileSync('src/components/react-bits/AnimatedList/AnimatedList.tsx', 'utf8');
animatedCode = animatedCode.replace(
  'className={`max-h-[400px] overflow-y-auto p-4 ${',
  'className={`h-full overflow-y-auto p-4 pb-12 ${'
);
fs.writeFileSync('src/components/react-bits/AnimatedList/AnimatedList.tsx', animatedCode);
console.log("Updated AnimatedList.tsx");

// 2. Update AuditLogsWidget.tsx
let auditCode = fs.readFileSync('src/app/components/AuditLogsWidget.tsx', 'utf8');
auditCode = auditCode.replace(
  '<div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10">',
  '<div className="flex-1 min-h-0 -mx-4">'
);
auditCode = auditCode.replace(
  'className="w-full"',
  'className="w-full h-full"'
);
fs.writeFileSync('src/app/components/AuditLogsWidget.tsx', auditCode);
console.log("Updated AuditLogsWidget.tsx");
