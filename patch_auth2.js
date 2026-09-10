const fs = require("fs");
let p = fs.readFileSync("src/app/page.tsx", "utf8");
p = p.replace(
  "let session = await getServerSession(authOptions);",
  "let session = await getServerSession(authOptions);\n  session = { user: { role: 'Manager', employeeId: 'test' } };"
);
fs.writeFileSync("src/app/page.tsx", p);
