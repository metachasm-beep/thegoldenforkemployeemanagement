'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types';
import { getPusherClient } from '@/lib/pusher';
import { getOrCreateDirectConversation, getMessages, sendMessage } from '@/app/chatActions';
import Image from 'next/image';

type ChatClientProps = {
  currentEmployeeId: string;
  employees: Employee[];
  initialConversations: any[];
};

export default function ChatClient({ currentEmployeeId, employees, initialConversations }: ChatClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    getMessages(activeConversationId).then(data => {
      if (isMounted) setMessages(data);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-conversation-${activeConversationId}`);
    
    channel.bind('new-message', (data: any) => {
      setMessages(prev => [...prev, data]);
      
      // Update sidebar conversation preview
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.id === activeConversationId);
        if (idx !== -1) {
          copy[idx].messages = [data];
          copy[idx].updatedAt = new Date().toISOString();
          // Move to top
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
  }, [activeConversationId]);

  const handleStartChat = async (employeeId: string) => {
    try {
      const convo = await getOrCreateDirectConversation(employeeId);
      
      // Add to sidebar if not exists
      if (!conversations.find(c => c.id === convo.id)) {
        setConversations(prev => [{...convo, messages: []}, ...prev]);
      }
      
      setActiveConversationId(convo.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId) return;

    const text = inputText.trim();
    setInputText('');
    
    // Optimistic UI could go here
    try {
      setLoading(true);
      await sendMessage(activeConversationId, text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeConvoDetails = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;

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
            const other = c.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee;
            if (!other) return null;
            const lastMsg = c.messages?.[0]?.content;

            return (
              <button 
                key={c.id} 
                onClick={() => setActiveConversationId(c.id)}
                className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${activeConversationId === c.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={other.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`} alt={other.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{other.name}</p>
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg}</p>}
                </div>
              </button>
            )
          })}
          
          {/* Directory */}
          <div className="p-4 pt-6">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Directory</h3>
            <div className="space-y-1">
              {employees.filter(e => e.id !== currentEmployeeId).map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => handleStartChat(emp.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {emp.name}
                </button>
              ))}
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
                {otherParticipant && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                    <Image src={otherParticipant.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.name)}&background=random`} alt={otherParticipant.name} fill className="object-cover" />
                  </div>
                )}
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{otherParticipant?.name || 'Chat'}</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : ''}`}>
                    {!isMe && showAvatar && otherParticipant ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                        <Image src={otherParticipant.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.name)}&background=random`} alt="Avatar" fill className="object-cover" />
                      </div>
                    ) : (!isMe && <div className="w-8 shrink-0"></div>)}
                    
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{otherParticipant?.name}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..." 
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
