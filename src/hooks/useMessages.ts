// src/hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getMessages,
  createMessage,
  getMessage,
} from '../api/messages';
import { MessageIn, MessageOut } from '../api/types';
import { Message } from '../types';
import { transformMessageOut, transformMessages } from '../utils/transform';

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    fetchMessages()
  }, [chatId]);

  const fetchMessages = async () => {
      try {
        if (!chatId) { return; }
        const res = await getMessages(chatId);
        const trans = transformMessages(res)
        setMessages(trans);

      } catch (err) {
        console.error('Ошибка при получении чатов:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    const send = useCallback(
      async (msg: MessageIn) => {
        const newID = await createMessage(msg);
        const newMsg = await getMessage(newID);
        const newTransformed = transformMessageOut(newMsg);
    
        setMessages(prev => [...prev, newTransformed]);
    
        return newTransformed; // ✅ лучше использовать это, чем надеяться на messages
      },
      []
    );

  return { messages, setMessages, loading, error, send, fetchMessages};
}


export function useStreamMessage(chatId: string | null) {
  const { send } = useMessages(chatId);
  const [chunks, setChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    (id: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        setChunks([]);
        setError(null);

        const buffer: string[] = [];

        const evtSource = new EventSource(
          `https://giicoo.ru/api/message-service/stream?id=${encodeURIComponent(id)}`
        );

        evtSource.onmessage = e => {
          if (e.data === "[DONE]") {
            evtSource.close();
            const fullText = buffer.join('');
            resolve(fullText); // ✅ возвращаем все чанки как одну строку
            return;
          }

          buffer.push(e.data);
          setChunks(prev => [...prev, e.data]);
        };

        evtSource.onerror = e => {
          setError('Stream error');
          evtSource.close();
          reject(new Error('Stream error'));
        };
      });
    },
    []
  );

  return { chunks, error, start };
}
