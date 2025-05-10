import React, { useState, useRef, useEffect } from 'react';
import './ChatApp.css';
import { Category, Chat, ChatMenu, Message, ReplyContext, Settings, TelegramUser } from './types';
import { useChats } from './hooks/useChats';



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


  const [messages, setMessages] = useState<Message[]>([]);
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
  const [models, setModel] = useState<Category[]>([
    { id: 'llama2', name: 'Llama 2' },
    { id: 'deepseek-r1', name: 'DeepSeek' },
    { id: 'mistral', name: 'Mistral' },
  ]);
  const [activeModel, setActiveModel] = useState<string>('llama2');
  //_____________________________________________________________________________________________

//_____________CHATS__________________________________________________________________________
  // const [chats, setChats] = useState<Chat[]>([
  //   { id: '1', title: 'Чат 1', lastMessage: 'Привет! Я твой помощник', model: 'llama2' },
  //   { id: '2', title: 'Чат 2', lastMessage: 'Чем можем помочь?', model: 'deepseek-r1' },
  //   { id: '3', title: 'Чат 3', lastMessage: 'Частые вопросы', model: 'mistral' },
  // ]);
  const {chats, setChats, activeChat, setActiveChat, createAuto, delChat} = useChats(user.id)
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  // Переключение чата
  const handleChatChange = (chatId: string) => {
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

    setMessages([{
      id: '1',
      text: `Добро пожаловать в чат "${chats.find(c => c.id === chatId)?.title}"!`,
      sender: 'bot',
      timestamp: new Date(),
    }]);

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
  const handleCreateChat = (modelId: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Чат ${chats.filter(c => c.model === modelId).length + 1}`,
      lastMessage: 'Новый чат создан',
      model: modelId,
      isEmpty: true, // Теперь это допустимо
    };

    setChats(prev => [...prev, newChat]);
    handleChatChange(newChat.id);
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

  // Инициализация с приветственным сообщением
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: `Привет! Это чат "${chats.find(c => c.id === activeChat)?.title}". Чем могу помочь?`,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [activeChat]);

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  

  // Обработчик отправки сообщения
  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachment) return;
    const currentChat = chats.find(chat => chat.id === activeChat);

    if (currentChat?.isEmpty || currentChat===undefined) {
      //Создание чата с авто названием и делание его активным
      const res: string = await createAuto(inputText, {telegram_id:user.id, model:activeModel, title:"ЧБД"})
      handleChatChange(res)
    }
    
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      replyTo: replyContext?.messageId,
    };

    if (attachment) {
      const attachmentType = attachment.type.startsWith('image/') ? 'image' : 'document';
      userMessage.attachment = {
        type: attachmentType,
        url: URL.createObjectURL(attachment),
        name: attachment.name,
      };
    }

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachment(null);
    setReplyContext(null);

   
   

    // Обновляем последнее сообщение в списке чатов
    setChats(prev => prev.map(chat =>
      chat.id === activeChat
        ? { ...chat, lastMessage: inputText || 'Вложение', unreadCount: 0 }
        : chat
    ));

    // Имитация ответа бота
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText, replyContext),
        sender: 'bot',
        timestamp: new Date(),
        replyTo: userMessage.id,
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  // Генерация ответа бота
  const generateBotResponse = (userText: string, context: ReplyContext | null): string => {
    const responses = [
      "Я понял ваш запрос. Давайте обсудим это подробнее.",
      "Интересный вопрос! Давайте разберемся вместе.",
      "Спасибо за ваше сообщение. Я уже работаю над этим.",
      "Хорошо, я записал эту информацию. Что еще вас интересует?",
      "Отличное замечание! Давайте продолжим наш разговор."
    ];

    if (context) {
      return `Отвечая на ваше сообщение "${context.messageText}": ${responses[Math.floor(Math.random() * responses.length)]}`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Обработчик вложения файла
  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
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
            getChatsByModel(activeModel).map(chat => (
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

      {/* Область сообщений */}
      <div className="messages-container">
        {activeChat ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender}`}
              onClick={() => setReplyContext({
                messageId: message.id,
                messageText: message.text,
              })}
            >
              {message.replyTo && (
                <div className="reply-context">
                  {messages.find(m => m.id === message.replyTo)?.text}
                </div>
              )}

              {message.attachment && (
                <div className="attachment">
                  {message.attachment.type === 'image' ? (
                    <img src={message.attachment.url} alt="Прикрепленное изображение" />
                  ) : (
                    <a href={message.attachment.url} download>
                      📄 {message.attachment.name || 'Документ'}
                    </a>
                  )}
                </div>
              )}

              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        ) : (
          <div className="no-chat-selected">
            <p>Выберите чат из списка или создайте новый</p>
          </div>
        )}
        <div ref={messagesEndRef} />
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
              accept="image/*,.pdf,.doc,.docx"
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