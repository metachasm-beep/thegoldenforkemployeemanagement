import { X, Users, Paperclip, TrendingUp, Star, Trash } from 'lucide-react';
import Image from 'next/image';
import { EmployeeAvatar, InitialsAvatar } from './ChatAvatars';
import { clearChatHistory } from '@/app/chatActions';
import { toast } from 'sonner';

type ChatInfoPaneProps = {
  rightPaneMode: "hidden" | "starred" | "info";
  setRightPaneMode: (mode: "hidden" | "starred" | "info") => void;
  activeConversationId: string | null;
  activeConvoDetails: any;
  otherParticipant: any;
  currentEmployeeId: string;
  infoTab: "media" | "links" | "docs";
  setInfoTab: (tab: "media" | "links" | "docs") => void;
  messages: any[];
  setFullScreenImage: (url: string | null) => void;
  starredMessages: any[];
  setActiveConversationId: (id: string) => void;
  setMessages: (messages: any[]) => void;
  presence: Record<string, string>;
};

export const ChatInfoPane = ({
  rightPaneMode,
  setRightPaneMode,
  activeConversationId,
  activeConvoDetails,
  otherParticipant,
  currentEmployeeId,
  infoTab,
  setInfoTab,
  messages,
  setFullScreenImage,
  starredMessages,
  setActiveConversationId,
  setMessages,
  presence,
}: ChatInfoPaneProps) => {
  if (rightPaneMode === "hidden") return null;

  const handleExportChat = () => {
    const transcript = messages.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.name}: ${m.content}`).join("\n");
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_Export_${activeConversationId}.txt`;
    a.click();
    toast.success("Chat exported successfully.");
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your local chat history? This cannot be undone.")) {
      await clearChatHistory(activeConversationId!);
      setMessages([]);
      toast.success("Chat history cleared.");
    }
  };

  return (
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
                    <EmployeeAvatar emp={msg.sender} presence={presence} className="w-6 h-6" />
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
              {otherParticipant?.avatarUrl ? (
                 <Image src={otherParticipant.avatarUrl} alt={otherParticipant.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                 <InitialsAvatar name={activeConvoDetails?.name || otherParticipant?.name || "?"} className="w-full h-full text-2xl" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
              {activeConvoDetails?.name || otherParticipant?.name}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{activeConvoDetails?.participants.length} Participants</p>
            
            <div className="w-full space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Participants</h4>
              {activeConvoDetails?.participants.map((p: any) => (
                <div key={p.employeeId} className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group">
                  <EmployeeAvatar emp={p.employee} presence={presence} className="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                      {p.employee.name} {p.employee.id === currentEmployeeId && <span className="text-gray-400 font-normal">(You)</span>}
                    </p>
                    <p className="text-xs text-indigo-500 truncate">{p.employee.role}</p>
                  </div>
                  <a href={p.employee.id === currentEmployeeId ? "/team" : `/team/impersonate/${p.employee.id}`} title="View Profile" className="opacity-0 group-hover:opacity-100 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 hover:text-purple-600 rounded-full text-gray-500 transition-all shrink-0">
                    <Users size={14} />
                  </a>
                </div>
              ))}
            </div>
            
            <div className="w-full mt-8">
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => setInfoTab("media")} className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${infoTab === "media" ? "text-purple-500 border-b-2 border-purple-500" : "text-gray-400 hover:text-gray-600"}`}>Media</button>
                <button onClick={() => setInfoTab("docs")} className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${infoTab === "docs" ? "text-purple-500 border-b-2 border-purple-500" : "text-gray-400 hover:text-gray-600"}`}>Docs</button>
                <button onClick={() => setInfoTab("links")} className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${infoTab === "links" ? "text-purple-500 border-b-2 border-purple-500" : "text-gray-400 hover:text-gray-600"}`}>Links</button>
              </div>
              
              {infoTab === "media" && (
                <div className="grid grid-cols-3 gap-2">
                  {messages.filter(m => m.attachmentUrl && !m.attachmentUrl.endsWith('.pdf')).map(m => (
                    <div key={m.id} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative" onClick={() => setFullScreenImage(m.attachmentUrl)}>
                       <Image src={m.attachmentUrl} alt="attachment" fill className="object-cover" />
                    </div>
                  ))}
                  {messages.filter(m => m.attachmentUrl && !m.attachmentUrl.endsWith('.pdf')).length === 0 && (
                    <p className="text-xs text-gray-500 col-span-3 text-center py-4">No media shared yet.</p>
                  )}
                </div>
              )}

              {infoTab === "docs" && (
                <div className="flex flex-col gap-2">
                  {messages.filter(m => m.attachmentUrl && m.attachmentUrl.endsWith('.pdf')).map(m => (
                    <a key={m.id} href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 hover:border-purple-400 border border-transparent transition-colors">
                      <div className="p-2 bg-red-100 text-red-500 rounded-lg"><Paperclip size={16}/></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Document</p>
                        <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                    </a>
                  ))}
                  {messages.filter(m => m.attachmentUrl && m.attachmentUrl.endsWith('.pdf')).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No documents shared yet.</p>
                  )}
                </div>
              )}

              {infoTab === "links" && (
                <div className="flex flex-col gap-2">
                  {messages.filter(m => m.linkMetadata).map(m => {
                    const meta = m.linkMetadata as any;
                    return (
                      <a key={m.id} href={meta.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 hover:border-purple-400 border border-transparent transition-colors">
                        <div className="p-2 bg-blue-100 text-blue-500 rounded-lg"><TrendingUp size={16}/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{meta.title || meta.url}</p>
                          <p className="text-xs text-blue-500 truncate">{meta.url}</p>
                        </div>
                      </a>
                    )
                  })}
                  {messages.filter(m => m.linkMetadata).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No links shared yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="w-full mt-10 space-y-2">
              <button onClick={handleExportChat} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors">
                <TrendingUp size={16} /> Export Chat History
              </button>
              <button onClick={handleClearHistory} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium text-sm transition-colors">
                <Trash size={16} /> Clear Chat History
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
