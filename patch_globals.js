const fs = require("fs");
let content = fs.readFileSync("src/app/globals.css", "utf8");

content = `@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

.dark {
  --background: #000000;
  --foreground: #f8fafc;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
}

/* Spatial Glass utilities */
@utility spatial-glass {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}

.dark @utility spatial-glass {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

@utility spatial-card {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark @utility spatial-card {
  background-color: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@utility spatial-card-hover {
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dark @utility spatial-card-hover {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Sleek Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
.dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
.dark ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

fs.writeFileSync("src/app/globals.css", content);
console.log("Updated globals.css");

