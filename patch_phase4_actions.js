const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

const newActions = `
export async function markAsRead(conversationId: string) {
  const user = await getSessionUser();
  
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { lastReadAt: new Date() }
  });
  
  // Optionally broadcast read receipt
  await pusherServer.trigger(\`private-conversation-\${conversationId}\`, 'read-receipt', {
    employeeId: user.employeeId,
    lastReadAt: new Date().toISOString()
  });
}

export async function toggleReaction(messageId: string, emoji: string) {
  const user = await getSessionUser();
  const existing = await prisma.reaction.findUnique({
    where: { messageId_employeeId_emoji: { messageId, employeeId: user.employeeId, emoji } }
  });
  
  let reaction;
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    reaction = await prisma.reaction.create({
      data: { messageId, employeeId: user.employeeId, emoji }
    });
  }

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (msg) {
    await pusherServer.trigger(\`private-conversation-\${msg.conversationId}\`, 'reaction-update', {
      messageId,
      employeeId: user.employeeId,
      emoji,
      added: !existing
    });
  }
}

export async function searchMessages(query: string) {
  if (!query || query.length < 2) return [];
  const user = await getSessionUser();
  
  // Find messages where user is a participant of the conversation
  const messages = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      conversation: {
        participants: { some: { employeeId: user.employeeId } }
      }
    },
    include: { sender: true, conversation: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  return messages;
}
`;

code += newActions;

// We also need to modify getMessages to include parent messages (for inline replies) and reactions
code = code.replace(
  'orderBy: { createdAt: \'asc\' }',
  'orderBy: { createdAt: \'asc\' }, include: { sender: true, parent: { include: { sender: true } }, reactions: true }'
);
// And getConversations to include participants' lastReadAt
code = code.replace(
  'participants: { include: { employee: true } },',
  'participants: { include: { employee: true } },'
);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Patched chatActions with Phase 4 mechanics.");
