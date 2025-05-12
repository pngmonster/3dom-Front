import React, { useEffect, useRef, useState } from 'react';
import type { Message, ReplyContext } from '../types';

type MessageThreadProps = {
  message: Message;
  messages: Message[];
  childIndexes: { [parentId: string]: number };
  setChildIndexes: React.Dispatch<React.SetStateAction<{ [parentId: string]: number }>>;
  onLastMessageIdChange?: (id: string) => void;
  setReplyContext: React.Dispatch<React.SetStateAction<ReplyContext | null>>;
};

export const MessageThread: React.FC<MessageThreadProps> = ({
  message,
  messages,
  childIndexes,
  setChildIndexes,
  onLastMessageIdChange,
  setReplyContext,
}) => {
  const children = messages.filter((m) => m.parent_id === message.id);
  const index = childIndexes[message.id] || 0;
  const selfRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    setChildIndexes((prev) => ({
      ...prev,
      [message.id]: (index + 1) % children.length,
    }));
  };

  const handlePrev = () => {
    setChildIndexes((prev) => ({
      ...prev,
      [message.id]: (index - 1 + children.length) % children.length,
    }));
  };

  // Если нет дочерних сообщений, мы — последний
  useEffect(() => {
    if (onLastMessageIdChange && children.length === 0) {
      onLastMessageIdChange(message.id);
    }
  }, [children.length, message.id, onLastMessageIdChange]);

  return (
    <>
      {message.parent_id === null && (
        <div className={`message ${message.role}`} ref={selfRef}>
          {message.content}
        </div>
      )}

      {children.length > 0 && (
        <div>
          <div 
          className={`message ${children[index].role}`} 
          ref={selfRef}
          onClick={() => 
            children[index].role==="assistant" && (setReplyContext({
            messageId: children[index].id,
            messageText: children[index].content,
          })) }
          >
            <div className="message-content">{children[index].content}</div>
            {children.length > 1 && children[index].role==="user"  &&(
              <div className="message-controls">
                <button onClick={handlePrev}>◀️</button>
                <button onClick={handleNext}>▶️</button>
              </div>
            )}
          </div>

          <MessageThread
            message={children[index]}
            messages={messages}
            childIndexes={childIndexes}
            setChildIndexes={setChildIndexes}
            onLastMessageIdChange={onLastMessageIdChange}
            setReplyContext={setReplyContext}
          />
        </div>
      )}
    </>
  );
};
