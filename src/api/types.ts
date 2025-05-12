export interface ChatIn {
    telegram_id: number;
    model: string;
    title: string;
  }
  
export interface ChatOut {
    id: string | null;
    telegram_id: number;
    model: string;
    title: string;
    token?: string;
    created_at: string;
  }
  

export interface MessageIn {
  chat_id: string | null;
  parent_id?: string | null;
  res_ids?: string[] | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MessageOut {
  id?: string | null;
  chat_id?: string | null;
  parent_id?: string | null;
  res_ids?: string[] | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ContextIn {
  ids: string[] | null;
  prompt: string | null;
}

export interface ContextOut {
  ids: string[] | null;
  prompt: string | null;
  context: string[];
}