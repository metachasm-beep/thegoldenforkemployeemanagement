const fs = require('fs');
let code = fs.readFileSync('src/services/leadService.ts', 'utf8');
code = code.replace("import { getSessionUser, logAction, createNotification } from './core';", "import { getSessionUser, logAction, createNotification, requireManager } from './core';");
fs.writeFileSync('src/services/leadService.ts', code);
