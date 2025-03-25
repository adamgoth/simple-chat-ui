export interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  llm?: string;
  created_at?: string;
  conversation_id?: number;
}

export interface Conversation {
  id: number;
  userId: string;
  title: string;
  model: string;
  llm: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}
