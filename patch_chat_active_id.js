const fs = require("fs");
let content = fs.readFileSync("src/app/chat/ChatClient.tsx", "utf8");

if (!content.includes("__ACTIVE_CHAT_ID")) {
  content = content.replace(
    /const \[activeConversationId, setActiveConversationId\] = useState<string \| null>\(null\);/,
    `const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  useEffect(() => {
    (window as any).__ACTIVE_CHAT_ID = activeConversationId;
    return () => { (window as any).__ACTIVE_CHAT_ID = null; };
  }, [activeConversationId]);`
  );

  // Add listener for global messages to update sidebar
  content = content.replace(
    /return \(\n    <div/,
    `useEffect(() => {
    const handleGlobalMessage = (e: any) => {
      const data = e.detail;
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.id === data.conversationId);
        if (idx !== -1) {
          copy[idx].messages = [data];
          copy[idx].updatedAt = new Date().toISOString();
          if (data.conversationId !== activeConversationId) {
            copy[idx].unreadCount = (copy[idx].unreadCount || 0) + 1;
          }
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        } else {
          // New conversation, fetch it or just reload list (simplified)
        }
        return copy;
      });
    };
    window.addEventListener("chat-global-message", handleGlobalMessage);
    return () => window.removeEventListener("chat-global-message", handleGlobalMessage);
  }, [activeConversationId]);

  return (
    <div`
  );

  fs.writeFileSync("src/app/chat/ChatClient.tsx", content);
  console.log("Updated ChatClient.tsx with global message sync");
}

