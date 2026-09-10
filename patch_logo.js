const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

content = content.replace(
  /<div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">[\s\S]*?<\/div>/g,
  `<img src="/logo.jpg" alt="Golden Fork Logo" className="h-8 w-8 rounded-lg shadow-sm object-cover" />`
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx with logo");

