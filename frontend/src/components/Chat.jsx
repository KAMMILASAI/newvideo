import React, { useState, useEffect, useRef } from 'react';
import '../styles/Chat.css';

const Chat = ({ roomCode, username, ws }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/rooms/chat/history/${roomCode}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    if (isOpen && roomCode) {
      loadChatHistory();
    }
  }, [roomCode, isOpen, API_URL]);

  // Handle incoming chat messages via WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleChatMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'chat') {
        setMessages(prev => [...prev, {
          username: message.username,
          message: message.message,
          timestamp: new Date(message.timestamp)
        }]);
      }
    };

    ws.addEventListener('message', handleChatMessage);

    return () => {
      ws.removeEventListener('message', handleChatMessage);
    };
  }, [ws]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    const chatMessage = {
      type: 'chat',
      roomCode: roomCode,
      username: username,
      message: newMessage.trim()
    };

    ws.send(JSON.stringify(chatMessage));
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (messageUsername) => {
    return messageUsername === username;
  };

  return (
    <div className={`chat-container ${isOpen ? 'open' : ''}`}>
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && messages.length > 0 && (
          <span className="chat-badge">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Room Chat</h3>
            <span className="room-code">{roomCode}</span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>💬 No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${isOwnMessage(msg.username) ? 'own' : 'other'}`}
                >
                  <div className="message-info">
                    <span className="username">{msg.username}</span>
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="send-btn"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
