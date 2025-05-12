import api from './client';
import { MessageIn, MessageOut } from './types';

// Создать сообщение
export async function createMessage(payload: MessageIn): Promise<string> {
  const res = await api.post('/api/message-service/message', payload);
  return res.data["id"];
}

// Получить одно сообщение по id
export async function getMessage(id: string): Promise<MessageOut> {
  const res = await api.get('/api/message-service/message', { params: { id } });
  return res.data;
}

// Получить все сообщения чата
export async function getMessages(chatId: string): Promise<MessageOut[]> {
  const res = await api.get('/api/message-service/messages', { params: { chat_id: chatId } });
  return res.data;
}
