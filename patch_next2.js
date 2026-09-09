const fs = require("fs");
let c = fs.readFileSync("next.config.ts", "utf8");
c = c.replace(/\\s*\\],\\s*\\};/g, ""); // wait, easier to just regex it properly or do it directly
fs.writeFileSync("next.config.ts", c);

