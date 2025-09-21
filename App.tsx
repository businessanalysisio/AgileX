
import React from 'react';
import { PersonaSelector } from './components/PersonaSelector';
import { ChatInterface } from './components/ChatInterface';
import { ChatInput } from './components/ChatInput';
import { useChatStore } from './store/chatStore';
import { getAiResponse } from './services/geminiService';

const App: React.FC = () => {
  const { addMessage, setIsLoading, messages, activePersonaId, personas } = useChatStore();
  const activePersona = personas.find(p => p.id === activePersonaId);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || !activePersona) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      role: 'user' as const,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const fullHistory = [...messages, userMessage];
      const aiResponseText = await getAiResponse(fullHistory, activePersona);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        role: 'model' as const,
        personaId: activePersona.id,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        role: 'model' as const,
        personaId: activePersona.id,
        timestamp: new Date(),
        isError: true,
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans antialiased text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm p-4 z-10">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">AgileX Team AI Chat</h1>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
        <PersonaSelector />
        <ChatInterface />
        <ChatInput onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

export default App;
