import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AnchorIcon, ImageIcon } from './icons';

// Keep in sync with the limits in backend/server.js
const MAX_FILES = 4;
const MAX_IMAGE_MB = 20;
const MAX_VIDEO_MB = 200;

const MessageForm = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]); // [{ file, url, kind }]
  const [progress, setProgress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInput = useRef(null);

  // Free preview URLs when files are removed or the page closes
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const addFiles = (list) => {
    setError(null);
    const picked = [];
    for (const file of list) {
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (!kind) {
        setError(`${file.name} isn't an image or video`);
        continue;
      }
      const maxMb = kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(`${file.name} is too big (${kind}s must be under ${maxMb}MB)`);
        continue;
      }
      picked.push({ file, kind, url: URL.createObjectURL(file) });
    }

    setFiles((current) => {
      const next = [...current, ...picked];
      if (next.length > MAX_FILES) {
        setError(`Up to ${MAX_FILES} files per message`);
        next.slice(MAX_FILES).forEach((f) => URL.revokeObjectURL(f.url));
        return next.slice(0, MAX_FILES);
      }
      return next;
    });
  };

  const removeFile = (index) => {
    setFiles((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  };

  const canSend = message.trim() || files.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (files.length > 0) {
        const form = new FormData();
        form.append('content', message.trim());
        files.forEach((f) => form.append('media', f.file));
        setProgress(0);
        await axios.post(`${API_URL}/messages`, form, {
          onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
        });
      } else {
        await axios.post(`${API_URL}/messages`, { content: message.trim() });
      }

      setSuccess(true);
      setMessage('');
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
      console.error('Error posting message:', err);
    } finally {
      setIsSubmitting(false);
      setProgress(null);
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
          rows="5"
          maxLength="500"
          disabled={isSubmitting}
        />

        {files.length > 0 && (
          <div className="upload-previews">
            {files.map((f, i) => (
              <div key={f.url} className="upload-preview">
                {f.kind === 'video' ? (
                  <video src={f.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={f.url} alt="" />
                )}
                {!isSubmitting && (
                  <button type="button" className="remove-upload" onClick={() => removeFile(i)} aria-label="Remove file">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {progress !== null && (
          <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress < 100 ? `Uploading ${progress}%` : 'Saving...'}</span>
          </div>
        )}

        <div className="form-footer">
          <div className="form-footer-left">
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="attach-button"
              onClick={() => fileInput.current?.click()}
              disabled={isSubmitting || files.length >= MAX_FILES}
            >
              <ImageIcon /> Photo / video
            </button>
            <span className="char-count">{message.length}/500</span>
          </div>
          <button type="submit" disabled={isSubmitting || !canSend} className="submit-button">
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
          <AnchorIcon size={16} /> Message sent successfully!
        </div>
      )}
    </div>
  );
};

export default MessageForm;
