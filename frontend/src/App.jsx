import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import './App.css';

function App() {
  const [participants, setParticipants] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newParticipant, setNewParticipant] = useState({ name: '' });
  const [newComment, setNewComment] = useState('');

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const [participantsRes, commentsRes] = await Promise.all([
        axios.get(`${API_URL}/participants`),
        axios.get(`${API_URL}/comments`)
      ]);
      setParticipants(participantsRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      setError('Error connecting to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant.name.trim()) return;

    try {
      await axios.post(`${API_URL}/participants`, newParticipant);
      setNewParticipant({ name: '' });
      fetchData();
    } catch (error) {
      setError('Failed to add participant. Please try again.');
    }
  };

  const deleteParticipant = async (id, name) => {
    // Add confirmation dialog
    const isConfirmed = window.confirm(`Are you sure you want to remove ${name} from the trip?`);
    
    if (isConfirmed) {
      try {
        await axios.delete(`${API_URL}/participants/${id}`);
        fetchData();
      } catch (error) {
        setError('Failed to remove participant. Please try again.');
      }
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`${API_URL}/comments`, { content: newComment.trim() });
      setNewComment('');
      fetchData();
    } catch (error) {
      setError('Failed to add comment. Please try again.');
    }
  };

  const deleteComment = async (id, content) => {
    // Add confirmation dialog with preview of comment content
    const previewContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
    const isConfirmed = window.confirm(`Are you sure you want to delete this comment?\n\n"${previewContent}"`);
    
    if (isConfirmed) {
      try {
        await axios.delete(`${API_URL}/comments/${id}`);
        fetchData();
      } catch (error) {
        setError('Failed to delete comment. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="content-wrapper">
        <div className="header">
          <h1>Les Arcs 2025 Trip Planner</h1>
          <p>Plan and coordinate our upcoming ski trip</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="card">
          <h2>Trip Details</h2>
          <div className="trip-details">
            <ul>
              <li>📅 <strong>When:</strong> February/March 2025</li>
              <li>🏔️ <strong>Where:</strong> Les Arcs 1800</li>
              <li>👥 <strong>Group Size:</strong> 12-16 people</li>
              <li>💰 <strong>Budget:</strong> Max £1000 per person</li>
            </ul>
            <p>Join us for an amazing ski trip in the French Alps!</p>
          </div>
        </div>

        <div className="card">
          <h2>Participants ({participants.length}/16)</h2>
          
          <form onSubmit={addParticipant} className="participant-form">
            <div className="form-group">
              <input
                type="text"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ name: e.target.value })}
                placeholder="Participant name"
                className="input-field"
                required
              />
              <button type="submit" className="button">Add</button>
            </div>
          </form>

          <div className="participant-list">
            {participants.map((participant) => (
              <div key={participant._id} className="participant-item">
                <span className="participant-name">{participant.name}</span>
                <button
                  onClick={() => deleteParticipant(participant._id, participant.name)}
                  className="delete-button"
                  title="Remove participant"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {participants.length === 0 && (
              <p className="empty-message">
                No participants yet. Be the first to join!
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Comments</h2>
          
          <form onSubmit={addComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
              required
            />
            <div className="form-group">
              <button type="submit" className="button">Post Comment</button>
            </div>
          </form>

          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-content">
                  <p className="comment-text">{comment.content}</p>
                  <button
                    onClick={() => deleteComment(comment._id, comment.content)}
                    className="delete-button"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="comment-timestamp">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="empty-message">
                No comments yet. Start the conversation!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;