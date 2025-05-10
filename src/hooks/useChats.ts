// src/hooks/useChats.ts
import { useEffect, useState } from 'react';
import { createChatAuto, deleteChat, getAllChats, getChat } from '../api/chat';
import { Chat } from '../types'
import { transformChatOut, transformChats } from '../utils/chat';
import { ChatIn } from '../api/types';

export function useChats(telegramId: number) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string>('1');


  useEffect(() => {
    fetchChats()
  }, [telegramId]);

  const fetchChats = async () => {
    try {
      const res = await getAllChats(telegramId);
      setChats(transformChats(res));
    } catch (err) {
      console.error('Ошибка при получении чатов:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAuto = async (query: string, payload: ChatIn): Promise<string>=> {
    try {
      const res = await createChatAuto(query, payload);
      await fetchChats(); // обновить после создания
      return res["chat_id"];
    } catch (err) {
      console.error('Ошибка при авто-создании чата:', err);
      return "1";
    }
  };

  const delChat = async (chat_id: string) => {
    try {
      await deleteChat(chat_id);
      await fetchChats(); // обновить после создания
      
    } catch (err) {
      console.error('Ошибка при удаление чата:', err);
    }
  };

  return {activeChat, setActiveChat, chats, loading, createAuto, setChats, delChat };
}
