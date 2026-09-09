const fs = require("fs");
let c = fs.readFileSync("src/app/chatActions.ts", "utf8");

const newFuncs = `
export async function markAsDelivered(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { lastDeliveredAt: new Date() }
  });
  
  await pusherServer.trigger(\`private-conversation-\${conversationId}\`, "delivery-receipt", {
    employeeId: user.employeeId,
    lastDeliveredAt: new Date().toISOString()
  });
}

export async function editMessage(messageId: string, newContent: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  
  if (!msg || msg.senderId !== user.employeeId) throw new Error("Unauthorized");
  
  const history = msg.editHistory ? (Array.isArray(msg.editHistory) ? msg.editHistory : []) : [];
  history.push({ content: msg.content, editedAt: new Date().toISOString() });
  
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, isEdited: true, editHistory: history },
    include: { sender: true }
  });
  
  await pusherServer.trigger(\`private-conversation-\${msg.conversationId}\`, "message-updated", updated);
  return updated;
}

export async function deleteMessage(messageId: string) {
  const user = await getSessionUser();
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  
  if (!msg || msg.senderId !== user.employeeId) throw new Error("Unauthorized");
  
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: "🚫 This message was deleted" },
    include: { sender: true }
  });
  
  await pusherServer.trigger(\`private-conversation-\${msg.conversationId}\`, "message-updated", updated);
  return updated;
}

export async function togglePinConversation(conversationId: string, isPinned: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isPinned }
  });
}

export async function toggleArchiveConversation(conversationId: string, isArchived: boolean) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { isArchived }
  });
}

export async function toggleStarMessage(messageId: string) {
  const user = await getSessionUser();
  const existing = await prisma.starredMessage.findUnique({
    where: { employeeId_messageId: { employeeId: user.employeeId, messageId } }
  });
  
  if (existing) {
    await prisma.starredMessage.delete({ where: { id: existing.id } });
    return false;
  } else {
    await prisma.starredMessage.create({
      data: { employeeId: user.employeeId, messageId }
    });
    return true;
  }
}

export async function getStarredMessages() {
  const user = await getSessionUser();
  return prisma.starredMessage.findMany({
    where: { employeeId: user.employeeId },
    include: { message: { include: { sender: true, conversation: true } } },
    orderBy: { createdAt: "desc" }
  });
}
`;

fs.writeFileSync("src/app/chatActions.ts", c + newFuncs);

