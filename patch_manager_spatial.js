const fs = require("fs");
let content = fs.readFileSync("src/app/components/ManagerDashboard.tsx", "utf8");

content = content.replace(/bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/g, "spatial-card text-gray-900 dark:text-gray-100");
content = content.replace(/bg-red-50 dark:bg-red-900\/20 border border-red-200 dark:border-red-900\/50/g, "spatial-card bg-red-100/50 dark:bg-red-900/30 text-gray-900 dark:text-gray-100");

// Also let's replace rounded-xl and rounded-3xl with spatial styling if needed
// Actually, spatial-card is just background and border

fs.writeFileSync("src/app/components/ManagerDashboard.tsx", content);
console.log("Updated ManagerDashboard.tsx");

