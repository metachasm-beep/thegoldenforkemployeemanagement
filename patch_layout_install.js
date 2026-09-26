const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

content = content.replace(
  "import { Menu, X, Users, MessageSquare, Target, Receipt, Calendar, Home, Settings, CheckCircle, BarChart3, Search, LogOut, Sun, Moon } from \"lucide-react\";",
  "import { Menu, X, Users, MessageSquare, Target, Receipt, Calendar, Home, Settings, CheckCircle, BarChart3, Search, LogOut, Sun, Moon } from \"lucide-react\";\\nimport InstallAppButton from \"./InstallAppButton\";"
);

content = content.replace(
  /<NavLink href="\/settings" icon=\{Settings\} label="Settings" \/>\s*<\/nav>/,
  "<NavLink href=\"/settings\" icon={Settings} label=\"Settings\" />\\n            <InstallAppButton />\\n          </nav>"
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Added InstallAppButton to DashboardLayout");

