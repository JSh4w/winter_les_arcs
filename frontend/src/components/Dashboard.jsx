import React, { useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearMessages = async (e) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to delete ALL messages? This cannot be undone!')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.delete(`${API_URL}/dashboard_delete`);

      setMessage(response.data.message);
    } catch (err) {
      setError('Failed to clear messages. Please try again.');
      console.error('Error clearing messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      <p className="subtitle">Manage your message board</p>

      <div className="dashboard-section">
        <h2>Clear All Messages</h2>
        <p className="warning-text">⚠️ This will permanently delete all messages from the board</p>

        <form onSubmit={handleClearMessages} className="dashboard-form">
          <button
            type="submit"
            className="delete-button"
            disabled={isLoading}
          >
            {isLoading ? 'Clearing...' : '🗑️ Clear All Messages'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
