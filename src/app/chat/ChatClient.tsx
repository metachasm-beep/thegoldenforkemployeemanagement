'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/types';
import { useChatSync } from '@/hooks/useChatSync';
import {
  getOrCreateDirectConversation,
  searchMessages,
  getStarredMessages,
  getMentionsAndReactions,
  getCrmEntityPreview,
} from '@/app/chatActions';
import { Target, X, Phone, Mail, CheckCircle2, User, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInfoPane } from '@/components/chat/ChatInfoPane';

export type RightPaneMode = 'hidden' | 'starred' | 'info' | 'mentions' | 'thread';

type ChatClientProps = {
  currentEmployeeId: string;
  employees: Employee[];
  initialConversations: any[];
  isImpersonating?: boolean;
};

const LeadCard = ({ id }: { id: string }) => {
  const [data, setData] = useState<{ lead: any; owner: any } | null>(null);

  useEffect(() => {
    let mounted = true;
    getCrmEntityPreview(id)
      .then((res) => {
        if (mounted && res) setData(res);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [id]);

  const lead = data?.lead;
  const owner = data?.owner;
  const demoVerified = (lead?.customFields as any)?.cooDemoVerified === true;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/95 dark:bg-gray-900/95 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3.5 my-2 flex flex-col gap-2 backdrop-blur-md shadow-sm w-full max-w-md text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Target size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
              {lead ? lead.name : `Lead Ref: ${id.slice(0, 8)}...`}
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 flex-wrap">
              {owner && (
                <span className="inline-flex items-center gap-1">
                  <User size={10} /> {owner.name}
                </span>
              )}
              {lead?.date && <span>• Logged {lead.date}</span>}
            </div>
          </div>
        </div>
        {lead && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              lead.status === 'Converted'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : lead.status === 'Pending Verification'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            {lead.status}
          </span>
        )}
      </div>

      {lead && (
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {lead.phone && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                <Phone size={10} className="text-gray-400" /> {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="inline-flex items-center gap-1 text-[10px] truncate max-w-[160px]">
                <Mail size={10} className="text-gray-400" /> {lead.email}
              </span>
            )}
            {demoVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={11} /> COO Demo Verified
              </span>
            )}
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
          >
            Open CRM <ExternalLink size={10} />
          </a>
        </div>
      )}
    </motion.div>
  );
};

const MarkdownComponents: any = {
  p: ({ children }: any) => {
    if (typeof children === 'string') {
      const trimmed = children.trim();
      if (trimmed.startsWith('[LEAD:') && trimmed.endsWith(']')) {
        const leadId = trimmed.replace('[LEAD:', '').replace(']', '');
        return <LeadCard id={leadId} />;
      }
      if (trimmed.startsWith('[ACTION:') && trimmed.endsWith(']')) {
        return null;
      }
    }
    return <p className="mb-2 last:mb-0 leading-relaxed tracking-tight">{children}</p>;
  },
  code: ({ inline, className, children, ...props }: any) => {
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
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="value" fill="#c084fc" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
      } catch {}
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export default function ChatClientSoft({
  currentEmployeeId,
  employees: initialEmployees,
  initialConversations,
  isImpersonating = false,
}: ChatClientProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const preferred =
      initialConversations.find((c: any) => c.name === '#coo-governance') ||
      initialConversations.find((c: any) => c.name === '#field-pipeline-feed') ||
      initialConversations.find((c: any) => c.type === 'GROUP') ||
      initialConversations[0];
    return preferred?.id || null;
  });

  useEffect(() => {
    (window as any).__ACTIVE_CHAT_ID = activeConversationId;
    return () => {
      (window as any).__ACTIVE_CHAT_ID = null;
    };
  }, [activeConversationId]);

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('hidden');
  const [activeThreadMessageId, setActiveThreadMessageId] = useState<string | null>(null);
  const [infoTab, setInfoTab] = useState<'media' | 'links' | 'docs'>('media');
  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [mentionsData, setMentionsData] = useState<{ mentions: any[]; reactions: any[] }>({
    mentions: [],
    reactions: [],
  });
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

  const filteredMessages = messages.filter(
    (m) =>
      !activeChatSearchQuery ||
      m.content?.toLowerCase().includes(activeChatSearchQuery.toLowerCase())
  );

  const currentUser = employees.find((e) => e.id === currentEmployeeId);
  const isManagerOrHR =
    currentUser?.role === 'Manager' ||
    currentUser?.role === 'COO' ||
    currentUser?.role === 'HR';

  useEffect(() => {
    if (rightPaneMode === 'starred') {
      getStarredMessages().then((res) => setStarredMessages(res));
    } else if (rightPaneMode === 'mentions') {
      getMentionsAndReactions().then((res) => setMentionsData(res));
    }
  }, [rightPaneMode, messages]);

  // Initial fetch of mentions count
  useEffect(() => {
    getMentionsAndReactions()
      .then((res) => setMentionsData(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const delay = setTimeout(() => {
        setIsSearching(true);
        searchMessages(searchQuery).then((res) => {
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
      const hydratedConvo = {
        ...convo,
        messages: (convo as any).messages || [],
        participants: (convo.participants || []).map((p: any) => ({
          ...p,
          employee: p.employee || employees.find((e) => e.id === p.employeeId),
        })),
      };
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === hydratedConvo.id);
        if (exists) {
          return prev.map((c) => (c.id === hydratedConvo.id ? { ...c, ...hydratedConvo } : c));
        }
        return [hydratedConvo, ...prev];
      });
      setActiveConversationId(hydratedConvo.id);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Cannot start chat.');
    }
  };

  const handleOpenThread = (messageId: string) => {
    setActiveThreadMessageId(messageId);
    setRightPaneMode('thread');
  };

  const handleStatusUpdated = (chatStatus: { emoji: string; text: string; updatedAt: string } | null) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === currentEmployeeId
          ? {
              ...emp,
              customFields: {
                ...((emp.customFields as Record<string, any>) || {}),
                chatStatus,
              },
            }
          : emp
      )
    );
  };

  const activeConvoDetails = conversations.find((c) => c.id === activeConversationId);
  const rawOtherPart =
    activeConvoDetails?.type === 'DIRECT'
      ? activeConvoDetails?.participants?.find((p: any) => p.employeeId !== currentEmployeeId)
      : null;
  const otherParticipant = rawOtherPart
    ? employees.find((e) => e.id === rawOtherPart.employeeId) || rawOtherPart.employee || null
    : null;

  const activeThreadMessage = messages.find((m) => m.id === activeThreadMessageId) || null;

  const getParticipantMe = (convo: any) =>
    convo?.participants?.find((p: any) => p.employeeId === currentEmployeeId);

  const sortedConversations = [...conversations].sort((a, b) => {
    const pA = getParticipantMe(a);
    const pB = getParticipantMe(b);
    if (pA?.isPinned && !pB?.isPinned) return -1;
    if (!pA?.isPinned && pB?.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const visibleConversations = sortedConversations.filter((c) => {
    const p = getParticipantMe(c);
    if (showArchived) return p?.isArchived;
    if (p?.isArchived) return false;
    if (showUnreadOnly && (!p?.unreadCount || p.unreadCount === 0)) return false;
    return true;
  });

  useEffect(() => {
    const handleGlobalMessage = (e: any) => {
      const data = e.detail;
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((c) => c.id === data.conversationId);
        if (idx !== -1) {
          copy[idx].messages = [data];
          copy[idx].updatedAt = new Date().toISOString();
          if (data.conversationId !== activeConversationId) {
            copy[idx].unreadCount = (copy[idx].unreadCount || 0) + 1;
          }
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    };
    window.addEventListener('chat-global-message', handleGlobalMessage);
    return () => window.removeEventListener('chat-global-message', handleGlobalMessage);
  }, [activeConversationId]);

  return (
    <div className="flex flex-1 h-full w-full bg-white dark:bg-gray-900 overflow-hidden">
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative w-full max-w-4xl h-full max-h-[80vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullScreenImage}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
              onClick={() => setFullScreenImage(null)}
            >
              <X size={24} />
            </button>
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
        rightPaneMode={rightPaneMode}
        setRightPaneMode={setRightPaneMode}
        mentionsCount={mentionsData.mentions.length + mentionsData.reactions.length}
        onStatusUpdated={handleStatusUpdated}
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
        setMessages={setMessages}
        currentEmployeeId={currentEmployeeId}
        currentUser={currentUser}
        employees={employees}
        presence={presence}
        isImpersonating={isImpersonating}
        isManagerOrHR={isManagerOrHR}
        setFullScreenImage={setFullScreenImage}
        LeadCard={LeadCard}
        MarkdownComponents={MarkdownComponents}
        onOpenThread={handleOpenThread}
        mentionsCount={mentionsData.mentions.length + mentionsData.reactions.length}
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
        mentionsData={mentionsData}
        activeThreadMessage={activeThreadMessage}
        setActiveConversationId={setActiveConversationId}
        setMessages={setMessages}
        presence={presence}
        isImpersonating={isImpersonating}
      />
    </div>
  );
}
