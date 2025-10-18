import React, { useState } from 'react';
import axios from 'axios';

const MessageForm = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(`${API_URL}/messages`, {
        content: message.trim()
      });

      setSuccess(true);
      setMessage('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error posting message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="message-form-container">
      <h1>Send a Message</h1>
      <p className="subtitle">Your message will appear on the live board</p>

      <form onSubmit={handleSubmit} className="message-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows="6"
          maxLength="500"
          disabled={isSubmitting}
          required
        />

        <div className="form-footer">
          <span className="char-count">{message.length}/500</span>
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="submit-button"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          Message sent successfully!
        </div>
      )}
    </div>
  );
};

export default MessageForm;
