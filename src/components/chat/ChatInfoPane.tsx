import { useState } from 'react';
import {
  X,
  Users,
  Paperclip,
  TrendingUp,
  Star,
  Trash,
  AtSign,
  MessageSquare,
  Send,
  Smile,
} from 'lucide-react';
import Image from 'next/image';
import { EmployeeAvatar, InitialsAvatar } from './ChatAvatars';
import { clearChatHistory, sendMessage } from '@/app/chatActions';
import { RightPaneMode } from '@/app/chat/ChatClient';
import { toast } from 'sonner';

type ChatInfoPaneProps = {
  rightPaneMode: RightPaneMode;
  setRightPaneMode: (mode: RightPaneMode) => void;
  activeConversationId: string | null;
  activeConvoDetails: any;
  otherParticipant: any;
  currentEmployeeId: string;
  infoTab: 'media' | 'links' | 'docs';
  setInfoTab: (tab: 'media' | 'links' | 'docs') => void;
  messages: any[];
  setFullScreenImage: (url: string | null) => void;
  starredMessages: any[];
  mentionsData: { mentions: any[]; reactions: any[] };
  activeThreadMessage: any | null;
  setActiveConversationId: (id: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  presence: Record<string, string>;
  isImpersonating?: boolean;
};

function cleanTokens(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[ACTION:(EXPENSE|DEMO|TRIAL):[^\]]+\]/g, '')
    .replace(/\[LEAD:[^\]]+\]/g, '')
    .trim();
}

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
  mentionsData,
  activeThreadMessage,
  setActiveConversationId,
  setMessages,
  presence,
  isImpersonating = false,
}: ChatInfoPaneProps) => {
  const [threadInput, setThreadInput] = useState('');
  const [sendingThreadReply, setSendingThreadReply] = useState(false);

  if (rightPaneMode === 'hidden') return null;

  const handleExportChat = () => {
    const transcript = messages
      .map((m) => `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.name}: ${m.content}`)
      .join('\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat_Export_${activeConversationId}.txt`;
    a.click();
    toast.success('Chat exported successfully.');
  };

  const handleClearHistory = async () => {
    if (
      confirm('Are you sure you want to clear your local chat history? This cannot be undone.')
    ) {
      await clearChatHistory(activeConversationId!);
      setMessages([]);
      toast.success('Chat history cleared.');
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || !activeConversationId || !activeThreadMessage || isImpersonating)
      return;

    const text = threadInput.trim();
    setThreadInput('');
    try {
      setSendingThreadReply(true);
      await sendMessage(activeConversationId, text, activeThreadMessage.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send thread reply');
    } finally {
      setSendingThreadReply(false);
    }
  };

  const threadReplies = activeThreadMessage
    ? messages.filter((m) => m.parentId === activeThreadMessage.id && !m.isDeleted)
    : [];

  return (
    <div className="w-80 md:w-96 border-l border-white/40 dark:border-gray-700/40 flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-md shrink-0">
      {/* 1. SLACK THREAD DRAWER (FEATURE 3) */}
      {rightPaneMode === 'thread' && (
        <>
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md sticky top-0 shrink-0">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-500" /> Thread
              </h3>
              <p className="text-[10px] text-gray-500">
                {activeConvoDetails?.type === 'GROUP'
                  ? activeConvoDetails.name
                  : otherParticipant?.name || 'Direct Message'}
              </p>
            </div>
            <button
              onClick={() => setRightPaneMode('hidden')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {!activeThreadMessage ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-gray-500">
              Select a message to view its thread.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Parent Message */}
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <EmployeeAvatar
                      emp={activeThreadMessage.sender}
                      presence={presence}
                      className="w-7 h-7"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate">
                        {activeThreadMessage.sender?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(activeThreadMessage.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {cleanTokens(activeThreadMessage.content)}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                  <span>
                    {threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>

                {/* Replies */}
                {threadReplies.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No replies yet. Start the thread below!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {threadReplies.map((rep) => (
                      <div
                        key={rep.id}
                        className="bg-gray-50/90 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <EmployeeAvatar
                            emp={rep.sender}
                            presence={presence}
                            className="w-6 h-6"
                          />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {rep.sender?.name}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {new Date(rep.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-8">
                          {cleanTokens(rep.content)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isImpersonating && (
                <form
                  onSubmit={handleSendThreadReply}
                  className="p-3 border-t border-white/40 dark:border-gray-700/40 bg-white/80 dark:bg-gray-900/80 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={threadInput}
                    onChange={(e) => setThreadInput(e.target.value)}
                    placeholder="Reply in thread..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!threadInput.trim() || sendingThreadReply}
                    className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </>
          )}
        </>
      )}

      {/* 2. MENTIONS & REACTIONS INBOX (FEATURE 1) */}
      {rightPaneMode === 'mentions' && (
        <>
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AtSign size={16} className="text-amber-500" /> Mentions &amp; Reactions
            </h3>
            <button
              onClick={() => setRightPaneMode('hidden')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                @Mentions &amp; Thread Replies ({mentionsData.mentions.length})
              </h4>
              {mentionsData.mentions.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">No recent @mentions or replies.</p>
              ) : (
                <div className="space-y-2.5">
                  {mentionsData.mentions.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setActiveConversationId(msg.conversationId);
                      }}
                      className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/50 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {msg.sender?.name}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 truncate max-w-[120px]">
                          {msg.conversation?.name || 'Direct Message'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                        {cleanTokens(msg.content)}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(msg.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                <Smile size={12} /> Reactions to Your Messages ({mentionsData.reactions.length})
              </h4>
              {mentionsData.reactions.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">No reactions to your messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {mentionsData.reactions.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (r.message?.conversationId) {
                          setActiveConversationId(r.message.conversationId);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-base">{r.emoji}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {r.employee?.name}
                        </span>
                        <span className="text-gray-400 text-[10px] ml-auto">
                          {r.message?.conversation?.name || 'DM'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-1">
                        “{cleanTokens(r.message?.content || '')}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. STARRED MESSAGES */}
      {rightPaneMode === 'starred' && (
        <>
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star size={16} className="text-purple-500" /> Starred Messages
            </h3>
            <button
              onClick={() => setRightPaneMode('hidden')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {starredMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-10">No starred messages yet.</p>
            ) : (
              starredMessages.map((item) => {
                const msg = item.message || item;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => {
                      if (msg.conversationId) setActiveConversationId(msg.conversationId);
                      setRightPaneMode('hidden');
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {msg.sender && (
                        <EmployeeAvatar emp={msg.sender} presence={presence} className="w-6 h-6" />
                      )}
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {msg.sender?.name}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm max-w-full line-clamp-3">
                      {msg.isDeleted ? '🚫 This message was deleted' : cleanTokens(msg.content)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 4. CHAT INFO PANE */}
      {rightPaneMode === 'info' && (
        <>
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users size={16} className="text-purple-500" /> Chat Info
            </h3>
            <button
              onClick={() => setRightPaneMode('hidden')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-purple-500/20 shrink-0 overflow-hidden">
              {otherParticipant?.avatarUrl ? (
                <Image
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <InitialsAvatar
                  name={activeConvoDetails?.name || otherParticipant?.name || '?'}
                  className="w-full h-full text-2xl"
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
              {activeConvoDetails?.name || otherParticipant?.name}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {activeConvoDetails?.participants?.length || 0} Participants
            </p>

            <div className="w-full space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Participants
              </h4>
              {activeConvoDetails?.participants?.map((p: any) => {
                if (!p.employee) return null;
                const pStatus = (p.employee.customFields as any)?.chatStatus as
                  | { emoji: string; text: string }
                  | undefined;
                return (
                  <div
                    key={p.employeeId}
                    className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group"
                  >
                    <EmployeeAvatar emp={p.employee} presence={presence} className="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                        {p.employee.name}{' '}
                        {p.employee.id === currentEmployeeId && (
                          <span className="text-gray-400 font-normal">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-indigo-500 truncate">
                        {p.employee.role}
                        {pStatus ? ` • ${pStatus.emoji} ${pStatus.text}` : ''}
                      </p>
                    </div>
                    <a
                      href={
                        p.employee.id === currentEmployeeId
                          ? '/team'
                          : `/team/impersonate/${p.employee.id}`
                      }
                      title="View Profile"
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 hover:text-purple-600 rounded-full text-gray-500 transition-all shrink-0"
                    >
                      <Users size={14} />
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="w-full mt-8">
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  onClick={() => setInfoTab('media')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${
                    infoTab === 'media'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Media
                </button>
                <button
                  onClick={() => setInfoTab('docs')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${
                    infoTab === 'docs'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Docs
                </button>
                <button
                  onClick={() => setInfoTab('links')}
                  className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider flex-1 transition-colors ${
                    infoTab === 'links'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Links
                </button>
              </div>

              {infoTab === 'media' && (
                <div className="grid grid-cols-3 gap-2">
                  {messages
                    .filter((m) => m.attachmentUrl && !m.attachmentUrl.endsWith('.pdf'))
                    .map((m) => (
                      <div
                        key={m.id}
                        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setFullScreenImage(m.attachmentUrl)}
                      >
                        <Image
                          src={m.attachmentUrl}
                          alt="attachment"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  {messages.filter((m) => m.attachmentUrl && !m.attachmentUrl.endsWith('.pdf'))
                    .length === 0 && (
                    <p className="text-xs text-gray-500 col-span-3 text-center py-4">
                      No media shared yet.
                    </p>
                  )}
                </div>
              )}

              {infoTab === 'docs' && (
                <div className="flex flex-col gap-2">
                  {messages
                    .filter((m) => m.attachmentUrl && m.attachmentUrl.endsWith('.pdf'))
                    .map((m) => (
                      <a
                        key={m.id}
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 hover:border-purple-400 border border-transparent transition-colors"
                      >
                        <div className="p-2 bg-red-100 text-red-500 rounded-lg">
                          <Paperclip size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            Document
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </a>
                    ))}
                  {messages.filter((m) => m.attachmentUrl && m.attachmentUrl.endsWith('.pdf'))
                    .length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No documents shared yet.
                    </p>
                  )}
                </div>
              )}

              {infoTab === 'links' && (
                <div className="flex flex-col gap-2">
                  {messages
                    .filter((m) => (m.linkMetadata as any)?.url)
                    .map((m) => {
                      const meta = m.linkMetadata as any;
                      return (
                        <a
                          key={m.id}
                          href={meta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 hover:border-purple-400 border border-transparent transition-colors"
                        >
                          <div className="p-2 bg-blue-100 text-blue-500 rounded-lg">
                            <TrendingUp size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {meta.title || meta.url}
                            </p>
                            <p className="text-xs text-blue-500 truncate">{meta.url}</p>
                          </div>
                        </a>
                      );
                    })}
                  {messages.filter((m) => (m.linkMetadata as any)?.url).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No links shared yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="w-full mt-10 space-y-2">
              <button
                onClick={handleExportChat}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
              >
                <TrendingUp size={16} /> Export Chat History
              </button>
              <button
                onClick={handleClearHistory}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium text-sm transition-colors"
              >
                <Trash size={16} /> Clear Chat History
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
