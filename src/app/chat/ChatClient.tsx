'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/types';
import { useChatSync } from '@/hooks/useChatSync';
import { 
  getOrCreateDirectConversation, 
  searchMessages,
  getStarredMessages
} from '@/app/chatActions';
import { Target, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInfoPane } from '@/components/chat/ChatInfoPane';

type ChatClientProps = {
  currentEmployeeId: string;
  employees: Employee[];
  initialConversations: any[];
  isImpersonating?: boolean;
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
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [rightPaneMode, setRightPaneMode] = useState<"hidden" | "starred" | "info">("hidden");
  const [infoTab, setInfoTab] = useState<"media" | "links" | "docs">("media");
  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [activeChatSearchQuery, setActiveChatSearchQuery] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { messages, setMessages, presence, loading } = useChatSync(
    currentEmployeeId, 
    activeConversationId, 
    isImpersonating, 
    setConversations
  );
  
  const filteredMessages = messages.filter(m => 
    !activeChatSearchQuery || m.content?.toLowerCase().includes(activeChatSearchQuery.toLowerCase())
  );
  
  const currentUser = employees.find(e => e.id === currentEmployeeId);
  const isManagerOrHR = currentUser?.role === 'Manager' || currentUser?.role === 'HR';
  
  useEffect(() => {
    if (rightPaneMode === "starred") {
      getStarredMessages().then(res => setStarredMessages(res));
    }
  }, [rightPaneMode, messages]);

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

  const activeConvoDetails = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConvoDetails?.type === 'DIRECT' 
    ? activeConvoDetails?.participants.find((p: any) => p.employeeId !== currentEmployeeId)?.employee 
    : null;

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

      <ChatSidebar 
        currentEmployeeId={currentEmployeeId}
        employees={employees}
        currentUser={currentUser}
        presence={presence}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showUnreadOnly={showUnreadOnly}
        setShowUnreadOnly={setShowUnreadOnly}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        searchResults={searchResults}
        isSearching={isSearching}
        visibleConversations={visibleConversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        handleStartChat={handleStartChat}
        getParticipantMe={getParticipantMe}
      />

      <ChatWindow 
        activeConversationId={activeConversationId}
        activeConvoDetails={activeConvoDetails}
        otherParticipant={otherParticipant}
        rightPaneMode={rightPaneMode}
        setRightPaneMode={setRightPaneMode}
        activeChatSearchQuery={activeChatSearchQuery}
        setActiveChatSearchQuery={setActiveChatSearchQuery}
        loading={loading}
        filteredMessages={filteredMessages}
        currentEmployeeId={currentEmployeeId}
        presence={presence}
        isImpersonating={isImpersonating}
        isManagerOrHR={isManagerOrHR}
        setFullScreenImage={setFullScreenImage}
        LeadCard={LeadCard}
        MarkdownComponents={MarkdownComponents}
      />

      <ChatInfoPane 
        rightPaneMode={rightPaneMode}
        setRightPaneMode={setRightPaneMode}
        activeConversationId={activeConversationId}
        activeConvoDetails={activeConvoDetails}
        otherParticipant={otherParticipant}
        currentEmployeeId={currentEmployeeId}
        infoTab={infoTab}
        setInfoTab={setInfoTab}
        messages={messages}
        setFullScreenImage={setFullScreenImage}
        starredMessages={starredMessages}
        setActiveConversationId={setActiveConversationId}
        setMessages={setMessages}
        presence={presence}
      />
    </div>
  );
}
