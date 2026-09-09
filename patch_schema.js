const fs = require("fs");
let c = fs.readFileSync("prisma/schema.prisma", "utf8");
c = c.replace(
  "isArchived     Boolean      @default(false)",
  "isArchived     Boolean      @default(false)\n  clearedAt      DateTime?    @default(now())"
);
fs.writeFileSync("prisma/schema.prisma", c);
console.log("Patched schema");

