const fs = require("fs");
let c = fs.readFileSync("src/hooks/useChatSync.ts", "utf8");

c = c.replace(
  "import { getMessages, markAsRead, setPresenceStatus } from \"@/app/chatActions\";",
  "import { getMessages, markAsRead, setPresenceStatus, markAsDelivered } from \"@/app/chatActions\";"
);

const newBinds = `
    channel.bind("message-updated", (data: any) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m));
    });

    channel.bind("delivery-receipt", (data: any) => {
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            participants: c.participants.map((p: any) => 
              p.employeeId === data.employeeId ? { ...p, lastDeliveredAt: data.lastDeliveredAt } : p
            )
          };
        }
        return c;
      }));
    });
`;

c = c.replace(
  "    channel.bind(\"reaction-update\", (data: any) => {",
  newBinds + "\n    channel.bind(\"reaction-update\", (data: any) => {"
);

c = c.replace(
  "if (!isImpersonating) markAsRead(activeConversationId).catch(()=>{});",
  "if (!isImpersonating) { markAsRead(activeConversationId).catch(()=>{}); markAsDelivered(activeConversationId).catch(()=>{}); }"
);

fs.writeFileSync("src/hooks/useChatSync.ts", c);

