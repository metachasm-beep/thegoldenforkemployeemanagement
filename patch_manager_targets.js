const fs = require("fs");
let content = fs.readFileSync("src/app/components/ManagerDashboard.tsx", "utf8");

content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">/,
  `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 tour-stats">`
);

content = content.replace(
  /<div className="spatial-card text-gray-900 dark:text-gray-100 p-4 md:p-6 rounded-3xl shadow-sm flex flex-col h-96">/,
  `<div className="spatial-card text-gray-900 dark:text-gray-100 p-4 md:p-6 rounded-3xl shadow-sm flex flex-col h-96 tour-leaderboard">`
);

fs.writeFileSync("src/app/components/ManagerDashboard.tsx", content);
console.log("Updated ManagerDashboard.tsx");

