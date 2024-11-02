// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Development
// const API_URL = 'https://your-render-url'; // Production

  /**
   * App component that fetches data from the backend API every 30 seconds
   * and renders the trip details, participants and comments.
   * @returns {JSX.Element} The App component.
   */
function App() {
  const [participants, setParticipants] = useState([]);
  const [comments, setComments] = useState([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', skillLevel: 'beginner' });
  const [newComment, setNewComment] = useState('');

  // Fetch data every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [participantsRes, commentsRes] = await Promise.all([
        axios.get(`${API_URL}/participants`),
        axios.get(`${API_URL}/comments`)
      ]);
      setParticipants(participantsRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Core functions for participants and comments
  const addParticipant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/participants`, newParticipant);
      setNewParticipant({ name: '', skillLevel: 'beginner' });
      fetchData();
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/comments`, { content: newComment });
      setNewComment('');
      fetchData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Trip Details Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Les Arcs Ski Trip 2025</h1>
        {/* Add your static trip details here */}
      </div>

      {/* Participants Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Participants ({participants.length}/16)</h2>
        <form onSubmit={addParticipant} className="mb-4">
          <input
            type="text"
            value={newParticipant.name}
            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
            placeholder="Name"
            className="border p-2 mr-2"
          />
          <select
            value={newParticipant.skillLevel}
            onChange={(e) => setNewParticipant({ ...newParticipant, skillLevel: e.target.value })}
            className="border p-2 mr-2"
          >
            <option value="beginner">Beginner</option>
            <option value="expert">Expert</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Add
          </button>
        </form>
        <div>
          {participants.map((participant) => (
            <div key={participant._id} className="border p-2 mb-2">
              {participant.name} - {participant.skillLevel}
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        <form onSubmit={addComment} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="border p-2 w-full mb-2"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Post Comment
          </button>
        </form>
        <div>
          {comments.map((comment) => (
            <div key={comment._id} className="border p-2 mb-2">
              <p>{comment.content}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;