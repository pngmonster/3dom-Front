// src/components/ModelList.tsx
import React, { useState } from 'react';
import { LanguageModel, Chat } from '../App';

interface ModelListProps {
    models: LanguageModel[];
    activeModel: LanguageModel | null;
    setActiveModel: (model: LanguageModel) => void;
    activeChat: Chat | null;
    setActiveChat: (chat: Chat) => void;
}

const ModelList: React.FC<ModelListProps> = ({
    models,
    activeModel,
    setActiveModel,
    activeChat,
    setActiveChat
}) => {
    const [expandedModel, setExpandedModel] = useState<string | null>(null);

    const handleCreateChat = (modelId: string) => {
        const newChat: Chat = {
            id: `${modelId}-${Date.now()}`,
            title: `Новый чат ${new Date().toLocaleTimeString()}`,
            messages: []
        };

        setActiveChat(newChat);
        setExpandedModel(modelId);
    };

    return (
        <div className="model-list">
            <h3>Языковые модели</h3>
            {models.map(model => (
                <div key={model.id} className="model-item">
                    <div
                        className="model-header"
                        onClick={() => setExpandedModel(
                            expandedModel === model.id ? null : model.id
                        )}
                    >
                        <span>{model.name}</span>
                        <span>{expandedModel === model.id ? '▼' : '▶'}</span>
                    </div>

                    {expandedModel === model.id && (
                        <div className="chat-list">
                            {model.chats.map((chat: Chat) => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''
                                        }`}
                                    onClick={() => setActiveChat(chat)}
                                >
                                    {chat.title}
                                </div>
                            ))}

                            <button
                                className="new-chat-btn"
                                onClick={() => handleCreateChat(model.id)}
                            >
                                + Новый чат
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ModelList;