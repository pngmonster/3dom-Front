// Типы для TypeScript


export type Message = {
  id: string;
  parent_id: string | null;
  res_ids?: string[] | null;
  role: 'user' | 'assistant' | 'system';
  content: string;

  created_at?: string;
  replyTo?: string;
  attachment?: {
    type: 'image' | 'document';
    url: string;
    name?: string;
  };
};

export type ReplyContext = {
  messageId: string;
  messageText: string;
};



export type Model = {
  id: string;
  name: string;
};

export type ChatMenu = {
  chatId: string | null;
  isOpen: boolean;
  position: { top: number; left: number } | null;
};
export type Settings = {
  isOpen: boolean;
  theme: 'light' | 'dark';
};

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type Chat = {
    id: string;
    title: string;
    model: string;
    lastMessage?: string;
    isEmpty?: boolean; // Делаем свойство необязательным
    created_at?: string;
  };