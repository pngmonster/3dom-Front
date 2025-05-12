import { ChatOut, MessageOut } from '../api/types';
import { Chat, Message } from '../types';

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


export function transformMessageOut(messageOut: MessageOut): Message {
  return {
    id: messageOut.id ?? '', // fallback для null
    parent_id: messageOut.parent_id ?? null,
    res_ids: messageOut.res_ids ?? [],
    content: messageOut.content,
    role: messageOut.role,
    created_at: messageOut.created_at
  };
}

export function transformMessages(messageOutList: MessageOut[]): Message[] {
  return messageOutList.map(transformMessageOut);
}
