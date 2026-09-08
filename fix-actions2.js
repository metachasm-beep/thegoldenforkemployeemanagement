const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');
code = code.replace(
  `if (me.role === 'Sales Executive' && them.role === 'Sales Executive') {
    throw new Error('Sales Executives cannot direct message each other.');
  }`,
  `if (me.role === 'Sales Executive' && them.role !== 'HR' && them.role !== 'System Bot') {
    throw new Error('Sales Executives can only message HR.');
  }

  if (me.role === 'Manager' && them.role !== 'HR' && them.role !== 'System Bot') {
    throw new Error('Managers can only message HR.');
  }`
);
fs.writeFileSync('src/app/chatActions.ts', code);
