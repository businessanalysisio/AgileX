
import React from 'react';
import { useChatStore } from '../store/chatStore';

export const PersonaSelector: React.FC = () => {
  const { personas, activePersonaId, setActivePersonaId, isLoading } = useChatStore();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 overflow-x-auto">
      <div className="flex space-x-2 justify-center">
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setActivePersonaId(persona.id)}
            disabled={isLoading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out w-24 h-24 flex-shrink-0
              ${activePersonaId === persona.id
                ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
              ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <persona.avatar className={`w-8 h-8 rounded-full mb-1 ${activePersonaId === persona.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <span className="text-xs font-medium text-center truncate w-full">{persona.name}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate w-full">{persona.expertise}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
