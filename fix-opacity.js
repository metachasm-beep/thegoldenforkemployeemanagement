const fs = require('fs');
let content = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');
content = content.replace(/animate=\{\{opacity:0\}\}/g, "");
fs.writeFileSync('src/app/chat/ChatClient.tsx', content);
