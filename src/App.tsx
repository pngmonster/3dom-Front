import React, { useState, useRef, useEffect, useContext } from 'react';
import './ChatApp.css';
import { Chat, ChatMenu, Message, Model, ReplyContext, Settings, TelegramUser } from './types';
import { useChats } from './hooks/useChats';
import { useMessages, useStreamMessage } from './hooks/useMessages';
import { MessageIn } from './api/types';
import { MessageThread } from './components/message'
import { v4 as uuidv4 } from 'uuid';
import { useUploadFile } from './hooks/useFile';


const ChatApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    isOpen: false,
    theme: 'light'
  });

  // Получаем данные пользователя из Telegram WebApp
  const user: TelegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id:11,
    first_name: 'Гость',
    photo_url: 'https://via.placeholder.com/100'
  };


  const [inputText, setInputText] = useState('');
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [chatMenu, setChatMenu] = useState<ChatMenu>({
    chatId: null,
    isOpen: false,
    position: null
  });


  //____________MODELS_____________________________________________________________
  // Это три модели которые есть в backend
  const [models, setModel] = useState<Model[]>([
    { id: 'llama2', name: 'Llama 2' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek' },
    { id: 'mistral', name: 'Mistral' },
  ]);
  const [activeModel, setActiveModel] = useState<string>('llama2');
  //_____________________________________________________________________________________________

//_____________CHATS__________________________________________________________________________
  const {chats, setChats, createAuto, delChat} = useChats(user.id)
  const [activeChat, setActiveChat] = useState<string>('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Переключение чата
  const handleChatChange = async (chatId: string) => {
    // Удаляем предыдущий чат, если он пустой
    setChats(prev => {
      const prevChat = prev.find(c => c.id === activeChat);
      if (prevChat?.isEmpty) {
        return prev.filter(c => c.id !== activeChat);
      }
      return prev;
    });

    setActiveChat(chatId);
    setIsMenuOpen(false);

    // Сбрасываем непрочитанные
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, unreadCount: 0 }
        : chat
    ));

  };

  // Фокус на поле ввода при создании чата
  useEffect(() => {
    if (isCreatingChat && newChatInputRef.current) {
      newChatInputRef.current.focus();
    }
  }, [isCreatingChat]);

  // Создание нового чата
  const handleCreateChat = async (modelId: string) => {
    // Пустой чат заглушка
    const newChat: Chat = {
      id: "0",
      title: `Чат ${chats.filter(c => c.model === modelId).length + 1}`,
      lastMessage: 'Новый чат создан',
      model: modelId,
      isEmpty: true, // Теперь это допустимо
    };

    setChats(prev => [...prev, newChat]);

    // Чтобы сообщения в новом чате не ссылались на сообщения из других чатов
    setParent(null)
    await handleChatChange(newChat.id);
   
  };

  // Получение чатов по моделям
  const getChatsByModel = (modelId: string) => {
    return chats.filter(chat => chat.model === modelId);
  };

  // Переименование чата, бэк не поддерживает((
  const handleRenameChat = (newName: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatMenu.chatId ? { ...chat, title: newName } : chat
    ));
    setChatMenu({ chatId: null, isOpen: false, position: null });
  };

  // Удаление чата
  const handleDeleteChat = () => {
    if (!chatMenu.chatId) return;

    setChats(prev => prev.filter(chat => chat.id !== chatMenu.chatId));
    if (activeChat === chatMenu.chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatMenu.chatId);
      setActiveChat(remainingChats[0]?.id || '');
    }
    delChat(chatMenu.chatId)

    setChatMenu({ chatId: null, isOpen: false, position: null });
  };
//_____________________________________________________________________________

  

//__________________MESSAGES_________________________
  const {messages, setMessages, send} = useMessages(activeChat);
  const [parentId, setParent] = useState<string | null>(null);
  const { chunks, error, start } = useStreamMessage(activeChat);
  const [rootID, setRootID] = useState<string | null>(null)
  const {upload} = useUploadFile();


  // Используется для стриминга сообщений от LLM
  useEffect(() => {
    if (chunks.length > 0) {
      setMessages(prevMessages => {
        if (prevMessages.length === 0) return prevMessages;
  
        const updatedMessages = [...prevMessages];
        const lastIndex = updatedMessages.length - 1;
  
        updatedMessages[lastIndex] = {
          ...updatedMessages[lastIndex],
          content: chunks.join(""),
        };
  
        return updatedMessages;
      });
    }
  }, [chunks, parentId]);

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const handleSendMessage = async () => {    
    if (!inputText.trim() && !attachment) return;
    const currentChat = chats.find(chat => chat.id === activeChat);
    let requestMessage: MessageIn;
    let newMsg: Message;


    // Если текущий чат пустой, то вначале создается с автоматическим название чат
    // Используя его newChatId создаю новое сообщение юзера и стримлю ответ на это сообщение
    // Затем когда стриминг закончился итоговый ответ LLM сохраняю и только тогда меня текущий чат на сгенерированный
    if (!currentChat || currentChat.isEmpty) {
      const newChatId = await createAuto(inputText, { telegram_id: user.id, model: activeModel, title: 'ЧБД' });

      requestMessage = {
        chat_id: newChatId,
        parent_id: null,
        res_ids: res_ids.ids,
        role: 'user',
        content: inputText,
      };
      newMsg = await send(requestMessage);
      setParent(newMsg.id);

      setInputText('');
      setAttachment(null);
      setReplyContext(null);

      
      const tempId = uuidv4();
      const newResponse: Message = {
        id: tempId,
        parent_id: newMsg.id,
        res_ids: newMsg.res_ids,
        role: "assistant",
        content: "",
      }
      setMessages(prev => [...prev, newResponse])


      const fullResponse = await start(newMsg.id);


      
      const requestMessageAs: MessageIn = {
        chat_id: requestMessage.chat_id,
        parent_id: newMsg.id,
        res_ids: newMsg.res_ids,
        role: "assistant",
        content: fullResponse,
      };

      const responseAs = await send(requestMessageAs);
      setRootID(responseAs.id)
      // Заменить временное сообщение (id === "0") на настоящее
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? responseAs  // ✅ подставляем настоящее сообщение
            : msg
        )
      );
      setRes({ids:[]})
      await handleChatChange(newChatId);
      return;
    } else {
      requestMessage = {
        chat_id: activeChat,
        parent_id: replyContext ? replyContext.messageId: rootID,
        res_ids: res_ids.ids,
        role: 'user',
        content: inputText,
      };
      newMsg = await send(requestMessage);
      setParent(newMsg.id);
      setRes({ids:[]})


    }

    setInputText('');
    setAttachment(null);
    setReplyContext(null);

    const tempId = uuidv4();
    const newResponse: Message = {
      id: tempId,
      parent_id: newMsg.id,
      res_ids: newMsg.res_ids,
      role: "assistant",
      content: "",
    }
    setMessages(prev => [...prev, newResponse])


    const fullResponse = await start(newMsg.id);

    const requestMessageAs: MessageIn = {
      chat_id: requestMessage.chat_id,
      parent_id: newMsg.id,
      res_ids: newMsg.res_ids,
      role: "assistant",
      content: fullResponse,
    };

    const responseAs = await send(requestMessageAs);
    setRootID(responseAs.id)
    // Заменить временное сообщение (id === "0") на настоящее
    setMessages(prev =>
      prev.map(msg =>
        msg.id === tempId
          ? responseAs  // ✅ подставляем настоящее сообщение
          : msg
      )
    );
    
    // Обновляем последнее сообщение в списке чатов
    setChats(prev => prev.map(chat =>
      chat.id === activeChat
        ? { ...chat, lastMessage: inputText || 'Вложение', unreadCount: 0 }
        : chat
    ));
  };


  const [res_ids, setRes] = useState<{ ids: string[] }>({ids:[]})
  const [childIndexes, setChildIndexes] = useState<{ [parentId: string]: number }>({});

//___________________________________________________________



  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newChatInputRef = useRef<HTMLInputElement>(null);

  // Темы
  useEffect(() => {
    // Простая проверка темы без использования Telegram API
    const isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const theme = isDarkMode ? 'dark' : 'light';

    // Применяем тему
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, []);

  // Упрощенная функция смены темы
  const toggleTheme = () => {
    const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
  };

  // Обработчик вложения файла
  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      //setAttachment(e.target.files[0]);
      const res = await upload(activeChat, e.target.files[0])
      // получаем id чанков файла и сохраняем их в следующее сообщение
      setRes(res)
      await send({chat_id: activeChat, role: "user", content: e.target.files[0].name})
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleOpenMenu = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setChatMenu({
      chatId,
      isOpen: true,
      position: { top: rect.bottom + 5, left: rect.left - 100 }
    });
  };


  return (
    <div className="chat-app">
      {/* Заголовок чата - убираем кнопку создания */}
      <div className="chat-header">
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </button>
        <h2>{chats.find(c => c.id === activeChat)?.title || 'Выберите чат'}</h2>
        {activeChat && (
          <button
            className="create-chat-button"
            onClick={() => {
              const currentModel = chats.find(c => c.id === activeChat)?.model || activeModel;
              handleCreateChat(currentModel);
            }}
          >
            ＋
          </button>
        )}
      </div>

      {/* Боковое меню */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button
          className="settings-button"
          onClick={() => setSettings(prev => ({ ...prev, isOpen: true }))}
        >
          ⚙️
        </button>
        {settings.isOpen && (
          <div className="settings-modal">
            <div className="settings-content">
              <button
                className="close-settings"
                onClick={() => setSettings(prev => ({ ...prev, isOpen: false }))}
              >
                ×
              </button>

              <div className="user-profile">
                <img
                  src={user.photo_url || 'https://via.placeholder.com/100'}
                  alt="Аватар"
                  className="user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                  }}
                />
                <h3>
                  {[user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Пользователь'}
                </h3>
                {user.username && <p>@{user.username}</p>}
                {user.language_code && <p>Язык: {user.language_code.toUpperCase()}</p>}
              </div>

              <div className="theme-switcher">
                <button
                  onClick={() => {
                    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
                    setSettings(prev => ({ ...prev, theme: newTheme }));
                    // Здесь можно добавить логику смены темы в Telegram WebApp
                  }}
                >
                  {settings.theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
                </button>
              </div>
            </div>
            <div
              className="settings-overlay"
              onClick={() => setSettings(prev => ({ ...prev, isOpen: false }))}
            />
          </div>
        )}

        <div className="menu-header">
          <h3>Мои чаты</h3>
          <button className="close-menu" onClick={() => setIsMenuOpen(false)}>
            ×
          </button>
        </div>

        <div className="categories-tabs">
          {models.map(model => (
            <button
              key={model.id}
              className={`category-tab ${activeModel === model.id ? 'active' : ''}`}
              onClick={() => setActiveModel(model.id)}
            >
              {model.name}
            </button>
          ))}
        </div>

        <div className="chat-list">
          {/* Добавляем кнопку создания чата в категорию */}
          <button
            className="create-chat-in-category small"
            onClick={() => handleCreateChat(activeModel)}
          >
            ＋ Создать чат
          </button>

          {getChatsByModel(activeModel).length > 0 ? (
            [...getChatsByModel(activeModel)].reverse().map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
                onClick={() => handleChatChange(chat.id)}
              >
                <div className="chat-info">
                  <div className="chat-title">{chat.title}</div>
                  <div className="chat-preview">
                    {chat.lastMessage?.substring(0, 30)}{chat.lastMessage && chat.lastMessage.length > 30 ? '...' : ''}
                  </div>
                </div>

                <div className="chat-actions">
                  <button className="chat-menu-button" onClick={(e) => handleOpenMenu(chat.id, e)}>
                    ⋮
                  </button>
                  {chatMenu.isOpen && (
                    <>
                      <div
                        className="menu-overlay"
                        onClick={() => setChatMenu({ chatId: null, isOpen: false, position: null })}
                      />
                      <div
                        className="chat-context-menu"
                        style={{
                          top: `${chatMenu.position?.top}px`,
                          left: `${chatMenu.position?.left}px`
                        }}
                      >
                        <button
                          className="menu-item"
                          onClick={() => {
                            const newName = prompt('Введите новое название:',
                              chats.find(c => c.id === chatMenu.chatId)?.title);
                            if (newName) handleRenameChat(newName);
                          }}
                        >
                          Переименовать
                        </button>
                        <button
                          className="menu-item delete"
                          onClick={handleDeleteChat}
                        >
                          Удалить чат
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-chats">
              Нет чатов в этой категории
            </div>
          )}
        </div>
      </div>


      {/* Затемнение фона при открытом меню */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />
      )}


      {/* Ветки сообщений */}
      <div className="messages-container">
          {messages
            .filter(msg => msg.parent_id === null)
            .map((root) => (
              <MessageThread
                key={root.id}
                message={root}
                messages={messages}
                childIndexes={childIndexes}
                setChildIndexes={setChildIndexes}
                onLastMessageIdChange={(id) => {
                  console.log('Current last message ID:', id);
                  setRootID(id)
                }}
                setReplyContext={setReplyContext}
              />
            ))}
        </div>


      {/* Панель ввода (только если выбран чат) */}
      {activeChat && (
        <div className="input-area">
          {replyContext && (
            <div className="reply-preview">
              Ответ на: {replyContext.messageText}
              <button onClick={() => setReplyContext(null)}>×</button>
            </div>
          )}

          <div className="input-container">
            <button
              className="attach-button"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAttachment}
              style={{ display: 'none' }}
              accept=".pdf"
            />

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              rows={1}
            />

            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !attachment}
            >
              {attachment ? '📤' : '➤'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;