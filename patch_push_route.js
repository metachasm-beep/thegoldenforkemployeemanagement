const fs = require("fs");
let content = fs.readFileSync("src/app/api/push/route.ts", "utf8");
content = content.replace("import prisma from \\"@/lib/prisma\\";", "import { prisma } from \\"@/lib/prisma\\";");
fs.writeFileSync("src/app/api/push/route.ts", content);
console.log("Fixed prisma import in route.ts");

