// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const busboy = require('busboy');

dotenv.config({path: './.env'});
const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://textwall.netlify.app'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    credentials: true
}));

app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', database: dbReady() ? 'connected' : 'offline (in-memory fallback)' });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'Textwall API',
        endpoints: {
            health: '/health',
            messages: '/messages',
            media: '/media/:id'
        }
    });
});

// Connect to MongoDB, retrying until it works. Until then the board runs on in-memory storage.
// After the first connection, the driver reconnects automatically if the database blips.
const RETRY_MS = 15 * 1000;

function connectToMongo() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => {
            console.warn(`MongoDB connection failed - running in-memory, retrying in ${RETRY_MS / 1000}s:`, err.message);
            setTimeout(connectToMongo, RETRY_MS);
        });
}
connectToMongo();

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected - driver will try to reconnect'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

const dbReady = () => mongoose.connection.readyState === 1;

// Uploaded images/videos live in MongoDB GridFS (collections media.files + media.chunks)
const mediaBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' });

// Upload limits
const MAX_FILES_PER_MESSAGE = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;   // 20MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;  // 200MB
const MAX_CONTENT_LENGTH = 500;

// Message Model
const Message = mongoose.model('Message', {
    content: String,
    media: [{
        _id: false,
        fileId: mongoose.Schema.Types.ObjectId,
        kind: { type: String, enum: ['image', 'video'] },
        contentType: String,
        size: Number
    }],
    createdAt: { type: Date, default: Date.now }
});

// In-memory fallback storage
let inMemoryMessages = [];

// DDoS protection - track total messages
const MAX_MESSAGES = 3000;
let totalMessagesCreated = 0;

// Profanity filter disabled
function filterProfanity(text) {
    // No filtering - return text as-is
    return text;
}

class UploadError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Streams a multipart upload (field "content" + files "media") straight into GridFS.
// Nothing is buffered in memory, so large videos are fine on a small server.
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const bucket = mediaBucket();
        const fields = {};
        const media = [];
        const uploads = [];
        let failure = null;

        const fail = (err) => {
            if (!failure) failure = err;
        };

        let bb;
        try {
            bb = busboy({
                headers: req.headers,
                limits: { files: MAX_FILES_PER_MESSAGE, fileSize: MAX_VIDEO_BYTES, fields: 5, fieldSize: 10 * 1024 }
            });
        } catch (err) {
            return reject(new UploadError(400, 'Invalid upload'));
        }

        bb.on('field', (name, value) => {
            fields[name] = value;
        });

        bb.on('file', (name, file, info) => {
            const contentType = info.mimeType || '';
            const kind = contentType.startsWith('image/') ? 'image'
                : contentType.startsWith('video/') ? 'video'
                : null;

            if (name !== 'media' || !kind || failure) {
                if (!failure && !kind) fail(new UploadError(415, 'Only images and videos can be uploaded'));
                file.resume();
                return;
            }

            const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
            const upload = bucket.openUploadStream(info.filename || 'upload', { metadata: { contentType, kind } });
            let size = 0;

            const done = new Promise((res) => {
                upload.on('finish', () => {
                    media.push({ fileId: upload.id, kind, contentType, size });
                    res();
                });
                upload.on('error', (err) => {
                    if (failure) return res(); // expected: we aborted this upload ourselves
                    fail(new UploadError(500, 'Error storing upload'));
                    console.error('GridFS upload error:', err);
                    res();
                });
                upload.on('close', res); // also fires after abort(), so an aborted upload never hangs
            });
            uploads.push({ id: upload.id, done, stream: upload });

            file.on('data', (chunk) => {
                size += chunk.length;
                if (size > maxBytes) {
                    fail(new UploadError(413, `${kind === 'image' ? 'Images' : 'Videos'} must be under ${maxBytes / 1024 / 1024}MB`));
                    file.unpipe(upload);
                    file.resume();
                    upload.abort().catch(() => {});
                }
            });
            file.on('limit', () => {
                fail(new UploadError(413, `Videos must be under ${MAX_VIDEO_BYTES / 1024 / 1024}MB`));
            });
            file.pipe(upload);
        });

        bb.on('filesLimit', () => fail(new UploadError(413, `Up to ${MAX_FILES_PER_MESSAGE} files per message`)));

        bb.on('error', (err) => {
            fail(new UploadError(400, 'Upload interrupted'));
            console.error('Upload parse error:', err);
            finish();
        });

        let finished = false;
        async function finish() {
            if (finished) return;
            finished = true;
            await Promise.all(uploads.map((u) => u.done));
            if (failure) {
                // Remove anything that was stored before the failure
                await Promise.all(media.map((m) => bucket.delete(m.fileId).catch(() => {})));
                reject(failure);
            } else {
                resolve({ fields, media });
            }
        }

        bb.on('close', finish);
        req.on('aborted', () => {
            fail(new UploadError(400, 'Upload cancelled'));
            uploads.forEach((u) => u.stream.abort().catch(() => {}));
            finish();
        });
        req.pipe(bb);
    });
}

// Messages routes
app.get('/messages', async (req, res) => {
    try {
        if (dbReady()) {
            const messages = await Message.find().sort({ createdAt: -1 });
            res.json(messages);
        } else {
            // Return in-memory messages if DB is not available
            res.json(inMemoryMessages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        // Fallback to in-memory on error
        res.json(inMemoryMessages);
    }
});

app.post('/messages', async (req, res) => {
    try {
        // DDoS protection - check if limit exceeded
        if (totalMessagesCreated >= MAX_MESSAGES) {
            console.error(`🚨 DDOS PROTECTION: Message limit of ${MAX_MESSAGES} exceeded. Shutting down server.`);
            res.status(503).json({
                error: 'Service temporarily unavailable - message limit exceeded',
                message: 'The message board has been disabled due to excessive activity. Please contact the administrator.'
            });

            // Gracefully shut down the server
            setTimeout(() => {
                console.error('Server shutting down due to message limit exceeded...');
                process.exit(1);
            }, 1000);
            return;
        }

        const isMultipart = (req.headers['content-type'] || '').startsWith('multipart/form-data');
        let content = '';
        let media = [];

        if (isMultipart) {
            if (!dbReady()) {
                req.resume();
                return res.status(503).json({ error: 'Uploads are unavailable right now (database offline)' });
            }
            const parsed = await parseMultipart(req);
            content = parsed.fields.content || '';
            media = parsed.media;
        } else {
            content = (req.body && req.body.content) || '';
        }

        content = filterProfanity(String(content).trim().slice(0, MAX_CONTENT_LENGTH));

        if (!content && media.length === 0) {
            return res.status(400).json({ error: 'Message must have text or media' });
        }

        const messageData = {
            content,
            media,
            createdAt: new Date()
        };

        if (dbReady()) {
            // Save to MongoDB if connected
            const message = new Message(messageData);
            await message.save();
            totalMessagesCreated++;
            console.log(`Message ${totalMessagesCreated}/${MAX_MESSAGES} created${media.length ? ` with ${media.length} file(s)` : ''}`);
            res.status(201).json(message);
        } else {
            // Save to in-memory storage if DB is not available
            const message = {
                _id: Date.now().toString(),
                ...messageData
            };
            inMemoryMessages.unshift(message);
            totalMessagesCreated++;
            console.log(`Message ${totalMessagesCreated}/${MAX_MESSAGES} created (in-memory)`);
            // Keep only last 100 messages in memory
            if (inMemoryMessages.length > 100) {
                inMemoryMessages = inMemoryMessages.slice(0, 100);
            }
            res.status(201).json(message);
        }
    } catch (error) {
        if (error instanceof UploadError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Error adding message' });
    }
});

// Serve an uploaded image/video. Supports Range requests so videos can seek and play on iOS.
app.get('/media/:id', async (req, res) => {
    try {
        if (!dbReady()) return res.status(503).end();
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).end();

        const id = new mongoose.Types.ObjectId(req.params.id);
        const bucket = mediaBucket();
        const [file] = await bucket.find({ _id: id }).toArray();
        if (!file) return res.status(404).end();

        const size = file.length;
        res.set({
            'Content-Type': (file.metadata && file.metadata.contentType) || 'application/octet-stream',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000, immutable'
        });

        let start = 0;
        let end = size - 1;
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');

        if (range && (range[1] || range[2])) {
            if (range[1]) {
                start = parseInt(range[1], 10);
                if (range[2]) end = Math.min(parseInt(range[2], 10), size - 1);
            } else {
                start = Math.max(size - parseInt(range[2], 10), 0); // suffix range: last N bytes
            }
            if (start >= size || start > end) {
                return res.status(416).set('Content-Range', `bytes */${size}`).end();
            }
            res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
        }

        res.set('Content-Length', String(end - start + 1));
        if (req.method === 'HEAD') return res.end();

        const stream = bucket.openDownloadStream(id, { start, end: end + 1 }); // end is exclusive
        stream.on('error', (err) => {
            console.error('Error streaming media:', err);
            res.destroy();
        });
        req.on('close', () => stream.destroy());
        stream.pipe(res);
    } catch (error) {
        console.error('Error serving media:', error);
        if (!res.headersSent) res.status(500).end();
    }
});

// Clear all messages endpoint (no authentication required)
app.delete('/dashboard_delete', async (req, res) => {
    try {
        if (dbReady()) {
            // Clear MongoDB
            const result = await Message.deleteMany({});
            // Remove all uploaded files too
            await mediaBucket().drop().catch(() => {}); // throws if there are no files yet
            // Reset the counter
            totalMessagesCreated = 0;
            console.log('🔄 Messages cleared and counter reset to 0');
            res.json({ message: `Successfully cleared ${result.deletedCount} messages from database. Counter reset.` });
        } else {
            // Clear in-memory storage
            const count = inMemoryMessages.length;
            inMemoryMessages = [];
            // Reset the counter
            totalMessagesCreated = 0;
            console.log('🔄 Messages cleared and counter reset to 0');
            res.json({ message: `Successfully cleared ${count} messages from memory. Counter reset.` });
        }
    } catch (error) {
        console.error('Error clearing messages:', error);
        res.status(500).json({ error: 'Error clearing messages' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
