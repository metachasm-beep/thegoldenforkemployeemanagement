const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

// 1. Add System Bot utilities
const botLogic = `
export async function getSystemBot() {
  let bot = await prisma.employee.findFirst({ where: { role: 'System Bot' } });
  if (!bot) {
    bot = await prisma.employee.create({
      data: {
        name: 'Golden Fork Bot',
        email: 'bot@goldenfork.com',
        role: 'System Bot',
        baseSalary: 0,
        target: 0,
        avatarUrl: 'https://ui-avatars.com/api/?name=GF&background=F59E0B&color=fff',
      }
    });
  }
  return bot;
}

export async function sendSystemNotification(employeeId: string, content: string) {
  try {
    const bot = await getSystemBot();
    
    // Find or create direct convo between bot and employee
    let convo = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { employeeId: bot.id } } },
          { participants: { some: { employeeId: employeeId } } }
        ]
      }
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { employeeId: bot.id },
              { employeeId: employeeId }
            ]
          }
        }
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        conversationId: convo.id,
        senderId: bot.id,
      },
      include: { sender: true }
    });

    await pusherServer.trigger(\`private-conversation-\${convo.id}\`, 'new-message', message);
    return true;
  } catch (error) {
    console.error('Failed to send system notification:', error);
    return false;
  }
}
`;

code += botLogic;

// 2. Update syncGlobalChannels to include hierarchical groups
code = code.replace(
  'for (const ch of channels) {',
  `// Team Hierarchical Group Logic
  if (emp.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: emp.managerId } });
    if (manager) {
      channels.push({
        name: \`Team \${manager.name}\`,
        isReadOnly: false,
        roles: ['Manager', 'Team Lead', 'Sales Executive', 'HR'] // Anyone assigned to this manager belongs here
      });
    }
  }
  
  if (emp.role === 'Manager' || emp.role === 'Team Lead') {
    channels.push({
      name: \`Team \${emp.name}\`,
      isReadOnly: false,
      roles: ['Manager', 'Team Lead'] // Ensure they themselves are in their own team chat
    });
  }
  
  for (const ch of channels) {`
);

// We need to modify the membership logic for team chats.
// The array \`roles: ['Manager']\` was used for global RBAC. For Team chats, it's specific to the user's managerId.
// Let's do a smarter replace.
