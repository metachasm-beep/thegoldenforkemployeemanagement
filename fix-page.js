const fs = require('fs');
let page = fs.readFileSync('src/app/chat/page.tsx', 'utf8');
page = page.replace(
  'initialConversations={await getConversations(mgr.id, mgr.id, mgr.role)}',
  'initialConversations={await getConversations(mgr.id)}'
);
fs.writeFileSync('src/app/chat/page.tsx', page);
