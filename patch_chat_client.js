const fs = require('fs');
let code = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

// Update Props
code = code.replace(
  'initialConversations: any[];\n};',
  'initialConversations: any[];\n  isImpersonating?: boolean;\n};'
);

code = code.replace(
  'export default function ChatClient({ currentEmployeeId, employees, initialConversations }: ChatClientProps) {',
  'export default function ChatClient({ currentEmployeeId, employees, initialConversations, isImpersonating = false }: ChatClientProps) {'
);

// Add impersonation flag to getMessages
code = code.replace(
  'getMessages(activeConversationId).then(data => {',
  'getMessages(activeConversationId, isImpersonating ? currentEmployeeId : undefined).then(data => {'
);

// Fix sending behavior and read-only UI
code = code.replace(
  '<form onSubmit={handleSend} className="flex gap-2">',
  `{isImpersonating || activeConvoDetails?.isReadOnly ? (
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-500 italic text-center">
                  {isImpersonating ? "Sending messages is disabled in God Mode." : "This channel is read-only."}
                </div>
              ) : (
              <form onSubmit={handleSend} className="flex gap-2">`
);

code = code.replace(
  '</button>\n              </form>',
  '</button>\n              </form>\n              )}'
);

// Fix otherParticipant rendering for GROUP channels (like announcements)
// Replace existing otherParticipant logic which assumes DIRECT channels
code = code.replace(
  'const otherParticipant = activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;',
  `const otherParticipant = activeConvoDetails?.type === 'DIRECT' 
    ? activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee 
    : null;`
);

// Also need to fix the sidebar display of channels vs DIRECT chats
code = code.replace(
  'const other = c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;\n            if (!other) return null;',
  `let displayTitle = '';
            let avatarSrc = '';
            if (c.type === 'GROUP') {
              displayTitle = c.name || 'Group Channel';
              avatarSrc = 'https://ui-avatars.com/api/?name=Group&background=random';
            } else {
              const other = c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;
              if (!other) return null;
              displayTitle = other.name;
              avatarSrc = other.avatarUrl || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(other.name)}&background=random\`;
            }`
);

code = code.replace(
  /other\.name/g,
  'displayTitle'
);

code = code.replace(
  /other\.avatarUrl \|\| `[^`]+`/g,
  'avatarSrc'
);

fs.writeFileSync('src/app/chat/ChatClient.tsx', code);
console.log("Patched ChatClient.tsx for Channels and Impersonation");
