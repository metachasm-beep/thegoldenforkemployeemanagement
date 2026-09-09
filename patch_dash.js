const fs = require("fs");
let c = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");
c = c.replace(
  "import { toast } from \"sonner\";",
  "import { toast } from \"sonner\";\nimport Onboarding from \"@/components/Onboarding\";"
);
c = c.replace(
  "<header className=\"h-16 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10\">",
  "<header className=\"h-16 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10 dashboard-header\">\n          <Onboarding />"
);
fs.writeFileSync("src/app/components/DashboardLayout.tsx", c);

