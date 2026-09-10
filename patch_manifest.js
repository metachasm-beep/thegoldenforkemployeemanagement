const fs = require("fs");
let content = fs.readFileSync("public/manifest.json", "utf8");
let manifest = JSON.parse(content);

manifest.icons = [
  { "src": "/favicon.ico", "sizes": "64x64", "type": "image/x-icon" },
  { "src": "/logo.jpg", "sizes": "192x192", "type": "image/jpeg" },
  { "src": "/logo.jpg", "sizes": "512x512", "type": "image/jpeg" }
];

fs.writeFileSync("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log("Updated manifest.json icons");

