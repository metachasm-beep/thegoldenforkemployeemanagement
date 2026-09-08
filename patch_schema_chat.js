const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModels = `
model Conversation {
  id           String     @id @default(uuid())
  type         String     @default("DIRECT") // DIRECT or GROUP
  name         String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  participants ConversationParticipant[]
  messages     Message[]
}

model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String
  employeeId     String
  joinedAt       DateTime     @default(now())
  lastReadAt     DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  employee       Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([conversationId, employeeId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  content        String
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         Employee     @relation(fields: [senderId], references: [id], onDelete: Cascade)
}
`;

code += newModels;

// We also need to add the opposite relation fields to the Employee model to satisfy Prisma.
// Let's find `model Employee { ... }` and append the relations.

code = code.replace(
  /model Employee \{([\s\S]*?)sessionVersion\s+Int\s+@default\(1\)/,
  `model Employee {$1sessionVersion    Int     @default(1)\n  chatParticipations ConversationParticipant[]\n  messages          Message[]`
);

fs.writeFileSync('prisma/schema.prisma', code);
console.log("Updated schema.prisma with Chat models");
