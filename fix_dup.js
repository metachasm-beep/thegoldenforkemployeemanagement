const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

code = code.replace(
  "    include: { sender: true, parent: { include: { sender: true } }, reactions: true },\n    orderBy: { createdAt: 'asc' }, include: { sender: true, parent: { include: { sender: true } }, reactions: true }",
  "    include: { sender: true, parent: { include: { sender: true } }, reactions: true },\n    orderBy: { createdAt: 'asc' }"
);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Fixed duplicate property in getMessages");
