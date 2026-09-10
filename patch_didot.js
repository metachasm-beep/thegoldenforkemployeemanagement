const fs = require("fs");
let content = fs.readFileSync("src/app/layout.tsx", "utf8");

content = content.replace(/import \{ Inter, Geist, Cinzel \} from 'next\/font\/google';/, "import { Inter, Geist, GFS_Didot } from 'next/font/google';");
content = content.replace(/const cinzel = Cinzel\(\{ subsets: \['latin'\], variable: '--font-cinzel' \}\);/, "const didot = GFS_Didot({ weight: '400', subsets: ['greek'], variable: '--font-didot' });"); // GFS Didot is often greek/latin, let's just use subsets: ["latin"] if available, actually some fonts don't support latin subsets if they are greek specific. Let's just avoid subsets or use weight: "400".
// Let's be safer:
content = content.replace(/const cinzel = Cinzel\(.*?\);/, "const didot = GFS_Didot({ weight: '400', subsets: ['latin'], variable: '--font-didot' });");
content = content.replace(/cinzel\.variable/, "didot.variable");

fs.writeFileSync("src/app/layout.tsx", content);
console.log("Updated layout.tsx");

let cssContent = fs.readFileSync("src/app/globals.css", "utf8");
cssContent = cssContent.replace(/--font-cinzel: var\(--font-cinzel\);/, "--font-didot: var(--font-didot);");
fs.writeFileSync("src/app/globals.css", cssContent);
console.log("Updated globals.css");

let layoutContent = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");
layoutContent = layoutContent.replace(/--font-cinzel/g, "--font-didot");
// The user asked to reduce internal character spacing and size so it fits on one line
layoutContent = layoutContent.replace(/tracking-\[0\.2em\]/g, "tracking-wider"); // Reduced from 0.2em
fs.writeFileSync("src/app/components/DashboardLayout.tsx", layoutContent);
console.log("Updated DashboardLayout.tsx");

