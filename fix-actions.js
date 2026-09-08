const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');
code = code.replace(
  /async function getSessionUser\(\) \{[\s\S]*?\n\}/,
  `async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Unauthorized');
  return session.user as any;
}`
);
fs.writeFileSync('src/app/chatActions.ts', code);
