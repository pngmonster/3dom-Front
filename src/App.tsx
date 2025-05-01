import { useEffect } from 'react';

function App() {
  useEffect(() => {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();

    console.log("User data:", tg.initDataUnsafe?.user);
  }, []);

  return (
    <div className="App">
      <h1>Hello, Telegram Mini App!</h1>
      <button onClick={() => window.Telegram?.WebApp.close()}>
        Close App
      </button>
    </div>
  );
}

export default App;