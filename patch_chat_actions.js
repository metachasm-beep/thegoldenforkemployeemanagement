const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

// 1. Add anti-collusion in getOrCreateDirectConversation
const getOrCreateStr = `export async function getOrCreateDirectConversation(otherEmployeeId: string) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;`;

const newValidation = `
  const [me, them] = await Promise.all([
    prisma.employee.findUnique({ where: { id: currentEmployeeId } }),
    prisma.employee.findUnique({ where: { id: otherEmployeeId } })
  ]);
  
  if (!me || !them) throw new Error('Employee not found');
  
  if (me.role === 'Sales Executive' && them.role === 'Sales Executive') {
    throw new Error('Sales Executives cannot direct message each other.');
  }
`;

code = code.replace(getOrCreateStr, getOrCreateStr + newValidation);

// 2. Add syncGlobalChannels function at the end
const syncFn = `
export async function syncGlobalChannels() {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  if (!emp) return;

  const channels = [
    { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
    { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
    { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
  ];

  for (const ch of channels) {
    const hasRole = ch.roles.includes(emp.role);
    
    // Find or create channel
    let convo = await prisma.conversation.findFirst({
      where: { name: ch.name, type: 'GROUP' }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          name: ch.name,
          type: 'GROUP',
          isReadOnly: ch.isReadOnly,
          restrictedTo: ch.roles
        }
      });
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });

    if (hasRole && !isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convo.id, employeeId: emp.id }
      });
    } else if (!hasRole && isParticipant) {
      await prisma.conversationParticipant.delete({
        where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
      });
    }
  }
}
`;

code += syncFn;

// 3. Prevent non-managers from writing to readOnly channels
const sendMsgStr = `export async function sendMessage(conversationId: string, content: string) {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;`;

const checkReadOnly = `
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  
  if (convo?.isReadOnly && emp?.role !== 'Manager' && emp?.role !== 'HR') {
    throw new Error('This channel is read-only.');
  }
`;

code = code.replace(sendMsgStr, sendMsgStr + checkReadOnly);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Updated chatActions with Anti-Collusion, RBAC, and Auto-Provisioning.");
