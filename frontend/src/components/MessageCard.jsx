import React from 'react';

const API_URL = import.meta.env.VITE_API_URL;

// One message on the board: optional text plus any uploaded images/videos.
// `screen` is the full-screen TV mode: videos autoplay muted on loop.
const MessageCard = ({ msg, screen = false }) => {
  const media = msg.media || [];

  return (
    <div className="message-card">
      {msg.content && <p className="message-content">{msg.content}</p>}

      {media.length > 0 && (
        <div className={`message-media count-${Math.min(media.length, 4)}`}>
          {media.map((m) => {
            const src = `${API_URL}/media/${m.fileId}`;
            return m.kind === 'video' ? (
              <video
                key={m.fileId}
                src={screen ? src : `${src}#t=0.1`}
                controls={!screen}
                autoPlay={screen}
                muted={screen}
                loop={screen}
                playsInline
                preload="metadata"
              />
            ) : (
              <a key={m.fileId} href={src} target="_blank" rel="noreferrer">
                <img src={src} alt="" loading="lazy" />
              </a>
            );
          })}
        </div>
      )}

      <span className="message-time">{new Date(msg.createdAt).toLocaleString()}</span>
    </div>
  );
};

export default MessageCard;
