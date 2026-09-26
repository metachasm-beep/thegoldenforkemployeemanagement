const fs = require("fs");
let content = fs.readFileSync("src/app/chatActions.ts", "utf8");

content = content.replace(
  "  const message = await prisma.message.create({",
  "  await prisma.employee.update({ where: { id: currentEmployeeId }, data: { lastSeenAt: new Date() } });\\n\\n  const message = await prisma.message.create({"
);

fs.writeFileSync("src/app/chatActions.ts", content);
console.log("Updated chatActions to bump lastSeenAt on sendMessage");

