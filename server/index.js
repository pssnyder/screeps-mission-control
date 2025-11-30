/**
 * SCREEPS MISSION CONTROL - API Server
 * 
 * Express server with Socket.IO for real-time Screeps telemetry
 * Connects to Screeps API and streams data to HUD frontend
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const ScreepsClient = require('./screeps-client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Screeps client
const screepsClient = new ScreepsClient({
    email: process.env.SCREEPS_EMAIL,
    password: process.env.SCREEPS_PASSWORD,
    token: process.env.SCREEPS_TOKEN
});

// Configuration
const PORT = process.env.PORT || 3000;
const DEFAULT_ROOM = process.env.DEFAULT_ROOM || 'W13N57';
const DEFAULT_SHARD = process.env.DEFAULT_SHARD || 'shard3';

// API Routes
app.get('/api/health', (req, res) => {
    const cacheStatus = screepsClient.getCacheStatus();
    res.json({
        status: 'operational',
        connected: screepsClient.isConnected(),
        timestamp: Date.now(),
        cache: cacheStatus
    });
});

app.get('/api/status', async (req, res) => {
    try {
        const status = await screepsClient.getStatus(DEFAULT_ROOM, DEFAULT_SHARD);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await screepsClient.getRooms(DEFAULT_SHARD);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/console', async (req, res) => {
    try {
        const { command, shard } = req.body;
        const result = await screepsClient.executeCommand(command, shard || DEFAULT_SHARD);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log(`[Mission Control] Client connected: ${socket.id}`);
    
    // Send initial connection success
    socket.emit('screeps:connected', {
        timestamp: Date.now(),
        defaultRoom: DEFAULT_ROOM,
        defaultShard: DEFAULT_SHARD
    });
    
    // Start telemetry stream - reduced frequency to avoid rate limiting
    const telemetryInterval = setInterval(async () => {
        try {
            const telemetry = await screepsClient.getTelemetry(DEFAULT_ROOM, DEFAULT_SHARD);
            socket.emit('screeps:telemetry', telemetry);
        } catch (error) {
            socket.emit('screeps:error', { message: error.message });
        }
    }, parseInt(process.env.TELEMETRY_UPDATE_INTERVAL) || 10000); // Changed default from 2000 to 10000 (10 seconds)
    
    // Status updates (less frequent) - reduced to avoid rate limiting
    const statusInterval = setInterval(async () => {
        try {
            const status = await screepsClient.getStatus(DEFAULT_ROOM, DEFAULT_SHARD);
            socket.emit('screeps:status', status);
        } catch (error) {
            socket.emit('screeps:error', { message: error.message });
        }
    }, parseInt(process.env.STATUS_UPDATE_INTERVAL) || 30000); // Changed default from 5000 to 30000 (30 seconds)
    
    // Handle console commands from client
    socket.on('screeps:command', async (data) => {
        try {
            const { command, shard } = data;
            const result = await screepsClient.executeCommand(command, shard || DEFAULT_SHARD);
            socket.emit('screeps:command:result', { command, result });
        } catch (error) {
            socket.emit('screeps:command:error', { command: data.command, error: error.message });
        }
    });
    
    // Cleanup on disconnect
    socket.on('disconnect', () => {
        console.log(`[Mission Control] Client disconnected: ${socket.id}`);
        clearInterval(telemetryInterval);
        clearInterval(statusInterval);
    });
});

// Initialize Screeps connection
async function initialize() {
    console.log('═══════════════════════════════════════════');
    console.log('🚀 SCREEPS MISSION CONTROL');
    console.log('═══════════════════════════════════════════');
    console.log('');
    
    try {
        await screepsClient.connect();
        console.log('✅ Connected to Screeps API');
        console.log(`📡 Monitoring: ${DEFAULT_ROOM} (${DEFAULT_SHARD})`);
        console.log('');
        
        server.listen(PORT, () => {
            console.log(`🎮 Mission Control Dashboard: http://localhost:${PORT}`);
            console.log('═══════════════════════════════════════════');
        });
    } catch (error) {
        console.error('❌ Failed to connect to Screeps:', error.message);
        console.error('');
        console.error('💡 Check your credentials in .env file');
        console.error('   Copy .env.example to .env and configure');
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down Mission Control...');
    screepsClient.disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server
initialize();
