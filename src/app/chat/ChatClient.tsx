'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types';
import { getPusherClient } from '@/lib/pusher';
import { useChatSync } from '@/hooks/useChatSync';
import { 
  getOrCreateDirectConversation, 
  getMessages, 
  sendMessage, 
  setPresenceStatus, 
  markAsRead, 
  toggleReaction, 
  searchMessages,
  deleteMessage,
  editMessage,
  togglePinConversation,
  toggleArchiveConversation,
  toggleStarMessage,
  getStarredMessages
} from '@/app/chatActions';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { 
  Search, X, Reply, Smile, Check, CheckCheck, Megaphone, Lock, TrendingUp, Users, Target, 
  Trash, Edit, Pin, Archive, Star, Paperclip, MoreVertical, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

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


const LeadCard = ({ id }: { id: string }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="bg-white/90 dark:bg-gray-800/90 border border-purple-200 dark:border-purple-900 rounded-2xl p-4 my-2 flex items-center gap-4 backdrop-blur-md shadow-sm cursor-pointer w-full max-w-sm">
    <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
      <Target size={24} />
    </div>
    <div className="overflow-hidden">
      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">Lead Ref: {id}</div>
      <div className="text-xs text-gray-500 truncate">Click to view details in CRM</div>
    </div>
  </motion.div>
);

const MarkdownComponents: any = {
  p: ({ children }: any) => {
    if (typeof children === 'string' && children.trim().startsWith('[LEAD:') && children.trim().endsWith(']')) {
      const leadId = children.replace('[LEAD:', '').replace(']', '');
      return <LeadCard id={leadId} />;
    }
    return <p className="mb-2 last:mb-0 leading-relaxed tracking-tight">{children}</p>;
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'json') {
      try {
        const data = JSON.parse(String(children).replace(/\n$/, ''));
        if (data.type === 'chart') {
          return (
            <div className="h-48 w-full bg-white dark:bg-gray-950 p-4 rounded-2xl my-3 border border-gray-100 dark:border-gray-800 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.data}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Bar dataKey="value" fill="#c084fc" radius={[4,4,4,4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
      } catch (e) {}
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

export default function ChatClientSoft({ currentEmployeeId, employees, initialConversations, isImpersonating = false }: ChatClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showStarredPane, setShowStarredPane] = useState(false);
  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [activeChatSearchQuery, setActiveChatSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const { messages, setMessages, presence, loading } = useChatSync(
    currentEmployeeId, 
    activeConversationId, 
    isImpersonating, 
    setConversations
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  
  const filteredMessages = messages.filter(m => 
    !activeChatSearchQuery || m.content?.toLowerCase().includes(activeChatSearchQuery.toLowerCase())
  );
  
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
  
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentUser = employees.find(e => e.id === currentEmployeeId);
  const isManagerOrHR = currentUser?.role === 'Manager' || currentUser?.role === 'HR';
  
  useEffect(() => {
    if (showStarredPane) {
      getStarredMessages().then(res => setStarredMessages(res));
    }
  }, [showStarredPane, messages]);

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

  const activeConvoDetails = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConvoDetails?.type === 'DIRECT' 
    ? activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee 
    : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
  
  const getParticipantMe = (convo: any) => convo?.participants?.find((p: any) => p.employeeId === currentEmployeeId);
  
  const sortedConversations = [...conversations].sort((a, b) => {
    const pA = getParticipantMe(a);
    const pB = getParticipantMe(b);
    if (pA?.isPinned && !pB?.isPinned) return -1;
    if (!pA?.isPinned && pB?.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const visibleConversations = sortedConversations.filter(c => {
    const p = getParticipantMe(c);
    if (showArchived) return p?.isArchived;
    if (p?.isArchived) return false;
    if (showUnreadOnly && (!p?.unreadCount || p.unreadCount === 0)) return false;
    return true;
  });

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

  return (
    <div className="flex flex-1 h-full min-h-[600px] w-full bg-white/40 dark:bg-gray-900/40 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
          <div className="relative w-full max-w-4xl h-full max-h-[80vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullScreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
            <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70" onClick={() => setFullScreenImage(null)}><X size={24}/></button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 border-r border-white/40 dark:border-gray-700/40 flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-md">
        <div className="p-4 border-b border-white/40 dark:border-gray-700/40">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 pl-9 pr-4 py-2 rounded-full text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => { setShowArchived(false); setShowUnreadOnly(!showUnreadOnly); }} 
              className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${showUnreadOnly && !showArchived ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Filter Unread
            </button>
            <button 
              onClick={() => { setShowArchived(!showArchived); setShowUnreadOnly(false); }} 
              className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${showArchived ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Archived
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto relative">
          {searchQuery ? (
            <div className="p-4 space-y-4">
              {isSearching ? <p className="text-sm text-gray-500 text-center">Searching...</p> : searchResults.length === 0 ? <p className="text-sm text-gray-500 text-center">No results found.</p> : searchResults.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-purple-400" onClick={() => { setSearchQuery(''); setActiveConversationId(msg.conversationId); }}>
                  <p className="text-xs font-bold text-gray-500 mb-1">{msg.sender.name} in {msg.conversation?.name || 'DM'}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              {visibleConversations.map(c => {
                const isGroup = c.type === 'GROUP';
                const other = !isGroup ? c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee : null;
                const me = getParticipantMe(c);
                if (!isGroup && !other) return null;
                
                const displayTitle = isGroup ? c.name : other.name;
                const lastMsg = c.messages?.[0]?.content;
                
                return (
                  <div key={c.id} className="relative group">
                    <button onClick={() => setActiveConversationId(c.id)} className={`w-full text-left p-4 pr-12 border-b border-white/40 dark:border-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${activeConversationId === c.id ? 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-inner' : ''}`}>
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
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayTitle}</p>
                          {me?.isPinned && <Pin size={12} className="text-gray-400 shrink-0" />}
                        </div>
                        {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>}
                      </div>
                      {me?.unreadCount > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {me.unreadCount}
                        </div>
                      )}
                    </button>
                    {/* Hover actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePinConversation(c.id, !me?.isPinned); }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500"
                        title={me?.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin size={14} className={me?.isPinned ? "fill-gray-500" : ""} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleArchiveConversation(c.id, !me?.isArchived); }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500"
                        title={me?.isArchived ? "Unarchive" : "Archive"}
                      >
                        <Archive size={14} className={me?.isArchived ? "fill-gray-500" : ""} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {!showArchived && (
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
        {activeConversationId ? (
          <>
            <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                {activeConvoDetails?.type === 'GROUP' ? (
                  <GroupAvatar name={activeConvoDetails.name} className="w-8 h-8" />
                ) : otherParticipant ? (
                  <EmployeeAvatar emp={otherParticipant} className="w-8 h-8" />
                ) : null}
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{activeConvoDetails?.type === 'GROUP' ? activeConvoDetails.name : (otherParticipant?.name || 'Chat')}</h3>
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
                <button onClick={() => setShowStarredPane(!showStarredPane)} className={`p-2 rounded-full transition-colors ${showStarredPane ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Star size={18} className={showStarredPane ? "fill-purple-500" : ""} />
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
                          {!isMe && showAvatar && msg.sender ? <EmployeeAvatar emp={msg.sender} /> : (!isMe && <div className="w-8 shrink-0"></div>)}
                          
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                            {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                            
                            {msg.parent && !isDeleted && (
                              <div className={`text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-1 text-gray-500 truncate w-full flex items-center gap-1 opacity-70`}>
                                <Reply size={12} className="shrink-0" /> <span className="truncate">Replying to {msg.parent.sender?.name}: {msg.parent.content}</span>
                              </div>
                            )}
                            
                            <div className="relative flex items-center gap-2 group/msg">
                              {/* Message Dropdown Actions */}
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
                  <button type="submit" disabled={(!inputText.trim() && !attachmentUrl) || loading} className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-200 dark:shadow-none transition-all disabled:opacity-50 text-white px-6 rounded-full font-medium transition-colors">
                    {editingId ? 'Save' : 'Send'}
                  </button>
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
      
      {/* Right Info Pane - Starred Messages */}
      {showStarredPane && (
        <div className="w-80 border-l border-white/40 dark:border-gray-700/40 flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-md">
          <div className="h-16 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star size={16} className="text-purple-500" /> Starred Messages
            </h3>
            <button onClick={() => setShowStarredPane(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {starredMessages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-10">No starred messages yet.</p>
            ) : (
              starredMessages.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-purple-400 transition-colors" onClick={() => { setActiveConversationId(msg.conversationId); setShowStarredPane(false); }}>
                  <div className="flex items-center gap-2 mb-2">
                    <EmployeeAvatar emp={msg.sender} className="w-6 h-6" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{msg.sender?.name}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm max-w-full">
                    {msg.isDeleted ? '🚫 This message was deleted' : msg.content}
                  </div>
                  <div className="mt-2 text-xs text-purple-500 font-medium flex items-center gap-1">
                    <MessageSquare size={12} /> Go to chat
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
