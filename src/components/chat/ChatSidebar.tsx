import { Search, Pin, Archive } from 'lucide-react';
import Image from 'next/image';
import { Employee } from '@/types';
import { InitialsAvatar, GroupAvatar } from './ChatAvatars';
import { togglePinConversation, toggleArchiveConversation } from '@/app/chatActions';

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
}: ChatSidebarProps) => {
  return (
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
  );
};
