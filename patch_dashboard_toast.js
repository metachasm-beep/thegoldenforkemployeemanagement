const fs = require("fs");
let content = fs.readFileSync("src/app/components/DashboardLayout.tsx", "utf8");

content = content.replace(
  /channel\.bind\("global-new-message", \(data: any\) => \{[\s\S]*?notifier\.enqueue\(`New message from \$\{data\.senderName\}`[\s\S]*?\}\);[\s\S]*?\}\);/m,
  `channel.bind("global-new-message", (data: any) => {
        // Play audio for incoming messages globally
        import("@/lib/notificationManager").then((mod) => mod.playNotificationSound?.());
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chat-global-message", { detail: data }));
        }

        if (window.location.pathname.startsWith("/chat")) {
          if ((window as any).__ACTIVE_CHAT_ID === data.conversationId) return;
        }
        
        notifier.enqueue(\`New message from \$\{data.senderName\}\`, {
          description: data.content,
          action: {
            label: "View",
            onClick: () => window.location.href = "/chat"
          }
        });
      });`
);

fs.writeFileSync("src/app/components/DashboardLayout.tsx", content);
console.log("Updated DashboardLayout.tsx");

