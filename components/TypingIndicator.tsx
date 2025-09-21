
import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-2xl shadow-sm">
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
