
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatState, Message } from '../types';
import { AGILEX_TEAM } from '../constants';

const initialPersona = AGILEX_TEAM[0];

const initialMessages: Message[] = [
  {
    id: 'initial-greeting',
    text: initialPersona.greeting,
    role: 'model',
    personaId: initialPersona.id,
    timestamp: new Date(),
  },
];

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      personas: AGILEX_TEAM,
      activePersonaId: initialPersona.id,
      messages: initialMessages,
      isLoading: false,
      error: null,
      setActivePersonaId: (id: string) => set((state) => {
        const newPersona = state.personas.find(p => p.id === id);
        if (newPersona && state.activePersonaId !== id) {
          const newGreeting: Message = {
            id: `greeting-${id}-${Date.now()}`,
            text: newPersona.greeting,
            role: 'model',
            personaId: newPersona.id,
            timestamp: new Date(),
          };
          return { activePersonaId: id, messages: [...state.messages, newGreeting] };
        }
        return { activePersonaId: id };
      }),
      addMessage: (message: Message) => set((state) => ({ messages: [...state.messages, message] })),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'agilex-chat-storage', 
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        }
      }),
      partialize: (state) => ({
        // Only persist messages and active persona
        messages: state.messages,
        activePersonaId: state.activePersonaId,
      }),
    }
  )
);
