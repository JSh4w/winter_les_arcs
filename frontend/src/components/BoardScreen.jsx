import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BoardScreen = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Poll every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="live-board-container board-screen">
        <div className="messages-board">
          <p className="loading">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-board-container board-screen">
      <div className="messages-board">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Be the first to send one!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="message-card">
              <p className="message-content">{msg.content}</p>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardScreen;
