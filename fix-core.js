const fs = require('fs');

let core = fs.readFileSync('src/services/core.ts', 'utf8');

core = core.replace(/async function getSessionUser/g, 'export async function getSessionUser');
core = core.replace(/async function requireManager/g, 'export async function requireManager');
core = core.replace(/async function requireManagerOrHR/g, 'export async function requireManagerOrHR');

fs.writeFileSync('src/services/core.ts', core);
