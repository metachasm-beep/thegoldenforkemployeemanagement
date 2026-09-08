const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add lastReadAt to ConversationParticipant
code = code.replace(
  'joinedAt       DateTime     @default(now())',
  'joinedAt       DateTime     @default(now())\n  lastReadAt     DateTime     @default(now())'
);

// 2. Add parentId and relations to Message, plus Reaction model
const msgStr = `model Message {
  id             String       @id @default(uuid())
  content        String
  createdAt      DateTime     @default(now())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         Employee     @relation(fields: [senderId], references: [id])
`;

const newMsgStr = `model Message {
  id             String       @id @default(uuid())
  content        String
  createdAt      DateTime     @default(now())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         Employee     @relation(fields: [senderId], references: [id])
  
  // Phase 4 Additions
  parentId       String?
  parent         Message?     @relation("MessageReplies", fields: [parentId], references: [id])
  replies        Message[]    @relation("MessageReplies")
  reactions      Reaction[]
`;

code = code.replace(msgStr, newMsgStr);

const reactionModel = `
model Reaction {
  id         String   @id @default(uuid())
  emoji      String
  messageId  String
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([messageId, employeeId, emoji])
}
`;

code += reactionModel;

// Add reactions relation to Employee
code = code.replace(
  'messages         Message[]',
  'messages         Message[]\n  reactions        Reaction[]'
);

fs.writeFileSync('prisma/schema.prisma', code);
console.log("Patched schema.prisma for Phase 4");
