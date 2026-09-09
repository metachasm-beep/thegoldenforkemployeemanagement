const fs = require("fs");
let c = fs.readFileSync("src/app/chat/ChatClient.tsx", "utf8");

// 1. Rename showStarredPane to rightPaneMode
c = c.replace(
  "const [showStarredPane, setShowStarredPane] = useState(false);",
  "const [rightPaneMode, setRightPaneMode] = useState<\"hidden\" | \"starred\" | \"info\">(\"hidden\");"
);

c = c.replace(/showStarredPane/g, "rightPaneMode === \"starred\"");
c = c.replace(/setShowStarredPane\(false\)/g, "setRightPaneMode(\"hidden\")");
c = c.replace(/!showStarredPane/g, "rightPaneMode === \"starred\" ? \"hidden\" : \"starred\"");
c = c.replace(/setShowStarredPane\(!showStarredPane\)/g, "setRightPaneMode(rightPaneMode === \"starred\" ? \"hidden\" : \"starred\")");
c = c.replace(/setShowStarredPane/g, "setRightPaneMode");

// 2. Fix the hover tooltip and open info pane on click
c = c.replace(
  /<div className=\"absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-4 pointer-events-none\">/g,
  `<div className=\"absolute left-10 top-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] p-3 pointer-events-none\">`
);

// 3. Add Info button in the header
c = c.replace(
  "<button onClick={() => setRightPaneMode(rightPaneMode === \"starred\" ? \"hidden\" : \"starred\")}",
  `<button onClick={() => setRightPaneMode(rightPaneMode === "info" ? "hidden" : "info")} className={\`p-2 rounded-full transition-colors \${rightPaneMode === "info" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}\`}>
    <Users size={18} className={rightPaneMode === "info" ? "text-purple-500" : ""} />
  </button>
  <button onClick={() => setRightPaneMode(rightPaneMode === "starred" ? "hidden" : "starred")}`
);

// 4. Also make the header clickable to open info
c = c.replace(
  "<div className=\"flex items-center gap-3\">",
  `<div className=\"flex items-center gap-3 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 p-2 rounded-xl transition-colors\" onClick={() => setRightPaneMode(\"info\")}>`
);

// 5. Add the Info Pane renderer in the Right Pane section
const rightPaneReplacer = `
      {/* Right Pane */}
      {rightPaneMode !== "hidden" && (
        <div className="w-80 border-l border-white/40 dark:border-gray-700/40 flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-md">
          {rightPaneMode === "starred" ? (
            <>
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star size={16} className="text-purple-500" /> Starred Messages
            </h3>
            <button onClick={() => setRightPaneMode("hidden")} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {starredMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-10">No starred messages yet.</p>
            ) : (
              starredMessages.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-purple-400 transition-colors" onClick={() => { setActiveConversationId(msg.conversationId); setRightPaneMode("hidden"); }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-gray-200">
                       <InitialsAvatar name={msg.sender?.name} className="text-xs" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{msg.sender?.name}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm max-w-full line-clamp-3">
                    {msg.isDeleted ? "🚫 This message was deleted" : msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          ) : (
            <>
              <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users size={16} className="text-purple-500" /> Chat Info
                </h3>
                <button onClick={() => setRightPaneMode("hidden")} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-purple-500/20 shrink-0 overflow-hidden">
                  {otherEmployee?.avatarUrl ? (
                     <Image src={otherEmployee.avatarUrl} alt={otherEmployee.name} width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                     <InitialsAvatar name={activeConvoDetails?.name || otherEmployee?.name || "?"} className="w-full h-full text-2xl" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                  {activeConvoDetails?.name || otherEmployee?.name}
                </h2>
                <p className="text-sm text-gray-500 mb-6">{activeConvoDetails?.participants.length} Participants</p>
                
                <div className="w-full space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Participants</h4>
                  {activeConvoDetails?.participants.map((p: any) => (
                    <div key={p.employeeId} className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative">
                         {p.employee.avatarUrl ? (
                            <Image src={p.employee.avatarUrl} alt={p.employee.name} fill className="object-cover" />
                         ) : (
                            <InitialsAvatar name={p.employee.name} className="w-full h-full text-sm" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {p.employee.name} {p.employee.id === currentEmployeeId && <span className="text-gray-400 font-normal">(You)</span>}
                        </p>
                        <p className="text-xs text-indigo-500 truncate">{p.employee.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="w-full mt-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Media & Attachments</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {messages.filter(m => m.attachmentUrl).map(m => (
                      <div key={m.id} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative" onClick={() => setFullScreenImage(m.attachmentUrl)}>
                         <Image src={m.attachmentUrl} alt="attachment" fill className="object-cover" />
                      </div>
                    ))}
                    {messages.filter(m => m.attachmentUrl).length === 0 && (
                      <p className="text-xs text-gray-500 col-span-3 text-center py-4">No media shared yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>`;

const regex = /\{\/\* Right Info Pane - Starred Messages \*\/\}[\s\S]*\}\s*<\/div>\s*\)\}\s*<\/div>\s*$/m;
c = c.replace(regex, rightPaneReplacer);

fs.writeFileSync("src/app/chat/ChatClient.tsx", c);
console.log("Patched");

