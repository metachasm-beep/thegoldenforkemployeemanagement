const fs = require("fs");
let content = fs.readFileSync("src/app/globals.css", "utf8");

content = content.replace(/\.dark @utility spatial-glass \{[\s\S]*?\}/, "");
content = content.replace(/\.dark @utility spatial-card \{[\s\S]*?\}/, "");
content = content.replace(/\.dark @utility spatial-card-hover \{[\s\S]*?\}/, "");

content = content.replace(/@utility spatial-glass \{[\s\S]*?\}/, `@utility spatial-glass {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}`);

content = content.replace(/@utility spatial-card \{[\s\S]*?\}/, `@utility spatial-card {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}`);

content = content.replace(/@utility spatial-card-hover \{[\s\S]*?\}/, `@utility spatial-card-hover {
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
}`);

// Add standard class overrides for dark mode
content += `

.dark .spatial-glass {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5) !important;
}

.dark .spatial-card {
  background-color: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.dark .spatial-card-hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}
`;

fs.writeFileSync("src/app/globals.css", content);
console.log("Updated globals.css with correct CSS nesting syntax.");

