const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

// Find the start and end of syncGlobalChannels
const startIdx = code.indexOf('export async function syncGlobalChannels() {');
const endIdx = code.indexOf('export async function sendMessage', startIdx);

const newSyncFn = `export async function syncGlobalChannels() {
  const user = await getSessionUser();
  const currentEmployeeId = user.employeeId;
  const emp = await prisma.employee.findUnique({ where: { id: currentEmployeeId } });
  if (!emp) return;

  // 1. Sync Global RBAC Channels
  const channels = [
    { name: '#company-announcements', isReadOnly: true, roles: ['Manager', 'HR', 'Team Lead', 'Sales Executive'] },
    { name: '#hr-private', isReadOnly: false, roles: ['HR'] },
    { name: '#leadership-strategy', isReadOnly: false, roles: ['Manager', 'Team Lead'] }
  ];

  for (const ch of channels) {
    const hasRole = ch.roles.includes(emp.role);
    
    let convo = await prisma.conversation.findFirst({
      where: { name: ch.name, type: 'GROUP' }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: ch.name, type: 'GROUP', isReadOnly: ch.isReadOnly, restrictedTo: ch.roles }
      });
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });

    if (hasRole && !isParticipant) {
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: emp.id } });
    } else if (!hasRole && isParticipant) {
      await prisma.conversationParticipant.delete({ where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } } });
    }
  }

  // 2. Sync Hierarchical Team Group
  const ensureTeamGroup = async (managerEmp: any) => {
    const teamName = \`Team \${managerEmp.name}\`;
    let convo = await prisma.conversation.findFirst({
      where: { name: teamName, type: 'GROUP' }
    });
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { name: teamName, type: 'GROUP', isReadOnly: false }
      });
      // Add the manager to their own team
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: managerEmp.id } });
    }
    
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } }
    });
    
    const shouldBeInTeam = emp.id === managerEmp.id || emp.managerId === managerEmp.id;
    
    if (shouldBeInTeam && !isParticipant) {
      await prisma.conversationParticipant.create({ data: { conversationId: convo.id, employeeId: emp.id } });
    } else if (!shouldBeInTeam && isParticipant) {
      await prisma.conversationParticipant.delete({ where: { conversationId_employeeId: { conversationId: convo.id, employeeId: emp.id } } });
    }
  };

  if (emp.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: emp.managerId } });
    if (manager) await ensureTeamGroup(manager);
  }
  if (emp.role === 'Manager' || emp.role === 'Team Lead') {
    await ensureTeamGroup(emp);
  }
}

`;

code = code.substring(0, startIdx) + newSyncFn + code.substring(endIdx);
fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Fixed syncGlobalChannels syntax.");
