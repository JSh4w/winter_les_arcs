import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Trash2, ServerOff, Server, Loader2 } from 'lucide-react';
import './App.css';
import ParticipantForm from './ParticipantForm';

const App = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  
  const api = axios.create({
    baseURL: API_URL,
    timeout: 2000, //2 seconds
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const [participants, setParticipants] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [itinerary, setItinerary] = useState('');

  useEffect(() => {
    checkServerAndFetchData();
    fetch('/itinerary.md')
      .then(response => response.text())
      .then(text => setItinerary(text))
      .catch(error => console.error('Error loading itinerary:', error));
  }, []);

  const checkServerAndFetchData = async () => {
    setError(null);
    setServerStatus('connecting');
    
    try {
      // First check server health
      await api.get('/health');
      setServerStatus('connected');
      
      // Then fetch data
      const [participantsRes, commentsRes] = await Promise.all([
        api.get('/participants'),
        api.get('/comments')
      ]);
      
      setParticipants(participantsRes.data);
      setComments(commentsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Server error:', err);
      setServerStatus('disconnected');
      const errorMessage = err.response?.data?.error || err.message;
      setError(`Error connecting to server: ${errorMessage}. It may take up to 50 seconds for the server to start.`);
      setLoading(false);
    }
  };

  const addParticipant = async (participantData) => {
    try {
      await api.post('/participants', participantData);
      fetchData();
    } catch (error) {
      setError('Failed to add participant. Please try again.');
    }
  };

  const deleteParticipant = async (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to remove ${name} from the trip?`);
    if (isConfirmed) {
      try {
        await api.delete(`/participants/${id}`);
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
      await api.post('/comments', { content: newComment.trim() });
      setNewComment('');
      fetchData();
    } catch (error) {
      setError('Failed to add comment. Please try again.');
    }
  };

  const deleteComment = async (id, content) => {
    const previewContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
    const isConfirmed = window.confirm(`Are you sure you want to delete this comment?\n\n"${previewContent}"`);
    
    if (isConfirmed) {
      try {
        await api.delete(`/comments/${id}`);
        fetchData();
      } catch (error) {
        setError('Failed to delete comment. Please try again.');
      }
    }
  };

  const fetchData = () => {
    setLoading(true);
    checkServerAndFetchData();
  };

  const ServerStatusBanner = () => {
    if (serverStatus === 'connecting') {
      return (
        <div className="server-status connecting">
          <Loader2 className="animate-spin" size={16} />
          <span>Connecting to server...</span>
        </div>
      );
    }
    
    if (serverStatus === 'disconnected') {
      return (
        <div className="server-status disconnected">
          <ServerOff size={16} />
          <span>Server disconnected</span>
          <button onClick={checkServerAndFetchData} className="retry-button">
            Retry Connection
          </button>
        </div>
      );
    }
    
    return (
      <div className="server-status connected">
        <Server size={16} />
        <span>Server connected - Ready to accept entries</span>
      </div>
    );
  };

  if (loading && serverStatus === 'connecting') {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={32} />
        <p>Connecting to server and loading data...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="content-wrapper">
        <div className="header">
          <h1>Les Arcs 2025 Trip Planner</h1>
          <p>Plan and coordinate an upcoming ski trip</p>
          <ServerStatusBanner />
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="card">
          <div className="trip-details">
            <ReactMarkdown>{itinerary}</ReactMarkdown>
          </div>
        </div>

        <div className="card">
          <h2>Participants ({participants.length}/16)</h2>
          
          {serverStatus === 'connected' ? (
            <>
              <ParticipantForm onSubmit={addParticipant} />

              <div className="participant-list">
                {participants.map((participant) => (
                  <div key={participant._id} className="participant-item">
                    <span className="participant-name">{participant.name}</span>
                    <span className="participant-email">{participant.email}</span>
                    <span className={`participant-ability ${participant.skiingAbility}`}>
                      {participant.skiingAbility}
                    </span>
                    <span className="participant-availability">{participant.availability}</span>
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
            </>
          ) : (
            <p className="empty-message">
              Please wait for server connection to add participants...
            </p>
          )}
        </div>

        <div className="card">
          <h2>Comments</h2>
          
          {serverStatus === 'connected' ? (
            <>
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
            </>
          ) : (
            <p className="empty-message">
              Please wait for server connection to add comments...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;