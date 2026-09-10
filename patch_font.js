const fs = require("fs");
let content = fs.readFileSync("src/app/layout.tsx", "utf8");

if (!content.includes("Playfair_Display")) {
  content = content.replace(
    /import \{ Inter, Geist \} from 'next\/font\/google';/,
    `import { Inter, Geist, Playfair_Display } from 'next/font/google';`
  );

  content = content.replace(
    /const inter = Inter\(\{ subsets: \['latin'\] \}\);/,
    `const inter = Inter({ subsets: ['latin'] });\nconst playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });`
  );

  content = content.replace(
    /className=\{cn\("font-sans", geist\.variable\)\}/,
    `className={cn("font-sans", geist.variable, playfair.variable)}`
  );

  fs.writeFileSync("src/app/layout.tsx", content);
  console.log("Updated layout.tsx with Playfair_Display");
} else {
  console.log("Playfair_Display already added.");
}

