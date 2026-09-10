const fs = require("fs");
let content = fs.readFileSync("src/app/globals.css", "utf8");

if (!content.includes("--font-playfair")) {
  content = content.replace(
    /--font-sans: var\(--font-geist-sans\);/,
    `--font-sans: var(--font-geist-sans);\n  --font-playfair: var(--font-playfair);`
  );
  fs.writeFileSync("src/app/globals.css", content);
  console.log("Updated globals.css with --font-playfair");
} else {
  console.log("Already updated");
}

