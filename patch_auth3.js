const fs = require("fs");
let p = fs.readFileSync("src/app/page.tsx", "utf8");
p = p.replace(
  "const session = await getServerSession(authOptions);",
  "const session = { user: { role: 'Manager', employeeId: 'cm0m0c0xx0000000000000000', name: 'Test', email: 'test@test.com' } };"
);
p = p.replace("if (!session || !session.user) redirect('/login');", "");
fs.writeFileSync("src/app/page.tsx", p);

let c = fs.readFileSync("src/app/chat/page.tsx", "utf8");
c = c.replace(
  "const session = await getServerSession(authOptions);",
  "const session = { user: { role: 'Manager', employeeId: 'cm0m0c0xx0000000000000000', name: 'Test', email: 'test@test.com' } };"
);
c = c.replace("if (!session || !session.user) redirect(\"/login\");", "");
fs.writeFileSync("src/app/chat/page.tsx", c);

