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
  