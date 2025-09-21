
import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, personas, activePersonaId } = useChatStore();
  const activePersona = personas.find(p => p.id === activePersonaId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
      <div className="space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && activePersona && (
          <div className="flex items-end space-x-2">
            <div className="flex-shrink-0">
               <activePersona.avatar className="w-8 h-8 rounded-full text-gray-500"/>
            </div>
            <TypingIndicator />
          </div>
        )}
      </div>
    </div>
  );
};
