const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(
  'lastReadAt     DateTime     @default(now())\n  lastReadAt     DateTime     @default(now())',
  'lastReadAt     DateTime     @default(now())'
);

fs.writeFileSync('prisma/schema.prisma', code);
