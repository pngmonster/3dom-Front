// src/api/chats.ts
import api from './client';
import { ChatIn, ChatOut } from './types';

export async function createChat(payload: ChatIn) {
  const res = await api.post('api/chat-service/create', payload);
  return res.data;
}

export async function createChatAuto(query: string, payload: ChatIn) {
  const res = await api.post(`api/chat-service/create-auto?query=${encodeURIComponent(query)}`, payload);
  console.log()
  return res.data;
}

export async function getChat(chatId: string): Promise<ChatOut> {
  const res = await api.get(`api/chat-service/get/${chatId}`);
  return res.data;
}

export async function getAllChats(telegramId: number): Promise<ChatOut[]> {
  const res = await api.get(`api/chat-service/get-all/${telegramId}`);
  return res.data;
}

export async function deleteChat(chatId?: string) {
  const url = chatId ? `api/chat-service/delete?chat_id=${encodeURIComponent(chatId)}` : '/delete';
  const res = await api.delete(url);
  return res.data;
}

