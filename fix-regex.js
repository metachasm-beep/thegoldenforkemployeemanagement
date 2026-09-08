const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');
code = code.replace(/language-\(w\+\)/g, "language-(\\\\w+)");
fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
