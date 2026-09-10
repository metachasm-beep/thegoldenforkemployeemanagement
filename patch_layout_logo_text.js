const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

// Desktop
content = content.replace(
  /<span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">\s*Golden Fork\s*<\/span>/,
  `<span className="font-bold text-xl tracking-[0.2em] text-gray-900 dark:text-white uppercase font-['var(--font-playfair)']">\n            GOLDEN FORK\n          </span>`
);

// Mobile
content = content.replace(
  /<span className="font-bold text-lg text-gray-900 dark:text-white">\s*Golden Fork\s*<\/span>/,
  `<span className="font-bold text-lg tracking-[0.2em] text-gray-900 dark:text-white uppercase font-['var(--font-playfair)']">\n              GOLDEN FORK\n            </span>`
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx with capitalized elegant text");

