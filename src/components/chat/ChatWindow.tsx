import { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Star,
  Check,
  CheckCheck,
  Smile,
  Reply,
  Edit,
  Trash,
  Paperclip,
  Terminal,
  Bot,
  Hash,
  Lock,
  Pin,
  AtSign,
  Target,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Flag,
  Rocket,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Employee } from '@/types';
import { EmployeeAvatar, GroupAvatar } from './ChatAvatars';
import {
  toggleReaction,
  toggleStarMessage,
  deleteMessage,
  editMessage,
  sendMessage,
  executeChatBotAction,
  searchCrmEntitiesForChat,
  togglePinMessage,
} from '@/app/chatActions';
import { GLOBAL_CHANNELS_POLICY } from '@/lib/policies/channelPolicy';
import { RightPaneMode } from '@/app/chat/ChatClient';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type ChatWindowProps = {
  activeConversationId: string | null;
  activeConvoDetails: any;
  otherParticipant: any;
  rightPaneMode: RightPaneMode;
  setRightPaneMode: (mode: RightPaneMode) => void;
  activeChatSearchQuery: string;
  setActiveChatSearchQuery: (val: string) => void;
  loading: boolean;
  filteredMessages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  currentEmployeeId: string;
  currentUser: Employee | undefined;
  employees: Employee[];
  presence: Record<string, string>;
  isImpersonating: boolean;
  isManagerOrHR: boolean;
  setFullScreenImage: (url: string | null) => void;
  LeadCard: (props: { id: string }) => React.JSX.Element;
  MarkdownComponents: any;
  onOpenThread: (messageId: string) => void;
  mentionsCount: number;
};

type ParsedAction = {
  type: 'EXPENSE' | 'DEMO' | 'TRIAL';
  id: string;
};

function extractActionTokens(content: string): ParsedAction[] {
  if (!content) return [];
  const regex = /\[ACTION:(EXPENSE|DEMO|TRIAL):([^\]]+)\]/g;
  const actions: ParsedAction[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    actions.push({
      type: match[1] as 'EXPENSE' | 'DEMO' | 'TRIAL',
      id: match[2].trim(),
    });
  }
  return actions;
}

function stripActionTokensFromText(content: string): string {
  if (!content) return '';
  return content.replace(/\[ACTION:(EXPENSE|DEMO|TRIAL):[^\]]+\]/g, '').trim();
}

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
  setMessages,
  currentEmployeeId,
  currentUser,
  employees,
  presence,
  isImpersonating,
  isManagerOrHR,
  setFullScreenImage,
  MarkdownComponents,
  onOpenThread,
  mentionsCount,
}: ChatWindowProps) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [executingActionKey, setExecutingActionKey] = useState<string | null>(null);
  const [showPinnedList, setShowPinnedList] = useState(false);

  // @Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // CRM Entity Picker popover state
  const [crmPickerOpen, setCrmPickerOpen] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmEntities, setCrmEntities] = useState<{ leads: any[]; trials: any[] }>({
    leads: [],
    trials: [],
  });
  const [loadingCrm, setLoadingCrm] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [filteredMessages.length]);

  useEffect(() => {
    if (!crmPickerOpen) return;
    let active = true;
    setLoadingCrm(true);
    searchCrmEntitiesForChat(crmSearch)
      .then((res) => {
        if (active) setCrmEntities(res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCrm(false);
      });
    return () => {
      active = false;
    };
  }, [crmPickerOpen, crmSearch]);

  // Detect @mention token at the end of inputText
  const handleInputChange = (val: string) => {
    setInputText(val);
    const match = val.match(/(?:^|\s)@([a-zA-Z0-9_ ]*)$/);
    if (match && match[1].length <= 20) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (mentionLabel: string) => {
    const updated = inputText.replace(/(?:^|\s)@([a-zA-Z0-9_ ]*)$/, (full) => {
      const prefix = full.startsWith(' ') ? ' ' : '';
      return `${prefix}@${mentionLabel} `;
    });
    setInputText(updated);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const mentionCandidates =
    mentionQuery !== null
      ? [
          { id: 'channel', name: 'channel', role: 'Broadcast to Everyone' },
          { id: 'here', name: 'here', role: 'Online Members' },
          ...employees
            .filter((e) => e.id !== currentEmployeeId)
            .map((e) => ({ id: e.id, name: e.name, role: e.role })),
        ]
          .filter(
            (item) =>
              item.name.toLowerCase().includes(mentionQuery) ||
              item.role.toLowerCase().includes(mentionQuery)
          )
          .slice(0, 6)
      : [];

  const executeOrSendText = async (textToSend: string) => {
    if ((!textToSend.trim() && !attachmentUrl) || !activeConversationId || isImpersonating) return;

    if (editingId) {
      try {
        setIsSending(true);
        await editMessage(editingId, textToSend.trim());
        setEditingId(null);
        setInputText('');
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const text = textToSend.trim();
    const currentAttachment = attachmentUrl;
    setInputText('');
    setMentionQuery(null);
    setAttachmentUrl(null);
    const parentId = replyingTo?.id;
    setReplyingTo(null);

    try {
      setIsSending(true);
      await sendMessage(activeConversationId, text, parentId, currentAttachment || undefined);
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeOrSendText(inputText);
  };

  const handleShareCrmEntity = async (type: 'LEAD' | 'TRIAL', item: any) => {
    setCrmPickerOpen(false);
    if (type === 'LEAD') {
      await executeOrSendText(
        `🎯 **Shared CRM Lead:** **${item.name}** (Stage: \`${item.status}\`)\n[LEAD:${item.leadId}]\n[ACTION:DEMO:${item.leadId}]`
      );
    } else {
      await executeOrSendText(
        `🏨 **Shared 21-Day Trial Venue:** **${item.venueName}** (${item.venueType}) — Stage: \`${
          item.onboardingStatus
        }\` • ACV: **₹${Number(item.annualContractValue || 0).toLocaleString('en-IN')}/yr**\n[ACTION:TRIAL:${
          item.id
        }]`
      );
    }
  };

  const handleBlockKitAction = async (
    messageId: string,
    actionType:
      | 'APPROVE_EXPENSE'
      | 'REJECT_EXPENSE'
      | 'VERIFY_DEMO'
      | 'FLAG_DEMO'
      | 'CONVERT_LEAD'
      | 'ADVANCE_TRIAL_STAGE'
      | 'CONVERT_TRIAL_LIVE',
    targetId: string
  ) => {
    const key = `${messageId}:${actionType}:${targetId}`;
    try {
      setExecutingActionKey(key);
      const res = await executeChatBotAction(messageId, actionType, targetId);
      if (res.message) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
      }
      toast.success('Action executed in CRM!');
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setExecutingActionKey(null);
    }
  };

  const handleTogglePinMsg = async (messageId: string) => {
    try {
      const res = await togglePinMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
      toast.success(res.isPinned ? 'Pinned message to channel' : 'Unpinned message');
    } catch (e: any) {
      toast.error(e.message || 'Failed to pin message');
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

    const read = others.some(
      (p: any) => p.lastReadAt && new Date(p.lastReadAt) >= new Date(msg.createdAt)
    );
    const delivered = others.some(
      (p: any) => p.lastDeliveredAt && new Date(p.lastDeliveredAt) >= new Date(msg.createdAt)
    );

    if (read) status = 'read';
    else if (delivered) status = 'delivered';

    if (status === 'read') return <CheckCheck size={14} className="text-blue-300 ml-1 inline-block" />;
    if (status === 'delivered')
      return <CheckCheck size={14} className="text-gray-300 ml-1 inline-block" />;
    return <Check size={14} className="text-gray-300 ml-1 inline-block" />;
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-900 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-4">
          <Hash size={32} />
        </div>
        <p className="font-bold text-gray-800 dark:text-gray-200 text-base">
          Golden Fork Operational Workspace
        </p>
        <p className="text-xs text-gray-500 mt-1 max-w-md">
          Select an operational channel (`#coo-governance`, `#venue-onboarding`, `#field-pipeline-feed`)
          or a team member from the left sidebar.
        </p>
      </div>
    );
  }

  const channelPolicy =
    activeConvoDetails?.type === 'GROUP'
      ? GLOBAL_CHANNELS_POLICY.find((p) => p.name === activeConvoDetails?.name)
      : null;

  const pinnedMessages = filteredMessages.filter(
    (m) => !m.isDeleted && (m.linkMetadata as any)?.isPinned === true
  );

  const otherStatus = (otherParticipant?.customFields as any)?.chatStatus as
    | { emoji: string; text: string }
    | undefined;

  const canExecuteActions =
    currentUser?.role === 'Manager' ||
    currentUser?.role === 'COO' ||
    currentUser?.role === 'HR' ||
    currentUser?.role === 'Team Lead';

  const getRoleTagStyle = (role?: string) => {
    switch (role) {
      case 'Manager':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'COO':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'HR':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      case 'Team Lead':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'System Bot':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getRoleDisplayLabel = (role?: string) => {
    if (role === 'Manager') return 'Founder / Manager';
    if (role === 'COO') return 'Contractual COO';
    if (role === 'System Bot') return 'Automated Bot';
    return role || 'Team Member';
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative min-w-0">
      {/* CHANNEL / DM HEADER */}
      <div className="min-h-16 py-2.5 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between px-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md sticky top-0 z-20 shrink-0 gap-4">
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-800/50 p-1.5 rounded-xl transition-colors min-w-0"
          onClick={() => setRightPaneMode('info')}
        >
          {activeConvoDetails?.type === 'GROUP' ? (
            <GroupAvatar name={activeConvoDetails.name} className="w-9 h-9 shrink-0" />
          ) : otherParticipant ? (
            <EmployeeAvatar emp={otherParticipant} presence={presence} className="w-9 h-9 shrink-0" />
          ) : null}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                {activeConvoDetails?.type === 'GROUP'
                  ? activeConvoDetails.name
                  : otherParticipant?.name || 'Direct Message'}
              </h3>
              {activeConvoDetails?.type === 'DIRECT' && otherParticipant && (
                <>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleTagStyle(
                      otherParticipant.role
                    )}`}
                  >
                    {getRoleDisplayLabel(otherParticipant.role)}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    Direct Message
                  </span>
                  {otherStatus && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                      <span>{otherStatus.emoji}</span>
                      <span>{otherStatus.text}</span>
                    </span>
                  )}
                </>
              )}
              {channelPolicy?.isPrivateGovernance && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  <Lock size={10} /> Founder &amp; COO Only
                </span>
              )}
            </div>
            {activeConvoDetails?.type === 'GROUP' && channelPolicy?.description ? (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-xl">
                {channelPolicy.description}
              </span>
            ) : activeConvoDetails?.type === 'DIRECT' && otherParticipant ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium truncate">
                <span>
                  {otherParticipant.role === 'System Bot' ||
                  presence[otherParticipant.id] === 'online' ? (
                    <span className="text-emerald-500 font-semibold">● Online</span>
                  ) : otherParticipant.lastSeenAt ? (
                    `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastSeenAt), {
                      addSuffix: true,
                    })}`
                  ) : (
                    'Offline'
                  )}
                </span>
                {otherParticipant.email && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span className="text-[11px] text-gray-400 truncate">
                      {otherParticipant.email}
                    </span>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search in conversation..."
              value={activeChatSearchQuery}
              onChange={(e) => setActiveChatSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-full focus:ring-2 focus:ring-indigo-400"
            />
            {activeChatSearchQuery && (
              <button
                onClick={() => setActiveChatSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setRightPaneMode(rightPaneMode === 'mentions' ? 'hidden' : 'mentions')}
            title="Mentions & Reactions"
            className={`p-2 rounded-full transition-colors relative ${
              rightPaneMode === 'mentions'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AtSign size={17} />
            {mentionsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {mentionsCount > 9 ? '9+' : mentionsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setRightPaneMode(rightPaneMode === 'starred' ? 'hidden' : 'starred')}
            title="Starred Messages"
            className={`p-2 rounded-full transition-colors ${
              rightPaneMode === 'starred'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Star size={17} className={rightPaneMode === 'starred' ? 'fill-indigo-500' : ''} />
          </button>
        </div>
      </div>

      {/* PINNED MESSAGES BANNER (FEATURE 5) */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-800/50 px-6 py-2 z-10">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowPinnedList(!showPinnedList)}
              className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline truncate"
            >
              <Pin size={13} className="fill-amber-600 text-amber-600 shrink-0" />
              <span>
                {pinnedMessages.length} Pinned{' '}
                {pinnedMessages.length === 1 ? 'Message' : 'Messages'}
              </span>
              <span className="text-amber-600/80 dark:text-amber-400/70 font-normal truncate max-w-md">
                — {stripActionTokensFromText(pinnedMessages[pinnedMessages.length - 1].content)}
              </span>
              {showPinnedList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
          {showPinnedList && (
            <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 space-y-1.5 max-h-36 overflow-y-auto">
              {pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between gap-2 text-xs bg-white/80 dark:bg-gray-900/70 px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40"
                >
                  <div className="truncate">
                    <span className="font-bold text-gray-800 dark:text-gray-200 mr-1.5">
                      {pm.sender?.name}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {stripActionTokensFromText(pm.content)}
                    </span>
                  </div>
                  {!isImpersonating && (
                    <button
                      type="button"
                      onClick={() => handleTogglePinMsg(pm.id)}
                      className="text-[10px] font-semibold text-amber-700 hover:text-red-600 shrink-0"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGE STREAM */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto p-6 space-y-5 z-10 relative custom-scrollbar"
      >
        {/* SLACK-STYLE CONVERSATION HERO BANNER */}
        {activeConvoDetails?.type === 'DIRECT' && otherParticipant && (
          <div className="pb-5 mb-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50/70 dark:bg-gray-800/30 p-4 rounded-2xl">
            <EmployeeAvatar
              emp={otherParticipant}
              presence={presence}
              className="w-14 h-14 shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {otherParticipant.name}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleTagStyle(
                    otherParticipant.role
                  )}`}
                >
                  {getRoleDisplayLabel(otherParticipant.role)}
                </span>
                {otherStatus && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {otherStatus.emoji} {otherStatus.text}
                  </span>
                )}
                {otherParticipant.email && (
                  <span className="text-xs text-gray-400 font-mono">{otherParticipant.email}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                This is the very beginning of your direct message history with{' '}
                <strong className="text-gray-800 dark:text-gray-200">{otherParticipant.name}</strong>
                . Messages sent here are private between the two of you.
              </p>
            </div>
          </div>
        )}

        {loading && filteredMessages.length === 0 ? (
          <div className="space-y-6 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
                )}
                <div
                  className={`w-64 h-16 rounded-2xl animate-pulse ${
                    i % 2 === 0
                      ? 'bg-indigo-200 dark:bg-indigo-900/40'
                      : 'bg-gray-200 dark:bg-gray-800/60'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col w-full relative gap-5">
            <AnimatePresence initial={false}>
              {filteredMessages.map((msg, index) => {
                if (!msg) return null;
                const isMe = msg.senderId === currentEmployeeId;
                const isBot = msg.sender?.role === 'System Bot';
                const isPinnedMsg = (msg.linkMetadata as any)?.isPinned === true;
                const showAvatar =
                  index === 0 || filteredMessages[index - 1]?.senderId !== msg.senderId;
                const reactionCounts: Record<string, { count: number; me: boolean }> = {};
                msg.reactions?.forEach((r: any) => {
                  if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, me: false };
                  reactionCounts[r.emoji].count++;
                  if (r.employeeId === currentEmployeeId) reactionCounts[r.emoji].me = true;
                });

                const isDeleted = msg.isDeleted;
                const parsedActions = !isDeleted ? extractActionTokens(msg.content) : [];
                const displayContent = !isDeleted
                  ? stripActionTokensFromText(msg.content)
                  : msg.content;
                const threadReplies =
                  msg.replies ||
                  filteredMessages.filter((r) => r.parentId === msg.id && !r.isDeleted);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 group ${isMe ? 'justify-end' : ''}`}
                  >
                    {!isMe && showAvatar && msg.sender ? (
                      <EmployeeAvatar emp={msg.sender} presence={presence} />
                    ) : (
                      !isMe && <div className="w-8 shrink-0" />
                    )}

                    <div
                      className={`max-w-[78%] ${
                        isMe ? 'items-end' : 'items-start'
                      } flex flex-col relative`}
                    >
                      {showAvatar && !isMe && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {msg.sender?.name}
                          </span>
                          {isBot && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                              <Bot size={10} /> Automated Bot
                            </span>
                          )}
                          {isPinnedMsg && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <Pin size={10} className="fill-amber-500" /> Pinned
                            </span>
                          )}
                        </div>
                      )}

                      {msg.parent && !isDeleted && (
                        <div
                          onClick={() => onOpenThread(msg.parent.id || msg.parentId)}
                          className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-1 text-gray-500 truncate w-full flex items-center gap-1 opacity-80 cursor-pointer hover:border-indigo-400"
                        >
                          <Reply size={12} className="shrink-0" />{' '}
                          <span className="truncate">
                            Thread reply to {msg.parent.sender?.name}:{' '}
                            {stripActionTokensFromText(msg.parent.content)}
                          </span>
                        </div>
                      )}

                      <div className="relative flex items-center gap-2 group/msg">
                        {!isImpersonating && !isDeleted && (
                          <motion.div
                            className={`opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-1 absolute ${
                              isMe ? 'right-full mr-2' : 'left-full ml-2'
                            } top-0 z-10`}
                          >
                            {!isMe && (
                              <button
                                onClick={() => toggleReaction(msg.id, '👍')}
                                title="React 👍"
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                              >
                                <Smile size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => onOpenThread(msg.id)}
                              title="Reply in Thread"
                              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-gray-500 hover:text-indigo-600"
                            >
                              <MessageSquare size={14} />
                            </button>
                            <button
                              onClick={() => handleTogglePinMsg(msg.id)}
                              title={isPinnedMsg ? 'Unpin from Channel' : 'Pin to Channel'}
                              className={`p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-lg ${
                                isPinnedMsg ? 'text-amber-600' : 'text-gray-500'
                              }`}
                            >
                              <Pin size={14} className={isPinnedMsg ? 'fill-amber-500' : ''} />
                            </button>
                            <button
                              onClick={() => toggleStarMessage(msg.id)}
                              title="Star Message"
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                            >
                              <Star size={14} />
                            </button>
                            {isMe && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingId(msg.id);
                                    setInputText(msg.content);
                                    setAttachmentUrl(msg.attachmentUrl || null);
                                  }}
                                  title="Edit"
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteMessage(msg.id);
                                    } catch (e: any) {
                                      toast.error(e.message || 'Failed to delete');
                                    }
                                  }}
                                  title="Delete"
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
                                >
                                  <Trash size={14} />
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}

                        <div
                          className={`px-5 py-3 rounded-2xl prose prose-sm dark:prose-invert break-words max-w-full shadow-sm flex flex-col ${
                            isDeleted
                              ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 italic rounded-b-md'
                              : isMe
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md prose-p:text-white prose-a:text-indigo-100 prose-strong:text-white'
                              : isBot
                              ? 'bg-amber-50/70 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 rounded-bl-md border-l-4 border-amber-500 border border-amber-200/60 dark:border-amber-500/30'
                              : 'bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200/60 dark:border-gray-700/50'
                          }`}
                        >
                          {isDeleted ? (
                            <div className="flex items-center gap-2">
                              <Trash size={14} /> <span>🚫 This message was deleted</span>
                            </div>
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
                              <ReactMarkdown components={MarkdownComponents}>
                                {displayContent}
                              </ReactMarkdown>

                              {/* INTERACTIVE SLACK BLOCK KIT ACTION BUTTONS (FEATURE 2) */}
                              {parsedActions.length > 0 && canExecuteActions && !isImpersonating && (
                                <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-gray-700/60 flex flex-wrap gap-2 not-prose">
                                  {parsedActions.map((act, idx) => {
                                    if (act.type === 'EXPENSE') {
                                      return (
                                        <div
                                          key={`${act.type}-${act.id}-${idx}`}
                                          className="flex items-center gap-1.5 flex-wrap"
                                        >
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(
                                                msg.id,
                                                'APPROVE_EXPENSE',
                                                act.id
                                              )
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <CheckCircle2 size={12} /> Approve Expense
                                          </button>
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(
                                                msg.id,
                                                'REJECT_EXPENSE',
                                                act.id
                                              )
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <XCircle size={12} /> Reject
                                          </button>
                                        </div>
                                      );
                                    }

                                    if (act.type === 'DEMO') {
                                      return (
                                        <div
                                          key={`${act.type}-${act.id}-${idx}`}
                                          className="flex items-center gap-1.5 flex-wrap"
                                        >
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(msg.id, 'VERIFY_DEMO', act.id)
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <CheckCircle2 size={12} /> Verify Field Demo
                                          </button>
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(msg.id, 'FLAG_DEMO', act.id)
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <Flag size={12} /> Flag Re-Demo
                                          </button>
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(msg.id, 'CONVERT_LEAD', act.id)
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <Rocket size={12} /> Mark Converted
                                          </button>
                                        </div>
                                      );
                                    }

                                    if (act.type === 'TRIAL') {
                                      return (
                                        <div
                                          key={`${act.type}-${act.id}-${idx}`}
                                          className="flex items-center gap-1.5 flex-wrap"
                                        >
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(
                                                msg.id,
                                                'ADVANCE_TRIAL_STAGE',
                                                act.id
                                              )
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <ArrowRight size={12} /> Advance Trial Stage
                                          </button>
                                          <button
                                            type="button"
                                            disabled={executingActionKey !== null}
                                            onClick={() =>
                                              handleBlockKitAction(
                                                msg.id,
                                                'CONVERT_TRIAL_LIVE',
                                                act.id
                                              )
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                                          >
                                            <Rocket size={12} /> Convert to Live Venue
                                          </button>
                                        </div>
                                      );
                                    }

                                    return null;
                                  })}
                                </div>
                              )}
                            </>
                          )}
                          <div className="text-[10px] opacity-60 flex justify-end items-center mt-1 gap-1 w-full text-right">
                            {msg.isEdited && !isDeleted && <span>(Edited)</span>}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {isMe && !isDeleted && renderMessageStatus(msg)}
                          </div>
                        </div>
                      </div>

                      {/* SLACK THREAD SUMMARY BAR (FEATURE 3) */}
                      {threadReplies.length > 0 && !isDeleted && (
                        <button
                          type="button"
                          onClick={() => onOpenThread(msg.id)}
                          className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/50 text-xs font-bold text-indigo-600 dark:text-indigo-300 transition-colors"
                        >
                          <MessageSquare size={12} />
                          <span>
                            {threadReplies.length}{' '}
                            {threadReplies.length === 1 ? 'reply' : 'replies'}
                          </span>
                          <span className="text-[10px] font-normal text-gray-500">
                            • View thread →
                          </span>
                        </button>
                      )}

                      {Object.keys(reactionCounts).length > 0 && !isDeleted && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {Object.entries(reactionCounts).map(([emoji, data]: [string, any]) => (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              key={emoji}
                              onClick={() => !isImpersonating && toggleReaction(msg.id, emoji)}
                              className={`text-xs px-2.5 py-1 rounded-full border ${
                                data.me
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300'
                                  : 'bg-white/50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300'
                              }`}
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

      {/* COMPOSER & SLACK SLASH COMMAND BAR */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-white/40 dark:border-gray-700/40 shrink-0 flex flex-col gap-2 z-20 relative">
        {/* @MENTION AUTOCOMPLETE POPOVER (FEATURE 1) */}
        {mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-40">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Mention Person or Group
            </div>
            {mentionCandidates.map((cand) => (
              <button
                key={cand.id}
                type="button"
                onClick={() => insertMention(cand.name)}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200">@{cand.name}</span>
                <span className="text-[10px] text-gray-400">{cand.role}</span>
              </button>
            ))}
          </div>
        )}

        {/* CRM ENTITY PICKER POPOVER (FEATURE 4) */}
        {crmPickerOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-96 max-w-[92vw] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 z-40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Target size={14} className="text-indigo-500" /> Share CRM Lead or 21-Day Trial
              </span>
              <button
                type="button"
                onClick={() => setCrmPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Filter leads or trial venues..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingCrm ? (
                <p className="text-xs text-gray-400 text-center py-4">Loading CRM records...</p>
              ) : (
                <>
                  {crmEntities.leads.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase text-gray-400 px-1 mb-1">
                        CRM Leads
                      </div>
                      {crmEntities.leads.map((lead) => (
                        <button
                          key={lead.leadId}
                          type="button"
                          onClick={() => handleShareCrmEntity('LEAD', lead)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            🎯 {lead.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shrink-0">
                            {lead.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {crmEntities.trials.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase text-gray-400 px-1 mb-1">
                        21-Day Trial Venues
                      </div>
                      {crmEntities.trials.map((trial) => (
                        <button
                          key={trial.id}
                          type="button"
                          onClick={() => handleShareCrmEntity('TRIAL', trial)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            <Store size={12} className="inline mr-1 text-amber-500" />
                            {trial.venueName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0">
                            {trial.onboardingStatus}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {crmEntities.leads.length === 0 && crmEntities.trials.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">
                      No matching CRM leads or trials found.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!isImpersonating && !(activeConvoDetails?.isReadOnly && !isManagerOrHR) && (
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
              <Terminal size={11} /> Bot Commands:
            </span>
            {[
              { cmd: '/actions', label: '⚡ /actions (Interactive Approvals)' },
              { cmd: '/coo-status', label: '/coo-status (Hours & Vesting)' },
              { cmd: '/trials', label: '/trials (21-Day Trials)' },
              { cmd: '/pipeline', label: '/pipeline (CRM Funnel)' },
              { cmd: '/lead', label: '/lead (Latest Leads)' },
              { cmd: '/help', label: '/help' },
            ].map((item) => (
              <button
                key={item.cmd}
                type="button"
                disabled={isSending}
                onClick={() => executeOrSendText(item.cmd)}
                className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-950/60 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCrmPickerOpen(!crmPickerOpen)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center gap-1 ml-auto"
            >
              <Target size={11} /> Share Lead / Trial
            </button>
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-700 text-sm">
            <span className="text-gray-500 truncate flex-1">
              <Reply size={14} className="inline mr-1" /> Replying to {replyingTo.sender?.name}:{' '}
              {replyingTo.content}
            </span>
            <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        )}
        {editingId && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-t-xl border-x border-t border-indigo-200 dark:border-indigo-800 text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 truncate flex-1">
              <Edit size={14} className="inline mr-1" /> Editing message...
            </span>
            <button
              onClick={() => {
                setEditingId(null);
                setInputText('');
                setAttachmentUrl(null);
              }}
              className="text-indigo-400 hover:text-indigo-600"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {attachmentUrl && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 border-x border-t border-gray-200 dark:border-gray-700 text-sm">
            <span className="text-gray-500 truncate flex-1">
              <Paperclip size={14} className="inline mr-1" /> Attachment ready
            </span>
            <button onClick={() => setAttachmentUrl(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        )}

        {isImpersonating || (activeConvoDetails?.isReadOnly && !isManagerOrHR) ? (
          <div
            className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-500 italic text-center text-sm ${
              replyingTo || editingId || attachmentUrl ? 'rounded-b-xl' : 'rounded-full'
            }`}
          >
            {isImpersonating
              ? 'Sending messages is disabled in God Mode.'
              : 'This channel is read-only.'}
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              type="button"
              onClick={handleAttach}
              disabled={isUploading}
              title="Attach image or PDF"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={
                editingId
                  ? 'Edit message...'
                  : `Message ${
                      activeConvoDetails?.type === 'GROUP'
                        ? activeConvoDetails.name
                        : otherParticipant
                        ? `@${otherParticipant.name}`
                        : 'conversation'
                    } (type @ to mention, / for bot commands)...`
              }
              className={`flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 ${
                replyingTo || editingId || attachmentUrl ? 'rounded-b-xl' : 'rounded-full'
              }`}
            />
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachmentUrl) || isSending}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 text-white px-6 rounded-full font-bold text-sm"
            >
              {editingId ? 'Save' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
