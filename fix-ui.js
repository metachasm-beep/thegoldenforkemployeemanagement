const fs = require('fs');
let content = fs.readFileSync('src/app/chat/ChatClient.tsx', 'utf8');

const oldVirtualizerTarget = `  const messagesEndRef = useRef<HTMLDivElement>(null);`;
const virtualizerSetup = `  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  useEffect(() => {
    if (rowVirtualizer.getTotalSize() > 0 && messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, activeConversationId]);`;

content = content.replace(oldVirtualizerTarget, virtualizerSetup);

// Remove the old scroll effect
content = content.replace(
  /useEffect\(\(\) => \{\s*messagesEndRef\.current\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\s*\}, \[messages\]\);/,
  ""
);

const startIdx = content.indexOf('<div className="flex-1 overflow-y-auto p-6 space-y-6">');
const endMarker = '</div>\n            </div>\n\n            <div className="p-4 bg-white dark:bg-gray-900';
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end block! startIdx:", startIdx, "endIdx:", endIdx);
  process.exit(1);
}

const blockToReplace = content.substring(startIdx, endIdx);

const newBlock = `<div ref={parentRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10 relative custom-scrollbar">
  {loading && messages.length === 0 ? (
    <div className="space-y-6 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={\`flex gap-3 \${i % 2 === 0 ? 'justify-end' : ''}\`}>
          {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0"></div>}
          <div className={\`w-64 h-16 rounded-[1.5rem] animate-pulse \${i % 2 === 0 ? 'bg-purple-200 dark:bg-purple-900/40 rounded-br-md' : 'bg-gray-200 dark:bg-gray-800/60 rounded-bl-md'}\`}></div>
        </div>
      ))}
    </div>
  ) : (
    <div style={{ height: \`\${rowVirtualizer.getTotalSize()}px\`, width: '100%', position: 'relative' }}>
      <AnimatePresence initial={false}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const msg = messages[virtualRow.index];
          if (!msg) return null;
          const isMe = msg.employeeId === currentEmployeeId;
          const isLastMessage = virtualRow.index === messages.length - 1;
          const showAvatar = virtualRow.index === 0 || messages[virtualRow.index - 1]?.employeeId !== msg.employeeId;
          const reactionCounts: Record<string, { count: number, me: boolean }> = {};
          msg.reactions?.forEach((r: any) => {
            if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, me: false };
            reactionCounts[r.emoji].count++;
            if (r.employeeId === currentEmployeeId) reactionCounts[r.emoji].me = true;
          });

          return (
            <motion.div
              key={msg.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: \`translateY(\${virtualRow.start}px)\`
              }}
              className={\`flex gap-3 group pb-6 \${isMe ? 'justify-end' : ''}\`}
            >
              {!isMe && showAvatar && msg.sender ? <EmployeeAvatar emp={msg.sender} /> : (!isMe && <div className="w-8 shrink-0"></div>)}
              
              <div className={\`max-w-[70%] \${isMe ? 'items-end' : 'items-start'} flex flex-col relative\`}>
                {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                
                {msg.parent && (
                  <div className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-1 text-gray-500 truncate w-full flex items-center gap-1 opacity-70">
                    <Reply size={12} className="shrink-0" /> <span className="truncate">Replying to {msg.parent.sender?.name}: {msg.parent.content}</span>
                  </div>
                )}
                
                <div className="relative flex items-center gap-2 group/msg">
                  {isMe && !isImpersonating && (
                    <motion.div className="opacity-0 group-hover/msg:opacity-100 transition-all flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-1 absolute right-full mr-2 top-0 z-10">
                      <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Reply size={14}/></button>
                      <button onClick={() => toggleReaction(msg.id, '👍')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Smile size={14}/></button>
                    </motion.div>
                  )}
                  
                  <div className={\`px-5 py-3 rounded-[1.5rem] prose prose-sm dark:prose-invert break-words max-w-full shadow-sm \${isMe ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-br-md prose-p:text-white prose-a:text-pink-100' : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-gray-100 rounded-bl-md border border-white/50 dark:border-gray-700/50'}\`}>
                    <ReactMarkdown components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                  </div>

                  {!isMe && !isImpersonating && (
                    <motion.div className="opacity-0 group-hover/msg:opacity-100 transition-all flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-1 absolute left-full ml-2 top-0 z-10">
                      <button onClick={() => toggleReaction(msg.id, '👍')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">👍</button>
                      <button onClick={() => toggleReaction(msg.id, '❤️')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">❤️</button>
                      <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Reply size={14}/></button>
                    </motion.div>
                  )}
                </div>

                {Object.keys(reactionCounts).length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {Object.entries(reactionCounts).map(([emoji, data]) => (
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        key={emoji}
                        onClick={() => !isImpersonating && toggleReaction(msg.id, emoji)}
                        className={\`text-xs px-2.5 py-1 rounded-full border \${data.me ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'bg-white/50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300'}\`}
                      >
                        {emoji} {data.count}
                      </motion.button>
                    ))}
                  </div>
                )}

                {isMe && isLastMessage && readReceipts.length > 0 && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-1 mt-1 justify-end">
                    <CheckCheck size={14} className="text-purple-400" />
                    <div className="flex -space-x-1">
                      {readReceipts.slice(0, 3).map((r: any) => (
                        <div key={r.id} className="relative w-4 h-4 rounded-full border border-white dark:border-gray-900 z-10 overflow-hidden">
                          {r.avatarUrl ? (
                            <Image src={r.avatarUrl} alt={r.name} fill className="object-cover" />
                          ) : (
                            <InitialsAvatar name={r.name} className="w-full h-full text-[8px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  )}
`;

content = content.replace(blockToReplace, newBlock);
fs.writeFileSync('src/app/chat/ChatClient.tsx', content);
console.log("Successfully replaced rendering block!");
