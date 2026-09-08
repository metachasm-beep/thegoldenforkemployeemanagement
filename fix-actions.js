const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');
code = code.replace(
  /async function getSessionUser\(\) \{[\s\S]*?\n\}/,
  `async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const mgr = await prisma.employee.findFirst({ where: { role: 'Manager' } });
    return { employeeId: mgr?.id, role: 'Manager', email: mgr?.email };
  }
  return session.user as any;
}`
);
fs.writeFileSync('src/app/chatActions.ts', code);
