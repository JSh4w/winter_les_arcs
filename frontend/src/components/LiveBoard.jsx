import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveBoard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      setMessages(response.data);
      setLastUpdate(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
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

  const handleRefresh = () => {
    setLoading(true);
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="live-board-container">
        <h1>Live Message Board</h1>
        <p className="loading">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="live-board-container">
      <div className="board-header">
        <div>
          <h1>Live Message Board</h1>
          {lastUpdate && (
            <p className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

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

export default LiveBoard;
