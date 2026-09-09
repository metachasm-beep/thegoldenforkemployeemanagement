const fs = require("fs");
let c = fs.readFileSync("src/app/chatActions.ts", "utf8");

const newAction = `
export async function clearChatHistory(conversationId: string) {
  const user = await getSessionUser();
  await prisma.conversationParticipant.update({
    where: { conversationId_employeeId: { conversationId, employeeId: user.employeeId } },
    data: { clearedAt: new Date() }
  });
}
`;

c += newAction;

// Also update getMessages to filter out cleared messages
c = c.replace(
  "return await prisma.message.findMany({",
  `const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_employeeId: { conversationId, employeeId } }
  });
  
  return await prisma.message.findMany({`
);

c = c.replace(
  "where: { conversationId },",
  "where: { conversationId, createdAt: { gt: participant?.clearedAt || new Date(0) } },"
);

fs.writeFileSync("src/app/chatActions.ts", c);
console.log("Patched actions");

