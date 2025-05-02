// src/components/ChatWindow.tsx
import React from 'react';
import { Chat, Message as MessageType } from '../App';
import Message from './Message';

interface ChatWindowProps {
    chat: Chat | null;
    inputMessage: string;
    setInputMessage: (text: string) => void;
    onSend: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    chat,
    inputMessage,
    setInputMessage,
    onSend
}) => {
    return (
        <div className="chat-window">
            {chat ? (
                <>
                    <div className="chat-header">
                        <h3>{chat.title}</h3>
                    </div>

                    <div className="messages-container">
                        {chat.messages.map((message: MessageType) => (
                            <Message key={message.id} message={message} />
                        ))}
                    </div>

                    <div className="input-area">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && onSend()}
                            placeholder="Введите сообщение..."
                        />
                        <button onClick={onSend}>Отправить</button>
                    </div>
                </>
            ) : (
                <div className="empty-chat">
                    <p>Выберите или создайте чат</p>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;