const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

const regex = /const channels = \[\s*\{ name: '#company-announcements'[\s\S]*?\];\s*for \(const ch of channels\) \{/m;

code = code.replace(regex, "for (const ch of GLOBAL_CHANNELS_POLICY) {");

fs.writeFileSync('src/app/chatActions.ts', code);
