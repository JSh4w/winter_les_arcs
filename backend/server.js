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

// Profanity filter
const profanityList = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'bastard', 'crap',
    'dick', 'pussy', 'cock', 'piss', 'slut', 'whore', 'fag', 'retard',
    'nigger', 'nigga', 'cunt', 'twat', 'wanker', 'bollocks'
];

function filterProfanity(text) {
    let filtered = text;
    profanityList.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filtered = filtered.replace(regex, (match) => {
            return '*'.repeat(match.length);
        });
    });
    return filtered;
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
            res.status(201).json(message);
        } else {
            // Save to in-memory storage if DB is not available
            const message = {
                _id: Date.now().toString(),
                ...messageData
            };
            inMemoryMessages.unshift(message);
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
            res.json({ message: `Successfully cleared ${result.deletedCount} messages from database` });
        } else {
            // Clear in-memory storage
            const count = inMemoryMessages.length;
            inMemoryMessages = [];
            res.json({ message: `Successfully cleared ${count} messages from memory` });
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