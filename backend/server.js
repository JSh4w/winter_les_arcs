// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({path: './.env'});
const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://winter-les-arcs.netlify.app', 'https://textwall.netlify.app'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key'],
    credentials: true
}));

app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: 'Party Message Board API',
        endpoints: {
            health: '/health',
            messages: '/messages'
        }
    });
});

let isMongoConnected = false;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        isMongoConnected = true;
    })
    .catch(err => {
        console.warn('MongoDB connection failed - running without persistence:', err.message);
        isMongoConnected = false;
    });

// Message Model
const Message = mongoose.model('Message', {
    content: String,
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

// Messages routes
app.get('/messages', async (req, res) => {
    try {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
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

        // Filter profanity from the message content
        const filteredContent = filterProfanity(req.body.content);

        const messageData = {
            content: filteredContent,
            createdAt: new Date()
        };

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            // Save to MongoDB if connected
            const message = new Message(messageData);
            await message.save();
            totalMessagesCreated++;
            console.log(`Message ${totalMessagesCreated}/${MAX_MESSAGES} created`);
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
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Error adding message' });
    }
});

// Clear all messages endpoint (admin only - protect with secret key)
app.delete('/dashboard_delete', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];

        // Check admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Unauthorized - Invalid admin key' });
        }

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            // Clear MongoDB
            const result = await Message.deleteMany({});
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