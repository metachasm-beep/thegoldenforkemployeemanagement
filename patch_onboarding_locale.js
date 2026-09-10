const fs = require("fs");
let content = fs.readFileSync("src/components/Onboarding.tsx", "utf8");

content = content.replace(/showSkipButton/g, "showSkipButton\n      locale={{ skip: 'Skip Tutorial' }}");

fs.writeFileSync("src/components/Onboarding.tsx", content);
console.log("Updated Onboarding.tsx locale");

