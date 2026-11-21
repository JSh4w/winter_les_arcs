import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MessageCard from './MessageCard';
import { RefreshIcon, FullscreenIcon, ExitFullscreenIcon } from './icons';

// Fullscreen API with the webkit prefix older iPad Safari needs
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const canFullscreen = () => {
  const el = document.documentElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
};

const BoardScreen = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(fullscreenElement()));
  const wakeLock = useRef(null);

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

  const handleRefresh = () => {
    setLoading(true);
    fetchMessages();
  };

  // Keep the screen awake while the board is in full screen (where supported)
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await navigator.wakeLock.request('screen');
        wakeLock.current.addEventListener('release', () => {
          wakeLock.current = null;
        });
      }
    } catch (err) {
      console.warn('Wake lock unavailable:', err);
    }
  };

  const releaseWakeLock = () => {
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  };

  const toggleFullscreen = async () => {
    try {
      if (fullscreenElement()) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const el = document.documentElement;
        await (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      }
    } catch (err) {
      console.error('Fullscreen failed:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Poll every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    const onFullscreenChange = () => {
      const active = Boolean(fullscreenElement());
      setIsFullscreen(active);
      if (active) requestWakeLock();
      else releaseWakeLock();
    };
    // The wake lock is dropped when the tab is hidden; take it back on return
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && fullscreenElement()) requestWakeLock();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibility);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseWakeLock();
    };
  }, []);

  const controls = (
    <div className={`screen-controls${isFullscreen ? ' is-fullscreen' : ''}`}>
      <button onClick={handleRefresh} className="refresh-button" aria-label="Refresh">
        <RefreshIcon /> <span className="control-label">Refresh</span>
      </button>
      {canFullscreen() && (
        <button onClick={toggleFullscreen} className="refresh-button" aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          <span className="control-label">{isFullscreen ? 'Exit' : 'Full screen'}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="live-board-container board-screen">
      {controls}

      <div className="messages-board">
        {loading ? (
          <p className="loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="no-messages">No messages yet. Be the first to send one!</p>
        ) : (
          messages.map((msg) => <MessageCard key={msg._id} msg={msg} screen />)
        )}
      </div>
    </div>
  );
};

export default BoardScreen;
