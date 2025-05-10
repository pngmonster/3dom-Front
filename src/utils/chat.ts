import { ChatOut } from '../api/types';
import { Chat } from '../types';

export function transformChatOut(chatOut: ChatOut): Chat {
  return {
    id: chatOut.id ?? '', // fallback для null
    title: chatOut.title,
    model: chatOut.model,
    created_at: chatOut.created_at,
    isEmpty: false, // можно вычислить, если нужно
  };
}

export function transformChats(chatOutList: ChatOut[]): Chat[] {
  return chatOutList.map(transformChatOut);
}
