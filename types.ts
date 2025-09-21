
export type Role = 'user' | 'model';

export interface Persona {
  id: string;
  name: string;
  avatar: React.FC<React.SVGProps<SVGSVGElement>>;
  description: string;
  expertise: string;
  greeting: string;
}

export interface Message {
  id: string;
  text: string;
  role: Role;
  timestamp: Date;
  personaId?: string;
  isError?: boolean;
}

export interface ChatState {
  personas: Persona[];
  activePersonaId: string;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  setActivePersonaId: (id: string) => void;
  addMessage: (message: Message) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}
