'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types';
import { getPusherClient } from '@/lib/pusher';
import { getOrCreateDirectConversation, getMessages, sendMessage, setPresenceStatus } from '@/app/chatActions';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

type ChatClientProps = {
  currentEmployeeId: string;
  employees: Employee[];
  initialConversations: any[];
  isImpersonating?: boolean;
};

export default function ChatClient({ currentEmployeeId, employees, initialConversations, isImpersonating = false }: ChatClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Presence state
  const [presence, setPresence] = useState<Record<string, 'online' | 'away' | 'offline'>>({});
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Global Presence & Idle Detection
  useEffect(() => {
    const pusher = getPusherClient();
    const globalChannel = pusher.subscribe('presence-global');

    globalChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const p: any = {};
      members.each((member: any) => { p[member.id] = 'online'; });
      setPresence(p);
    });

    globalChannel.bind('pusher:member_added', (member: any) => {
      setPresence(prev => ({ ...prev, [member.id]: 'online' }));
    });

    globalChannel.bind('pusher:member_removed', (member: any) => {
      setPresence(prev => ({ ...prev, [member.id]: 'offline' }));
    });

    globalChannel.bind('user-status-change', (data: any) => {
      setPresence(prev => ({ ...prev, [data.userId]: data.status }));
    });

    // Idle Detection
    let idleTimer: NodeJS.Timeout;
    let isAway = false;

    const resetIdleTimer = () => {
      if (isAway && !isImpersonating) {
        isAway = false;
        setPresenceStatus(false).catch(() => {});
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!isImpersonating) {
          isAway = true;
          setPresenceStatus(true).catch(() => {});
        }
      }, 15 * 60 * 1000); // 15 mins
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

  // Load conversation messages
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    getMessages(activeConversationId, isImpersonating ? currentEmployeeId : undefined).then(data => {
      if (isMounted) setMessages(data);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-conversation-${activeConversationId}`);
    
    channel.bind('new-message', (data: any) => {
      setMessages(prev => [...prev, data]);
      
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

    return () => {
      isMounted = false;
      pusher.unsubscribe(`private-conversation-${activeConversationId}`);
    };
  }, [activeConversationId, isImpersonating, currentEmployeeId]);

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
    
    try {
      setLoading(true);
      await sendMessage(activeConversationId, text);
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

  // Mini-profile component
  const EmployeeAvatar = ({ emp }: { emp: Employee }) => {
    const stat = presence[emp.id] || 'offline';
    const isTopSeller = emp.target >= 100000; // Mock badge logic
    const isProbation = emp.isProbation;

    return (
      <div className="relative group shrink-0 mt-1">
        <div className="relative w-8 h-8 rounded-full overflow-hidden">
          <Image src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} fill className="object-cover" />
        </div>
        
        {/* Status Dot */}
        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>

        {/* Hover Card */}
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-4 pointer-events-none">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {emp.name}
            {isTopSeller && <span title="Top Seller" className="text-amber-500">⭐</span>}
            {isProbation && <span title="On Probation" className="text-red-500">⚠️</span>}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">{emp.role}</p>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Target: ₹{emp.target.toLocaleString()}</p>
            <p>Status: {stat.charAt(0).toUpperCase() + stat.slice(1)}</p>
            <p>Email: {emp.email}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            💬 Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Active Conversations */}
          {conversations.map(c => {
            let displayTitle = '';
            let avatarSrc = '';
            let presenceDot = null;

            if (c.type === 'GROUP') {
              displayTitle = c.name || 'Group Channel';
              avatarSrc = 'https://ui-avatars.com/api/?name=Group&background=random';
            } else {
              const other = c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;
              if (!other) return null;
              displayTitle = other.name;
              avatarSrc = other.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`;
              const stat = presence[other.id] || 'offline';
              presenceDot = <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>;
            }

            const lastMsg = c.messages?.[0]?.content;

            return (
              <button 
                key={c.id} 
                onClick={() => setActiveConversationId(c.id)}
                className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${activeConversationId === c.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
              >
                <div className="relative w-10 h-10 rounded-full shrink-0">
                  <Image src={avatarSrc} alt={displayTitle} fill className="object-cover rounded-full" />
                  {presenceDot}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayTitle}</p>
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>}
                </div>
              </button>
            )
          })}
          
          {/* Directory */}
          <div className="p-4 pt-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Directory</h3>
            <div className="space-y-1">
              {employees.filter(e => e.id !== currentEmployeeId).map(emp => {
                const stat = presence[emp.id] || 'offline';
                return (
                  <button 
                    key={emp.id}
                    onClick={() => handleStartChat(emp.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${stat === 'online' ? 'bg-green-500' : stat === 'away' ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
                    {emp.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3">
                {(otherParticipant || activeConvoDetails?.type === 'GROUP') && (
                  otherParticipant ? (
                    <EmployeeAvatar emp={otherParticipant} />
                  ) : (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image src="https://ui-avatars.com/api/?name=Group&background=random" alt="Avatar" fill className="object-cover" />
                    </div>
                  )
                )}
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  {activeConvoDetails?.type === 'GROUP' ? activeConvoDetails.name : (otherParticipant?.name || 'Chat')}
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : ''}`}>
                    {!isMe && showAvatar && msg.sender ? (
                      <EmployeeAvatar emp={msg.sender} />
                    ) : (!isMe && <div className="w-8 shrink-0"></div>)}
                    
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl prose prose-sm dark:prose-invert break-words max-w-full ${isMe ? 'bg-amber-600 text-white rounded-br-none prose-p:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              {isImpersonating || activeConvoDetails?.isReadOnly ? (
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-500 italic text-center text-sm">
                  {isImpersonating ? "Sending messages is disabled in God Mode." : "This channel is read-only."}
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message (Supports Markdown)..." 
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-gray-100"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || loading}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 rounded-xl font-medium transition-colors"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
