import React from 'react';

interface MessageProps {
    message: {
        id: string;
        text: string;
        isUser: boolean;
        timestamp: Date;
    };
}

export default function Message({ message }: MessageProps) {
    return (
        <div className={`message ${message.isUser ? 'user' : 'bot'}`}>
            <div className="message-content">{message.text}</div>
            <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
            </div>
        </div>
    );
}