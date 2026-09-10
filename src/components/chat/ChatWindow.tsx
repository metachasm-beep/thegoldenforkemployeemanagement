import { useState, useRef, useEffect } from 'react';
import { Search, X, Star, Check, CheckCheck, Smile, Reply, Edit, Trash, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import ReactMarkdown from 'react-markdown';
import { EmployeeAvatar, GroupAvatar } from './ChatAvatars';
import { toggleReaction, toggleStarMessage, deleteMessage, editMessage, sendMessage } from '@/app/chatActions';
import { toast } from 'sonner';
import { formatDistanceToNow } from "date-fns";

type ChatWindowProps = {
  activeConversationId: string | null;
  activeConvoDetails: any;
  otherParticipant: any;
  rightPaneMode: "hidden" | "starred" | "info";
  setRightPaneMode: (mode: "hidden" | "starred" | "info") => void;
  activeChatSearchQuery: string;
  setActiveChatSearchQuery: (val: string) => void;
  loading: boolean;
  filteredMessages: any[];
  currentEmployeeId: string;
  presence: Record<string, string>;
  isImpersonating: boolean;
  isManagerOrHR: boolean;
  setFullScreenImage: (url: string | null) => void;
  LeadCard: (props: { id: string }) => React.JSX.Element;
  MarkdownComponents: any;
};

export const ChatWindow = ({
  activeConversationId,
  activeConvoDetails,
  otherParticipant,
  rightPaneMode,
  setRightPaneMode,
  activeChatSearchQuery,
  setActiveChatSearchQuery,
  loading,
  filteredMessages,
  currentEmployeeId,
  presence,
  isImpersonating,
  isManagerOrHR,
  setFullScreenImage,
  LeadCard,
  MarkdownComponents
}: ChatWindowProps) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  useEffect(() => {
    if (rowVirtualizer.getTotalSize() > 0 && filteredMessages.length > 0) {
      rowVirtualizer.scrollToIndex(filteredMessages.length - 1, { align: 'end' });
    }
  }, [filteredMessages.length, activeConversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachmentUrl) || !activeConversationId || isImpersonating) return;

    if (editingId) {
      try {
        setIsSending(true);
        await editMessage(editingId, inputText.trim());
        setEditingId(null);
        setInputText('');
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const text = inputText.trim();
    const currentAttachment = attachmentUrl;
    setInputText('');
    setAttachmentUrl(null);
    const parentId = replyingTo?.id;
    setReplyingTo(null);
    
    try {
      setIsSending(true);
      await sendMessage(activeConversationId, text, parentId, currentAttachment || undefined);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast('Uploading file...', { id: 'upload-toast' });

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const blob = await response.json();
      setAttachmentUrl(blob.url);
      toast.success('Upload complete!', { id: 'upload-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload file.', { id: 'upload-toast' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessageStatus = (msg: any) => {
    if (msg.senderId !== currentEmployeeId) return null;
    let status = 'sent';
    const participants = activeConvoDetails?.participants || [];
    const others = participants.filter((p: any) => p.employeeId !== currentEmployeeId);
    
    const read = others.some((p: any) => p.lastReadAt && new Date(p.lastReadAt) >= new Date(msg.createdAt));
    const delivered = others.some((p: any) => p.lastDeliveredAt && new Date(p.lastDeliveredAt) >= new Date(msg.createdAt));
    
    if (read) status = 'read';
    else if (delivered) status = 'delivered';

    if (status === 'read') return <CheckCheck size={14} className="text-blue-500 ml-1 inline-block" />;
    if (status === 'delivered') return <CheckCheck size={14} className="text-gray-400 ml-1 inline-block" />;
    return <Check size={14} className="text-gray-400 ml-1 inline-block" />;
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-900">
        <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4"><span className="text-2xl">💬</span></div>
        <p className="font-medium">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
      <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 p-2 rounded-xl transition-colors" onClick={() => setRightPaneMode("info")}>
          {activeConvoDetails?.type === 'GROUP' ? (
            <GroupAvatar name={activeConvoDetails.name} className="w-8 h-8" />
          ) : otherParticipant ? (
            <EmployeeAvatar emp={otherParticipant} presence={presence} className="w-8 h-8" />
          ) : null}
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{activeConvoDetails?.type === 'GROUP' ? activeConvoDetails.name : (otherParticipant?.name || 'Chat')}</h3>
            {activeConvoDetails?.type === 'DIRECT' && otherParticipant && (
              <span className="text-xs text-gray-500 font-medium">
                {presence[otherParticipant.id] === 'online' 
                  ? <span className="text-emerald-500">Online</span> 
                  : otherParticipant.lastSeenAt 
                    ? `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastSeenAt), { addSuffix: true })}` 
                    : 'Offline'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search in chat..."
              value={activeChatSearchQuery}
              onChange={(e) => setActiveChatSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-full focus:ring-2 focus:ring-purple-400"
            />
            {activeChatSearchQuery && (
              <button onClick={() => setActiveChatSearchQuery('')} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"><X size={14}/></button>
            )}
          </div>
          <button onClick={() => setRightPaneMode(rightPaneMode === "starred" ? "hidden" : "starred")} className={`p-2 rounded-full transition-colors ${rightPaneMode === "starred" ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Star size={18} className={rightPaneMode === "starred" ? "fill-purple-500" : ""} />
          </button>
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10 relative custom-scrollbar">
        {loading && filteredMessages.length === 0 ? (
          <div className="space-y-6 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0"></div>}
                <div className={`w-64 h-16 rounded-[1.5rem] animate-pulse ${i % 2 === 0 ? 'bg-purple-200 dark:bg-purple-900/40 rounded-br-md' : 'bg-gray-200 dark:bg-gray-800/60 rounded-bl-md'}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            <AnimatePresence initial={false}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = filteredMessages[virtualRow.index];
                if (!msg) return null;
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = virtualRow.index === 0 || filteredMessages[virtualRow.index - 1]?.senderId !== msg.senderId;
                const reactionCounts: Record<string, { count: number, me: boolean }> = {};
                msg.reactions?.forEach((r: any) => {
                  if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, me: false };
                  reactionCounts[r.emoji].count++;
                  if (r.employeeId === currentEmployeeId) reactionCounts[r.emoji].me = true;
                });

                const isDeleted = msg.isDeleted;

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
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    className={`flex gap-3 group pb-6 ${isMe ? 'justify-end' : ''}`}
                  >
                    {!isMe && showAvatar && msg.sender ? <EmployeeAvatar emp={msg.sender} presence={presence} /> : (!isMe && <div className="w-8 shrink-0"></div>)}
                    
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                      {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                      
                      {msg.parent && !isDeleted && (
                        <div className={`text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-1 text-gray-500 truncate w-full flex items-center gap-1 opacity-70`}>
                          <Reply size={12} className="shrink-0" /> <span className="truncate">Replying to {msg.parent.sender?.name}: {msg.parent.content}</span>
                        </div>
                      )}
                      
                      <div className="relative flex items-center gap-2 group/msg">
                        {!isImpersonating && !isDeleted && (
                          <motion.div className={`opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-1 absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 z-10`}>
                            {!isMe && <button onClick={() => toggleReaction(msg.id, '👍')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Smile size={14}/></button>}
                            <button onClick={() => setReplyingTo(msg)} title="Reply" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Reply size={14}/></button>
                            <button onClick={() => toggleStarMessage(msg.id)} title="Star" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Star size={14}/></button>
                            {isMe && (
                              <>
                                <button onClick={() => { setEditingId(msg.id); setInputText(msg.content); setAttachmentUrl(msg.attachmentUrl || null); }} title="Edit" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Edit size={14}/></button>
                                <button onClick={() => deleteMessage(msg.id)} title="Delete" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg"><Trash size={14}/></button>
                              </>
                            )}
                          </motion.div>
                        )}
                        
                        <div className={`px-5 py-3 rounded-[1.5rem] prose prose-sm dark:prose-invert break-words max-w-full shadow-sm flex flex-col ${
                          isDeleted ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 italic rounded-b-md' :
                          isMe ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-br-md prose-p:text-white prose-a:text-pink-100' 
                          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-gray-100 rounded-bl-md border border-white/50 dark:border-gray-700/50'
                        }`}>
                          {isDeleted ? (
                            <div className="flex items-center gap-2"><Trash size={14}/> <span>🚫 This message was deleted</span></div>
                          ) : (
                            <>
                              {msg.attachmentUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment" 
                                  className="w-full max-w-xs rounded-lg mb-2 cursor-pointer object-cover max-h-60"
                                  onClick={() => setFullScreenImage(msg.attachmentUrl)}
                                />
                              )}
                              <ReactMarkdown components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                              {msg.linkMetadata && (
                                <a href={msg.linkMetadata.url} target="_blank" rel="noreferrer" className="mt-2 block bg-black/10 dark:bg-black/30 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 hover:bg-black/20 transition-colors no-underline">
                                  {msg.linkMetadata.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={msg.linkMetadata.image} alt="Preview" className="w-full h-32 object-cover" />
                                  )}
                                  <div className="p-3">
                                    <div className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{msg.linkMetadata.title}</div>
                                    <div className={`text-xs truncate opacity-70 ${isMe ? 'text-white' : 'text-gray-500'}`}>{msg.linkMetadata.description}</div>
                                  </div>
                                </a>
                              )}
                            </>
                          )}
                          <div className="text-[10px] opacity-60 flex justify-end items-center mt-1 gap-1 w-full text-right">
                            {msg.isEdited && !isDeleted && <span>(Edited)</span>}
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && !isDeleted && renderMessageStatus(msg)}
                          </div>
                        </div>
                      </div>

                      {Object.keys(reactionCounts).length > 0 && !isDeleted && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {Object.entries(reactionCounts).map(([emoji, data]: [string, any]) => (
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              key={emoji}
                              onClick={() => !isImpersonating && toggleReaction(msg.id, emoji)}
                              className={`text-xs px-2.5 py-1 rounded-full border ${data.me ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'bg-white/50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300'}`}
                            >
                              {emoji} {data.count}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-900 border-t border-white/40 dark:border-gray-700/40 shrink-0 flex flex-col z-20">
        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-700 text-sm">
            <span className="text-gray-500 truncate flex-1"><Reply size={14} className="inline mr-1"/> Replying to {replyingTo.sender?.name}: {replyingTo.content}</span>
            <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
        )}
        {editingId && (
          <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/30 p-2 rounded-t-xl border-x border-t border-purple-200 dark:border-purple-800 text-sm">
            <span className="text-purple-600 dark:text-purple-400 truncate flex-1"><Edit size={14} className="inline mr-1"/> Editing message...</span>
            <button onClick={() => { setEditingId(null); setInputText(''); setAttachmentUrl(null); }} className="text-purple-400 hover:text-purple-600"><X size={16}/></button>
          </div>
        )}
        {attachmentUrl && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 border-x border-t border-gray-200 dark:border-gray-700 text-sm">
            <span className="text-gray-500 truncate flex-1"><Paperclip size={14} className="inline mr-1"/> Image attached: {attachmentUrl}</span>
            <button onClick={() => setAttachmentUrl(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
        )}
        
        {isImpersonating || (activeConvoDetails?.isReadOnly && !isManagerOrHR) ? (
          <div className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-500 italic text-center text-sm ${(replyingTo || editingId || attachmentUrl) ? 'rounded-b-xl' : 'rounded-full'}`}>
            {isImpersonating ? "Sending messages is disabled in God Mode." : "This channel is read-only."}
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            <button type="button" onClick={handleAttach} disabled={isUploading} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors disabled:opacity-50">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={editingId ? "Edit message..." : "Type a message (Supports Markdown)..."} 
              className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 text-gray-900 dark:text-gray-100 ${(replyingTo || editingId || attachmentUrl) ? 'rounded-b-xl' : 'rounded-full'}`}
            />
            <button type="submit" disabled={(!inputText.trim() && !attachmentUrl) || isSending} className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-200 dark:shadow-none transition-all disabled:opacity-50 text-white px-6 rounded-full font-medium transition-colors">
              {editingId ? 'Save' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
