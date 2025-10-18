import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import MessageForm from './components/MessageForm';
import LiveBoard from './components/LiveBoard';
import BoardScreen from './components/BoardScreen';
import Dashboard from './components/Dashboard';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const hideNav = location.pathname === '/board_screen';

  return (
    <div className="app">
      {!hideNav && (
        <nav className="nav">
          <Link to="/" className="nav-link">📝 Send Message</Link>
          <Link to="/board" className="nav-link">📺 Live Board</Link>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<MessageForm />} />
        <Route path="/board" element={<LiveBoard />} />
        <Route path="/board_screen" element={<BoardScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
