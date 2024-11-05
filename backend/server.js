
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({path: './.env'});
const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://winter-les-arcs.netlify.app'],  
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));

app.use(express.json());



// Make a request to the health endpoint for render.com 
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Root Route , this is to display if look directly at backend on render.com
app.get('/', (req, res) => {
    res.json({
        message: 'Les Arcs Trip Planner API',
        endpoints: {
            health: '/health',
            participants: '/participants',
            comments: '/comments'
        }
    });
});


// FIXME remove after testing is done
// Add this before your routes to log the IP
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('Incoming request from IP:', ip);
    next();
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const Participant = mongoose.model('Participant', {
    name: String,
    createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', {
    content: String,
    createdAt: { type: Date, default: Date.now }
});

// Participants routes
app.get('/participants', async (req, res) => {
    try {
        const participants = await Participant.find().sort({ createdAt: -1 });
        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching participants' });
    }
});

app.post('/participants', async (req, res) => {
    try {
        const participant = new Participant(req.body);
        await participant.save();
        res.status(201).json(participant);
    } catch (error) {
        res.status(500).json({ error: 'Error adding participant' });
    }
});

app.delete('/participants/:id', async (req, res) => {
    try {
        const result = await Participant.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json({ message: 'Participant deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting participant' });
    }
});

// Comments routes
app.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find().sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

app.post('/comments', async (req, res) => {
    try {
        const comment = new Comment(req.body);
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Error adding comment' });
    }
});

app.delete('/comments/:id', async (req, res) => {
    try {
        const result = await Comment.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting comment' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});