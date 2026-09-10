const fs = require("fs");
let content = fs.readFileSync("src/app/components/CommandPalette.tsx", "utf8");
content = content.replace(
  /<button\s+onClick=\{\(\) => setOpen\(true\)\}\s+className="(.*?)"/g,
  `<button onClick={() => setOpen(true)} className="$1 tour-command-palette"`
);
fs.writeFileSync("src/app/components/CommandPalette.tsx", content);
console.log("Updated CommandPalette.tsx");

