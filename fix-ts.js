const fs = require('fs');
let content = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');
content = content.replace(
  "const reactionCounts = {};",
  "const reactionCounts: Record<string, { count: number, me: boolean }> = {};"
);
content = content.replace(
  "msg.reactions?.forEach((r) => {",
  "msg.reactions?.forEach((r: any) => {"
);
content = content.replace(
  "Object.entries(reactionCounts).map(([emoji, data]) => (",
  "Object.entries(reactionCounts).map(([emoji, data]: [string, any]) => ("
);
fs.writeFileSync('src/app/chat/ChatClient.tsx', content);
