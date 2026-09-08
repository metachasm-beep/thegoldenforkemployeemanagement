const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

const regex = /export async function getMessages\([\s\S]*?orderBy: { createdAt: 'asc' }(?:, include: { sender: true, parent: { include: { sender: true } }, reactions: true })?\s*}\);/g;

code = code.replace(regex, `export async function getMessages(conversationId: string, overrideEmployeeId?: string) {
  const user = await getSessionUser();
  const isManager = user.role === 'Manager' || user.role === 'HR';
  const employeeId = (overrideEmployeeId && isManager) ? overrideEmployeeId : user.employeeId;

  const hasAccess = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId_employeeId: {
        conversationId,
        employeeId: (overrideEmployeeId && (user.role === 'Manager' || user.role === 'HR')) ? overrideEmployeeId : user.employeeId
      }
    }
  });

  if (!hasAccess) throw new Error('Unauthorized');

  return await prisma.message.findMany({
    where: { conversationId },
    include: { sender: true, parent: { include: { sender: true } }, reactions: true },
    orderBy: { createdAt: 'asc' }
  });`);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Fixed getMessages explicitly");
