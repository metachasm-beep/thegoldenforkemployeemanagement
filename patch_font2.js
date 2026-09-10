const fs = require("fs");
let content = fs.readFileSync("src/app/layout.tsx", "utf8");

content = content.replace(/Playfair_Display/g, "Cinzel");
content = content.replace(/playfair/g, "cinzel");

fs.writeFileSync("src/app/layout.tsx", content);
console.log("Updated layout.tsx with Cinzel");

let cssContent = fs.readFileSync("src/app/globals.css", "utf8");
cssContent = cssContent.replace(/--font-playfair/g, "--font-cinzel");
fs.writeFileSync("src/app/globals.css", cssContent);
console.log("Updated globals.css");

let layoutContent = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");
layoutContent = layoutContent.replace(/--font-playfair/g, "--font-cinzel");
fs.writeFileSync("src/app/components/DashboardLayout.tsx", layoutContent);
console.log("Updated DashboardLayout.tsx");

