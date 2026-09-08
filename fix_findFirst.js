const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

code = code.replace(
  'const hasAccess = await prisma.conversationParticipant.findFirst({',
  'const hasAccess = await prisma.conversationParticipant.findUnique({'
);

fs.writeFileSync('src/app/chatActions.ts', code);
