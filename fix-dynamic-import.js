const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

code = code.replace(/await import\('\.\.\/actions'\)/g, "await import('@/services/settingService')");

fs.writeFileSync('src/app/settings/page.tsx', code);
