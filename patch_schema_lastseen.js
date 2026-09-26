const fs = require("fs");
let content = fs.readFileSync("prisma/schema.prisma", "utf8");

content = content.replace(
  "  avatarUrl         String? @db.Text",
  "  avatarUrl         String? @db.Text\\n  lastSeenAt        DateTime? @default(now())"
);

fs.writeFileSync("prisma/schema.prisma", content);
console.log("Updated schema.prisma with lastSeenAt");

