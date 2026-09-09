const fs = require("fs");
let c = fs.readFileSync("next.config.ts", "utf8");
c = c.replace(/async oldHeaders\(\) \{[\s\S]*?\},/, "");
c = c.replace(/import withPWAInit from "next-pwa";/, "const withPWAInit = require(\"next-pwa\");");
fs.writeFileSync("next.config.ts", c);

