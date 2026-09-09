const fs = require("fs");
let c = fs.readFileSync("src/components/Onboarding.tsx", "utf8");
c = c.replace(
  "import { Joyride, CallBackProps, STATUS, Step } from \"react-joyride\";",
  "import dynamic from \"next/dynamic\";\nconst Joyride = dynamic(() => import(\"react-joyride\"), { ssr: false });"
);
c = c.replace("import Joyride, { CallBackProps, STATUS, Step } from \"react-joyride\";", ""); // remove if existing
fs.writeFileSync("src/components/Onboarding.tsx", c);

