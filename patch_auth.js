const fs = require("fs");
let p = fs.readFileSync("src/app/page.tsx", "utf8");
p = p.replace(
  "const session = await getServerSession(authOptions);",
  "let session = await getServerSession(authOptions);"
);
fs.writeFileSync("src/app/page.tsx", p);
