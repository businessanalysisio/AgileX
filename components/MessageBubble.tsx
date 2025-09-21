
import React from 'react';
import type { Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { UserAvatar } from './icons';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { personas } = useChatStore();
  const isUser = message.role === 'user';
  
  const persona = !isUser ? personas.find(p => p.id === message.personaId) : null;
  const AvatarComponent = isUser ? UserAvatar : persona?.avatar || UserAvatar;

  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser
    ? 'bg-blue-500 text-white'
    : message.isError ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  const bubbleOrder = isUser ? 'flex-row-reverse' : 'flex-row';
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-end space-x-2 ${bubbleAlignment} ${bubbleOrder}`}>
      <div className="flex-shrink-0">
        <AvatarComponent className="w-8 h-8 rounded-full" />
      </div>
      <div className="max-w-md md:max-w-lg lg:max-w-xl">
        <div className={`px-4 py-2 rounded-2xl shadow-sm ${bubbleColor}`}>
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
        <p className={`text-xs text-gray-400 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
