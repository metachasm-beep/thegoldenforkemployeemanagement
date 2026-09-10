const fs = require("fs");
let content = fs.readFileSync("prisma/schema.prisma", "utf8");

const model = `
model PushSubscription {
  id         String   @id @default(uuid())
  employeeId String
  endpoint   String   @unique
  p256dh     String
  auth       String
  createdAt  DateTime @default(now())

  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
}
`;

content = content.replace("model Employee {", "model Employee {"); // Just a no-op check
// Append the model
content += "\n" + model;

// Add relation to Employee model
content = content.replace(/lastLogin\s+DateTime\?/g, "lastLogin         DateTime?\n  pushSubscriptions PushSubscription[]");

fs.writeFileSync("prisma/schema.prisma", content);
console.log("Updated schema.prisma");

