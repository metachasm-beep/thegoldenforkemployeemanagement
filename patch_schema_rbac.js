const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Modify Conversation
code = code.replace(
  'type         String     @default("DIRECT") // DIRECT or GROUP',
  'type         String     @default("DIRECT") // DIRECT or GROUP\n  isReadOnly   Boolean    @default(false)\n  restrictedTo String[]   @default([])'
);

fs.writeFileSync('prisma/schema.prisma', code);
console.log("Updated schema.prisma with RBAC fields for Conversation");
