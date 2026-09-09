import { create } from "zustand";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  reactions?: any[];
  [key: string]: any;
}

interface Conversation {
  id: string;
  participants: any[];
  messages: Message[];
  updatedAt: string;
  [key: string]: any;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  presence: Record<string, "online" | "away" | "offline">;
  isLoading: boolean;
  
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setPresence: (userId: string, status: "online" | "away" | "offline") => void;
  setBulkPresence: (presenceRecord: Record<string, "online" | "away" | "offline">) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  presence: {},
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // Optimistic UI logic: prevent duplicates
    if (state.messages.some(m => m.id === message.id)) return state;
    
    const updatedConversations = [...state.conversations];
    const convoIndex = updatedConversations.findIndex(c => c.id === message.conversationId);
    if (convoIndex !== -1) {
      updatedConversations[convoIndex].messages = [message];
      updatedConversations[convoIndex].updatedAt = new Date().toISOString();
      const [moved] = updatedConversations.splice(convoIndex, 1);
      updatedConversations.unshift(moved);
    }
    
    return { 
      messages: [...state.messages, message],
      conversations: updatedConversations
    };
  }),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, ...updates } : m)
  })),

  setPresence: (userId, status) => set((state) => ({
    presence: { ...state.presence, [userId]: status }
  })),

  setBulkPresence: (presenceRecord) => set((state) => ({
    presence: { ...state.presence, ...presenceRecord }
  })),

  setLoading: (isLoading) => set({ isLoading })
}));

