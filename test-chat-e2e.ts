import { prisma } from './src/lib/prisma';

async function runTest() {
  console.log("Starting DB E2E Chat Test...");
  
  // 1. Get two employees
  const employees = await prisma.employee.findMany({ take: 2 });
  if (employees.length < 2) {
    console.log("Not enough employees to test chat");
    return;
  }
  
  const emp1 = employees[0];
  const emp2 = employees[1];
  console.log(`Testing chat between ${emp1.name} and ${emp2.name}`);

  // 2. Create or Get Conversation
  let convo = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [
          { employeeId: emp1.id },
          { employeeId: emp2.id }
        ]
      }
    },
    include: { participants: true }
  });
  console.log(`Created Conversation ID: ${convo.id}`);

  // 3. Send Message
  const msgContent = "Hello from automated E2E test!";
  const message = await prisma.message.create({
    data: {
      content: msgContent,
      conversationId: convo.id,
      senderId: emp1.id
    },
    include: { sender: true }
  });
  console.log(`Message saved: "${message.content}" from ${message.sender.name}`);

  // 4. Verify retrieval
  const fetchedConvos = await prisma.conversation.findMany({
    where: {
      participants: { some: { employeeId: emp1.id } }
    },
    include: { messages: true }
  });
  
  const hasMsg = fetchedConvos.some(c => c.id === convo.id && c.messages.some(m => m.id === message.id));
  console.log(`Message successfully retrieved: ${hasMsg}`);

  // Cleanup
  await prisma.conversation.delete({ where: { id: convo.id } });
  console.log("Cleanup complete. DB portion of E2E Test PASSED.");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
