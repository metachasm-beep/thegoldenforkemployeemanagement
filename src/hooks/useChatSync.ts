import { useState, useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher';
import { getMessages, markAsRead, setPresenceStatus } from '@/app/chatActions';

export function useChatSync(
  currentEmployeeId: string,
  activeConversationId: string | null,
  isImpersonating: boolean,
  setConversations: React.Dispatch<React.SetStateAction<any[]>>
) {
  const [messages, setMessages] = useState<any[]>([]);
  const [presence, setPresence] = useState<Record<string, 'online' | 'away' | 'offline'>>({});
  const [loading, setLoading] = useState(false);

  // Global Presence & Status tracking
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

  // Conversation messaging sync
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    setLoading(true);
    getMessages(activeConversationId, isImpersonating ? currentEmployeeId : undefined).then(data => {
      if (isMounted) {
        setMessages(data);
        setLoading(false);
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
  }, [activeConversationId, isImpersonating, currentEmployeeId, setConversations]);

  return { messages, setMessages, presence, loading };
}
