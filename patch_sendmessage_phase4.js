const fs = require('fs');
let code = fs.readFileSync('src/app/chatActions.ts', 'utf8');

code = code.replace(
  'export async function sendMessage(conversationId: string, content: string) {',
  'export async function sendMessage(conversationId: string, content: string, parentId?: string) {'
);

code = code.replace(
  'data: {\n      content,\n      conversationId,\n      senderId: currentEmployeeId\n    },',
  'data: {\n      content,\n      conversationId,\n      senderId: currentEmployeeId,\n      parentId\n    },'
);

// sendMessage returns the message, let's include parent and reactions so it matches getMessages
code = code.replace(
  'include: { sender: true }',
  'include: { sender: true, parent: { include: { sender: true } }, reactions: true }'
);

fs.writeFileSync('src/app/chatActions.ts', code);
console.log("Updated sendMessage to support parentId");
