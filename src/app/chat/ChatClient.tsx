
'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types';
import { getPusherClient } from '@/lib/pusher';
import { getOrCreateDirectConversation, getMessages, sendMessage, setPresenceStatus, markAsRead, toggleReaction, searchMessages } from '@/app/chatActions';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Search, X, Reply, Smile, CheckCheck, Megaphone, Lock, TrendingUp, Users } from 'lucide-react';

type ChatClientProps = {
  currentEmployeeId: string;
  employees: Employee[];
  initialConversations: any[];
  isImpersonating?: boolean;
};

// Utilities for custom avatars
const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getColorFromText = (text: string) => {
  if (!text) return 'bg-gray-500';
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const InitialsAvatar = ({ name, className = "w-8 h-8 text-xs" }: { name: string, className?: string }) => {
  const color = getColorFromText(name);
  return (
    <div className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${color} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

const GroupAvatar = ({ name, className = "w-8 h-8" }: { name: string, className?: string }) => {
  let Icon = Users;
  let color = 'bg-blue-500';
  
  if (name.includes('announcements')) {
    Icon = Megaphone;
    color = 'bg-amber-500';
  } else if (name.includes('hr-private')) {
    Icon = Lock;
    color = 'bg-red-500';
  } else if (name.includes('leadership')) {
    Icon = TrendingUp;
    color = 'bg-indigo-500';
  }

  return (
    <div className={`flex items-center justify-center rounded-full text-white shrink-0 ${color} ${className}`}>
      <Icon size={14} />
    </div>
  );
};

export default function ChatClientSoft({ currentEmployeeId, employees, initialConversations, isImpersonating = false }: ChatClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [presence, setPresence] = useState<Record<string, 'online' | 'away' | 'offline'>>({});
  
  const currentUser = employees.find(e => e.id === currentEmployeeId);
  const isManagerOrHR = currentUser?.role === 'Manager' || currentUser?.role === 'HR';
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const pusher = getPusherClient();
    const globalChannel = pusher.subscribe('presence-global');

    globalChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const p: any = {};
      members.each((member: any) => { p[member.id] = 'online'; });
      setPresence(p);
    });

    globalChannel.bind('pusher:member_added', (member: any) => setPresence(prev => ({ ...prev, [member.id]: 'online' })));
    globalChannel.bind('pusher:member_removed', (member: any) => setPresence(prev => ({ ...prev, [member.id]: 'offline' })));
    globalChannel.bind('user-status-change', (data: any) => setPresence(prev => ({ ...prev, [data.userId]: data.status })));

    let idleTimer: NodeJS.Timeout;
    let isAway = false;
    const resetIdleTimer = () => {
      if (isAway && !isImpersonating) { isAway = false; setPresenceStatus(false).catch(() => {}); }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!isImpersonating) { isAway = true; setPresenceStatus(true).catch(() => {}); }
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();

    return () => {
      pusher.unsubscribe('presence-global');
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      clearTimeout(idleTimer);
    };
  }, [isImpersonating]);

  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    getMessages(activeConversationId, isImpersonating ? currentEmployeeId : undefined).then(data => {
      if (isMounted) {
        setMessages(data);
        if (!isImpersonating) markAsRead(activeConversationId).catch(()=>{});
      }
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-conversation-${activeConversationId}`);
    
    channel.bind('new-message', (data: any) => {
      setMessages(prev => [...prev, data]);
      if (!isImpersonating) markAsRead(activeConversationId).catch(()=>{});
      
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.id === activeConversationId);
        if (idx !== -1) {
          copy[idx].messages = [data];
          copy[idx].updatedAt = new Date().toISOString();
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    });

    channel.bind('reaction-update', (data: any) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          let updatedReactions = [...(m.reactions || [])];
          if (data.added) {
            updatedReactions.push({ emoji: data.emoji, employeeId: data.employeeId });
          } else {
            updatedReactions = updatedReactions.filter(r => !(r.emoji === data.emoji && r.employeeId === data.employeeId));
          }
          return { ...m, reactions: updatedReactions };
        }
        return m;
      }));
    });

    channel.bind('read-receipt', (data: any) => {
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            participants: c.participants.map((p: any) => 
              p.employeeId === data.employeeId ? { ...p, lastReadAt: data.lastReadAt } : p
            )
          };
        }
        return c;
      }));
    });

    return () => {
      isMounted = false;
      pusher.unsubscribe(`private-conversation-${activeConversationId}`);
    };
  }, [activeConversationId, isImpersonating, currentEmployeeId]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const delay = setTimeout(() => {
        setIsSearching(true);
        searchMessages(searchQuery).then(res => {
          setSearchResults(res);
          setIsSearching(false);
        });
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleStartChat = async (employeeId: string) => {
    try {
      const convo = await getOrCreateDirectConversation(employeeId);
      if (!conversations.find(c => c.id === convo.id)) {
        setConversations(prev => [{...convo, messages: []}, ...prev]);
      }
      setActiveConversationId(convo.id);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Cannot start chat.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || isImpersonating) return;

    const text = inputText.trim();
    setInputText('');
    const parentId = replyingTo?.id;
    setReplyingTo(null);
    
    try {
      setLoading(true);
      await sendMessage(activeConversationId, text, parentId);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const activeConvoDetails = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConvoDetails?.type === 'DIRECT' 
    ? activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee 
    : null;

  const getReadReceipts = (messageCreatedAt: string) => {
    if (!activeConvoDetails) return [];
    return activeConvoDetails.participants.filter((p: any) => 
      p.employeeId !== currentEmployeeId && 
      new Date(p.lastReadAt) >= new Date(messageCreatedAt)
    ).map((p: any) => p.employee);
  };

  const EmployeeAvatar = ({ emp, className = "w-8 h-8" }: { emp: Employee, className?: string }) => {
    const stat = presence[emp.id] || 'offline';
    return (
      <div className="relative group shrink-0 mt-1 cursor-pointer z-10">
        <div className={`relative ${className} rounded-full overflow-hidden shrink-0`}>
          {emp.avatarUrl ? (
            <Image src={emp.avatarUrl} alt={emp.name} fill className="object-cover" />
          ) : (
            <InitialsAvatar name={emp.name} className={`w-full h-full ${className.includes('w-10') ? 'text-sm' : 'text-xs'}`} />
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 border-2 border-white dark:border-gray-900 rounded-full ${className.includes('w-10') ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-4 pointer-events-none">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {emp.name}
            {emp.target >= 100000 && <span title="Top Seller" className="text-amber-500">⭐</span>}
            {emp.isProbation && <span title="On Probation" className="text-red-500">⚠️</span>}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">{emp.role}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full min-h-[600px] w-full bg-white/40 dark:bg-gray-900/40 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="w-80 border-r border-white/40 dark:border-gray-700/40 flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-md">
        <div className="p-4 border-b border-white/40 dark:border-gray-700/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 pl-9 pr-4 py-2 rounded-full text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto relative">
          {searchQuery ? (
            <div className="p-4 space-y-4">
              {isSearching ? <p className="text-sm text-gray-500 text-center">Searching...</p> : searchResults.length === 0 ? <p className="text-sm text-gray-500 text-center">No results found.</p> : searchResults.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-gray-800 p-3 rounded-full border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-amber-500" onClick={() => { setSearchQuery(''); setActiveConversationId(msg.conversationId); }}>
                  <p className="text-xs font-bold text-gray-500 mb-1">{msg.sender.name} in {msg.conversation?.name || 'DM'}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              {conversations.map(c => {
                const isGroup = c.type === 'GROUP';
                const other = !isGroup ? c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee : null;
                if (!isGroup && !other) return null;
                
                const displayTitle = isGroup ? c.name : other.name;
                const lastMsg = c.messages?.[0]?.content;
                
                return (
                  <button key={c.id} onClick={() => setActiveConversationId(c.id)} className={`w-full text-left p-4 border-b border-white/40 dark:border-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${activeConversationId === c.id ? 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-inner' : ''}`}>
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <GroupAvatar name={c.name} className="w-10 h-10" />
                      ) : (
                        <>
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            {other.avatarUrl ? (
                              <Image src={other.avatarUrl} alt={displayTitle} fill className="object-cover" />
                            ) : (
                              <InitialsAvatar name={displayTitle} className="w-10 h-10 text-sm" />
                            )}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${(presence[other.id] || 'offline') === 'online' ? 'bg-green-500' : (presence[other.id] || 'offline') === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                        </>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayTitle}</p>
                      {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>}
                    </div>
                  </button>
                )
              })}
              <div className="p-4 pt-6">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Directory</h3>
                <div className="space-y-1">
                  {employees.filter(e => {
                    if (e.id === currentEmployeeId) return false;
                    if (e.role === 'System Bot') return true;
                    if (currentUser?.role === 'Sales Executive') return e.role === 'HR';
                    if (currentUser?.role === 'Manager') return e.role === 'HR';
                    return true;
                  }).map(emp => {
                    const stat = presence[emp.id] || 'offline';
                    return (
                      <button key={emp.id} onClick={() => handleStartChat(emp.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
                        {emp.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
        {activeConversationId ? (
          <>
            <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                {activeConvoDetails?.type === 'GROUP' ? (
                  <GroupAvatar name={activeConvoDetails.name} className="w-8 h-8" />
                ) : otherParticipant ? (
                  <EmployeeAvatar emp={otherParticipant} className="w-8 h-8" />
                ) : null}
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{activeConvoDetails?.type === 'GROUP' ? activeConvoDetails.name : (otherParticipant?.name || 'Chat')}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                const isLastMessage = idx === messages.length - 1;
                const readReceipts = isLastMessage && isMe ? getReadReceipts(msg.createdAt) : [];
                
                const reactionCounts: Record<string, { count: number, me: boolean }> = {};
                msg.reactions?.forEach((r: any) => {
                  if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, me: false };
                  reactionCounts[r.emoji].count++;
                  if (r.employeeId === currentEmployeeId) reactionCounts[r.emoji].me = true;
                });

                return (
                  <div key={msg.id} className={`flex gap-3 group ${isMe ? 'justify-end' : ''}`}>
                    {!isMe && showAvatar && msg.sender ? <EmployeeAvatar emp={msg.sender} /> : (!isMe && <div className="w-8 shrink-0"></div>)}
                    
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                      {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                      
                      {msg.parent && (
                        <div className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-1 text-gray-500 truncate w-full flex items-center gap-1 opacity-70">
                          <Reply size={12} className="shrink-0" /> <span className="truncate">Replying to {msg.parent.sender?.name}: {msg.parent.content}</span>
                        </div>
                      )}
                      
                      <div className="relative flex items-center gap-2 group/msg">
                        {isMe && !isImpersonating && (
                          <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 p-1 absolute right-full mr-2 top-0 z-10">
                            <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Reply size={14}/></button>
                            <button onClick={() => toggleReaction(msg.id, '👍')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Smile size={14}/></button>
                          </div>
                        )}
                        
                        <div className={`px-4 py-2.5 rounded-[1.5rem] prose prose-sm dark:prose-invert break-words max-w-full ${isMe ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-br-md prose-p:text-white prose-a:text-pink-100 shadow-md shadow-pink-200 dark:shadow-none' : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-900 dark:text-gray-100 rounded-bl-md border border-white/50 dark:border-gray-700/50 shadow-sm'}`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {!isMe && !isImpersonating && (
                          <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 p-1 absolute left-full ml-2 top-0 z-10">
                            <button onClick={() => toggleReaction(msg.id, '👍')} className="p-1 hover:bg-gray-100 rounded text-gray-500">👍</button>
                            <button onClick={() => toggleReaction(msg.id, '❤️')} className="p-1 hover:bg-gray-100 rounded text-gray-500">❤️</button>
                            <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Reply size={14}/></button>
                          </div>
                        )}
                      </div>

                      {Object.keys(reactionCounts).length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {Object.entries(reactionCounts).map(([emoji, data]) => (
                            <button 
                              key={emoji}
                              onClick={() => !isImpersonating && toggleReaction(msg.id, emoji)}
                              className={`text-xs px-2 py-0.5 rounded-full border ${data.me ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
                            >
                              {emoji} {data.count}
                            </button>
                          ))}
                        </div>
                      )}

                      {isMe && isLastMessage && readReceipts.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <CheckCheck size={14} className="text-blue-500" />
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
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-white/40 dark:border-gray-700/40 shrink-0 flex flex-col z-20">
              {replyingTo && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-700 text-sm">
                  <span className="text-gray-500 truncate flex-1"><Reply size={14} className="inline mr-1"/> Replying to {replyingTo.sender?.name}</span>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
              )}
              {isImpersonating || (activeConvoDetails?.isReadOnly && !isManagerOrHR) ? (
                <div className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-500 italic text-center text-sm ${replyingTo ? 'rounded-b-xl' : 'rounded-full'}`}>
                  {isImpersonating ? "Sending messages is disabled in God Mode." : "This channel is read-only."}
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message (Supports Markdown)..." 
                    className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 text-gray-900 dark:text-gray-100 ${replyingTo ? 'rounded-b-xl' : 'rounded-full'}`}
                  />
                  <button type="submit" disabled={!inputText.trim() || loading} className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-200 dark:shadow-none transition-all disabled:opacity-50 text-white px-6 rounded-full font-medium transition-colors">Send</button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4"><span className="text-2xl">💬</span></div>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
