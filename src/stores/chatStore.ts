// Chat store using Zustand
import { create } from 'zustand';
import type { Message, Mode, Level, ChatContext } from '@/lib/types';

interface ChatState {
  // Current session
  sessionId: string | null;
  mode: Mode | null;
  level: Level;
  context: ChatContext;

  // Messages
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Streaming
  streamingMessageId: string | null;

  // Actions
  setSession: (sessionId: string, mode: Mode) => void;
  setLevel: (level: Level) => void;
  setContext: (context: Partial<ChatContext>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  reset: () => void;
  startStreaming: (messageId: string) => void;
  appendStreamToken: (token: string) => void;
  finishStreaming: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  sessionId: null,
  mode: null,
  level: 'BEGINNER',
  context: {},
  messages: [],
  isLoading: false,
  error: null,
  streamingMessageId: null,

  // Actions
  setSession: (sessionId, mode) =>
    set({ sessionId, mode, messages: [], error: null }),

  setLevel: (level) => set({ level }),

  setContext: (context) =>
    set((state) => ({ context: { ...state.context, ...context } })),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearChat: () => set({ messages: [], error: null }),

  reset: () =>
    set({
      sessionId: null,
      mode: null,
      level: 'BEGINNER',
      context: {},
      messages: [],
      isLoading: false,
      error: null,
      streamingMessageId: null,
    }),

  startStreaming: (messageId) =>
    set({ streamingMessageId: messageId }),

  appendStreamToken: (token) => {
    const { streamingMessageId, messages } = get();
    if (!streamingMessageId) return;
    set({
      messages: messages.map((m) =>
        m.id === streamingMessageId ? { ...m, content: m.content + token } : m
      ),
    });
  },

  finishStreaming: () =>
    set({ streamingMessageId: null }),
}));

// Helper to convert messages to API format
export function messagesToHistory(
  messages: Message[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }));
}
