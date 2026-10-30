import { useState } from 'react';
import {
  Search,
  Pin,
  Archive,
  Hash,
  Lock,
  Users,
  AtSign,
  Smile,
  X,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { Employee } from '@/types';
import { InitialsAvatar } from './ChatAvatars';
import {
  togglePinConversation,
  toggleArchiveConversation,
  updateEmployeeChatStatus,
} from '@/app/chatActions';
import { GLOBAL_CHANNELS_POLICY } from '@/lib/policies/channelPolicy';
import { RightPaneMode } from '@/app/chat/ChatClient';
import { toast } from 'sonner';

const STATUS_PRESETS = [
  { emoji: '📍', text: 'In Field Demo' },
  { emoji: '🏪', text: 'Venue Onboarding' },
  { emoji: '📞', text: 'Cold Calling' },
  { emoji: '💻', text: '5-Pillar Deep Work' },
  { emoji: '🍽️', text: 'At Merchant Site' },
];

type SectionFilter = 'all' | 'channels' | 'dms' | 'directory';

type ChatSidebarProps = {
  currentEmployeeId: string;
  employees: Employee[];
  currentUser: Employee | undefined;
  presence: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showUnreadOnly: boolean;
  setShowUnreadOnly: (val: boolean) => void;
  showArchived: boolean;
  setShowArchived: (val: boolean) => void;
  searchResults: any[];
  isSearching: boolean;
  visibleConversations: any[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  handleStartChat: (id: string) => void;
  getParticipantMe: (convo: any) => any;
  rightPaneMode: RightPaneMode;
  setRightPaneMode: (mode: RightPaneMode) => void;
  mentionsCount: number;
  onStatusUpdated: (
    chatStatus: { emoji: string; text: string; updatedAt: string } | null
  ) => void;
  mobileView: 'list' | 'chat';
};

export const ChatSidebar = ({
  currentEmployeeId,
  employees,
  currentUser,
  presence,
  searchQuery,
  setSearchQuery,
  showUnreadOnly,
  setShowUnreadOnly,
  showArchived,
  setShowArchived,
  searchResults,
  isSearching,
  visibleConversations,
  activeConversationId,
  setActiveConversationId,
  handleStartChat,
  getParticipantMe,
  rightPaneMode,
  setRightPaneMode,
  mentionsCount,
  onStatusUpdated,
  mobileView,
}: ChatSidebarProps) => {
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');

  const groupChannels = visibleConversations.filter((c) => c.type === 'GROUP');
  const directMessages = visibleConversations.filter((c) => c.type === 'DIRECT');
  const directoryMembers = employees.filter((e) => {
    if (e.id === currentEmployeeId) return false;
    if (e.role === 'System Bot') return true;
    if (currentUser?.role === 'Sales Executive') {
      return (
        e.role === 'HR' ||
        e.role === 'COO' ||
        e.role === 'Team Lead' ||
        e.role === 'System Bot'
      );
    }
    return true;
  });

  const myChatStatus = (currentUser?.customFields as any)?.chatStatus as
    | { emoji: string; text: string }
    | undefined;

  const handleSetStatus = async (emoji: string, text: string) => {
    try {
      setUpdatingStatus(true);
      const res = await updateEmployeeChatStatus(emoji, text);
      onStatusUpdated(res.chatStatus);
      setStatusPickerOpen(false);
      toast.success(res.chatStatus ? `Status set to ${emoji} ${text}` : 'Status cleared');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Manager') return 'Founder';
    if (role === 'COO') return 'COO';
    if (role === 'Team Lead') return 'Lead';
    if (role === 'HR') return 'HR';
    if (role === 'System Bot') return 'Bot';
    return 'Sales';
  };

  return (
    <div
      className={`${
        mobileView === 'list' ? 'flex w-full' : 'hidden'
      } md:flex md:w-80 border-r chat-sidebar border-white/40 dark:border-gray-700/40 flex-col bg-white dark:bg-gray-900 md:bg-white/20 md:dark:bg-gray-900/20 backdrop-blur-md shrink-0 h-full`}
    >
      {/* WORKSPACE HEADER */}
      <div className="p-3.5 md:p-4 border-b border-gray-200/80 dark:border-gray-800 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="The Golden Fork"
              className="md:hidden h-8 w-8 rounded-lg object-cover ring-1 ring-amber-400/50 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white truncate">
                  Golden Fork HQ
                </h2>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Channels, Bot Feeds &amp; Direct Messages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setRightPaneMode(rightPaneMode === 'mentions' ? 'hidden' : 'mentions')
            }
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1 shrink-0 ${
              rightPaneMode === 'mentions'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <AtSign size={13} />
            <span className="hidden xs:inline">Inbox</span>
            {mentionsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {mentionsCount}
              </span>
            )}
          </button>
        </div>

        {/* SLACK CUSTOM OPERATIONAL STATUS BAR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusPickerOpen(!statusPickerOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-400 text-xs transition-colors"
          >
            <span className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-200 font-medium">
              {myChatStatus ? (
                <>
                  <span>{myChatStatus.emoji}</span>
                  <span className="truncate font-semibold">{myChatStatus.text}</span>
                </>
              ) : (
                <>
                  <Smile size={14} className="text-gray-400 shrink-0" />
                  <span className="text-gray-400">Set operational status...</span>
                </>
              )}
            </span>
            {myChatStatus && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetStatus('', '');
                }}
                className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                title="Clear status"
              >
                <X size={12} />
              </span>
            )}
          </button>

          {statusPickerOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Operational Context
              </div>
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset.text}
                  disabled={updatingStatus}
                  onClick={() => handleSetStatus(preset.emoji, preset.text)}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-xs flex items-center gap-2 text-gray-700 dark:text-gray-200 transition-colors"
                >
                  <span>{preset.emoji}</span>
                  <span className="font-medium">{preset.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 pl-9 pr-8 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* QUICK CATEGORY TABS (Huge mobile usability improvement) */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/90">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'channels', label: `Channels (${groupChannels.length})` },
              { id: 'dms', label: `DMs (${directMessages.length})` },
              { id: 'directory', label: `Team (${directoryMembers.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSectionFilter(tab.id);
                setShowArchived(false);
              }}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all truncate ${
                sectionFilter === tab.id && !showArchived
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FILTER PILLS (Unread / Archived) */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowArchived(false);
                setShowUnreadOnly(!showUnreadOnly);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                showUnreadOnly && !showArchived
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Unread Only
            </button>
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setShowUnreadOnly(false);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                showArchived
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Archived
            </button>
          </div>

          {activeConversationId && (
            <button
              type="button"
              onClick={() => setActiveConversationId(activeConversationId)}
              className="md:hidden inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg"
            >
              Active Chat <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto relative p-2.5 space-y-5">
        {searchQuery ? (
          <div className="p-1 space-y-2.5">
            {isSearching ? (
              <p className="text-xs text-gray-500 text-center py-6">Searching messages...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No matching messages found.</p>
            ) : (
              searchResults.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveConversationId(msg.conversationId);
                  }}
                >
                  <p className="text-xs font-bold text-gray-500 mb-1">
                    {msg.sender.name} in {msg.conversation?.name || 'Direct Message'}
                  </p>
                  <p className="text-xs text-gray-800 dark:text-gray-200 truncate">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* SECTION 1: SLACK-STYLE OPERATIONAL CHANNELS */}
            {(sectionFilter === 'all' || sectionFilter === 'channels') && (
              <div>
                <div className="px-2 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Operational Channels
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">{groupChannels.length}</span>
                </div>
                <div className="space-y-1">
                  {groupChannels.map((c) => {
                    const me = getParticipantMe(c);
                    const rawName = (c.name || 'channel').replace(/^#/, '');
                    const policy = GLOBAL_CHANNELS_POLICY.find((p) => p.name === c.name);
                    const isPrivate =
                      policy?.isPrivateGovernance ||
                      c.name === '#coo-governance' ||
                      c.name === '#hr-private' ||
                      c.name === '#approvals-finance';
                    const isSquad = !c.name?.startsWith('#');
                    const lastMsg = c.messages?.[0]?.content;
                    const active = activeConversationId === c.id;

                    return (
                      <div key={c.id} className="relative group">
                        <button
                          onClick={() => setActiveConversationId(c.id)}
                          className={`w-full text-left px-3 py-2.5 md:py-2 md:pr-12 rounded-xl transition-all flex items-start gap-2.5 ${
                            active
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-gray-700 dark:text-gray-300 bg-gray-50/70 md:bg-transparent dark:bg-gray-800/40 md:dark:bg-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isPrivate ? (
                              <Lock
                                size={16}
                                className={active ? 'text-amber-300' : 'text-amber-500'}
                              />
                            ) : isSquad ? (
                              <Users
                                size={16}
                                className={active ? 'text-indigo-200' : 'text-indigo-500'}
                              />
                            ) : (
                              <Hash
                                size={16}
                                className={active ? 'text-indigo-200' : 'text-gray-400'}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold truncate">
                                {isSquad ? c.name : rawName}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {me?.isPinned && (
                                  <Pin
                                    size={11}
                                    className={active ? 'text-white/80' : 'text-gray-400'}
                                  />
                                )}
                                {me?.unreadCount > 0 && (
                                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {me.unreadCount}
                                  </span>
                                )}
                                <ChevronRight
                                  size={14}
                                  className={`md:hidden ${
                                    active ? 'text-white/70' : 'text-gray-400'
                                  }`}
                                />
                              </div>
                            </div>
                            {(lastMsg || policy?.description) && (
                              <p
                                className={`text-[11px] truncate mt-0.5 ${
                                  active ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {lastMsg || policy?.description}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-lg p-0.5 shadow-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinConversation(c.id, !me?.isPinned);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                            title={me?.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin size={12} className={me?.isPinned ? 'fill-gray-500' : ''} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleArchiveConversation(c.id, !me?.isArchived);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                            title={me?.isArchived ? 'Unarchive' : 'Archive'}
                          >
                            <Archive size={12} className={me?.isArchived ? 'fill-gray-500' : ''} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: ACTIVE DIRECT MESSAGES */}
            {(sectionFilter === 'all' || sectionFilter === 'dms') && (
              <div>
                <div className="px-2 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Direct Messages
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {directMessages.length}
                  </span>
                </div>
                {directMessages.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-2">
                    No direct messages yet. Tap anyone in Team Directory below to start chatting.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {directMessages.map((c) => {
                      const rawOther = c.participants?.find(
                        (p: any) => p.employeeId !== currentEmployeeId
                      );
                      const other =
                        employees.find((e) => e.id === rawOther?.employeeId) ||
                        rawOther?.employee;
                      const me = getParticipantMe(c);
                      if (!other) return null;

                      const active = activeConversationId === c.id;
                      const lastMsg = c.messages?.[0]?.content;
                      const isBot = other.role === 'System Bot';
                      const otherStatus = (other.customFields as any)?.chatStatus as
                        | { emoji: string; text: string }
                        | undefined;

                      return (
                        <div key={c.id} className="relative group">
                          <button
                            onClick={() => setActiveConversationId(c.id)}
                            className={`w-full text-left px-3 py-2.5 md:py-2 rounded-xl transition-all flex items-center gap-2.5 ${
                              active
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 bg-gray-50/70 md:bg-transparent dark:bg-gray-800/40 md:dark:bg-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="relative w-8 h-8 md:w-7 md:h-7 rounded-full overflow-hidden">
                                {other.avatarUrl ? (
                                  <Image
                                    src={other.avatarUrl}
                                    alt={other.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <InitialsAvatar
                                    name={other.name}
                                    className="w-8 h-8 md:w-7 md:h-7 text-xs"
                                  />
                                )}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-gray-900 rounded-full ${
                                  isBot || (presence[other.id] || 'offline') === 'online'
                                    ? 'bg-emerald-500'
                                    : (presence[other.id] || 'offline') === 'away'
                                    ? 'bg-amber-400'
                                    : 'bg-gray-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-bold truncate">{other.name}</span>
                                  {otherStatus && (
                                    <span
                                      title={`${otherStatus.emoji} ${otherStatus.text}`}
                                      className="text-xs shrink-0"
                                    >
                                      {otherStatus.emoji}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                                      active
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200/70 dark:bg-gray-800 text-gray-500'
                                    }`}
                                  >
                                    {getRoleBadge(other.role)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {me?.unreadCount > 0 && (
                                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                      {me.unreadCount}
                                    </span>
                                  )}
                                  <ChevronRight
                                    size={14}
                                    className={`md:hidden ${
                                      active ? 'text-white/70' : 'text-gray-400'
                                    }`}
                                  />
                                </div>
                              </div>
                              {otherStatus ? (
                                <p
                                  className={`text-[10px] truncate ${
                                    active
                                      ? 'text-indigo-100'
                                      : 'text-indigo-500 dark:text-indigo-400'
                                  }`}
                                >
                                  {otherStatus.text}
                                </p>
                              ) : (
                                lastMsg && (
                                  <p
                                    className={`text-[11px] truncate ${
                                      active ? 'text-indigo-100' : 'text-gray-400'
                                    }`}
                                  >
                                    {lastMsg}
                                  </p>
                                )
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: TEAM DIRECTORY */}
            {!showArchived && (sectionFilter === 'all' || sectionFilter === 'directory') && (
              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800">
                <h3 className="px-2 text-[11px] font-bold uppercase text-gray-400 mb-2 tracking-wider">
                  Team Directory ({directoryMembers.length})
                </h3>
                <div className="space-y-1">
                  {directoryMembers.map((emp) => {
                    const stat =
                      emp.role === 'System Bot' ? 'online' : presence[emp.id] || 'offline';
                    const activeDmConvo = directMessages.find((c) =>
                      c.participants?.some((p: any) => p.employeeId === emp.id)
                    );
                    const isActiveMember =
                      activeDmConvo && activeConversationId === activeDmConvo.id;
                    const empStatus = (emp.customFields as any)?.chatStatus as
                      | { emoji: string; text: string }
                      | undefined;

                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleStartChat(emp.id)}
                        className={`w-full text-left px-3 py-2.5 md:py-1.5 rounded-xl transition-colors text-xs flex items-center justify-between gap-2 ${
                          isActiveMember
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-800 font-bold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              stat === 'online'
                                ? 'bg-emerald-500'
                                : stat === 'away'
                                ? 'bg-amber-400'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                          <span className="truncate font-medium">{emp.name}</span>
                          {empStatus && (
                            <span
                              title={`${empStatus.emoji} ${empStatus.text}`}
                              className="text-[11px] shrink-0"
                            >
                              {empStatus.emoji}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isActiveMember
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                          >
                            {getRoleBadge(emp.role)}
                          </span>
                          <MessageSquare size={13} className="md:hidden text-indigo-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
