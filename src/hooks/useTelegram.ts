import { useEffect, useState } from 'react';

// Типы для вашей версии Telegram WebApp
type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

type MainButton = {
  setParams: (params: { text: string; color?: string }) => void;
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  expand: () => void;
  close: () => void;
  enableClosingConfirmation?: () => void;
  MainButton: MainButton;
};

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tgWebApp = window.Telegram.WebApp as TelegramWebApp;
      setWebApp(tgWebApp);
      setUser(tgWebApp.initDataUnsafe?.user || null);

      // Расширяем на весь экран
      tgWebApp.expand();

      // Включаем подтверждение закрытия (если доступно)
      if (tgWebApp.enableClosingConfirmation) {
        tgWebApp.enableClosingConfirmation();
      }

      return () => {
        // В вашей версии disableClosingConfirmation отсутствует,
        // поэтому просто закрываем без подтверждения
        tgWebApp.close();
      };
    }
  }, []);

  const sendData = (data: object) => {
    // Альтернативная реализация отправки данных
    if (webApp?.MainButton) {
      webApp.MainButton.setParams({ text: 'Отправка...' });
      webApp.MainButton.onClick(() => {
        console.log('Data to send:', data);
        // Здесь можно добавить fetch к вашему бэкенду
      });
    } else {
      console.log('Data to send:', data);
    }
  };

  const closeWebApp = () => {
    webApp?.close();
  };

  return {
    webApp,
    user,
    sendData,
    closeWebApp,
    MainButton: webApp?.MainButton,
  };
};