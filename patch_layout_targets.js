const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

content = content.replace(
  /<aside className="(.*?)">/,
  `<aside className="$1 tour-sidebar">`
);

content = content.replace(
  /<button\s+onClick=\{\(\) => setTheme\(theme === 'dark' \? 'light' : 'dark'\)\}\s+className="(.*?)"/g,
  `<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="$1 tour-theme-toggle"`
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx");

