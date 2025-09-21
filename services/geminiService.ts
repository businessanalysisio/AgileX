
import { GoogleGenAI, Chat } from "@google/genai";
import type { Persona, Message } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const chatInstances = new Map<string, Chat>();

const getChatInstance = (persona: Persona): Chat => {
  if (!chatInstances.has(persona.id)) {
    const newChat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: persona.description,
      },
    });
    chatInstances.set(persona.id, newChat);
  }
  return chatInstances.get(persona.id)!;
};


export const getAiResponse = async (history: Message[], persona: Persona): Promise<string> => {
  try {
    const chat = getChatInstance(persona);
    const lastUserMessage = history[history.length - 1];
    
    // We send only the last message to the chat instance, as it maintains history.
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
        return "Could not find the last user message to respond to.";
    }

    const result = await chat.sendMessage({ message: lastUserMessage.text });
    return result.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    // Invalidate chat session on error
    chatInstances.delete(persona.id); 
    throw new Error("Failed to communicate with the AI model.");
  }
};
