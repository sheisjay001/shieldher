const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { sequelize } = require('./models'); // Import sequelize from models/index.js
require('dotenv').config();



const app = express();
const isVercel = !!process.env.VERCEL;

if (isVercel) {
  app.set('trust proxy', 1); // Trust first proxy for Vercel
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid frontend asset blocking
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

let server;
let io;

if (!isVercel) {
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(), 
    dbStatus: dbError ? 'error' : (sequelize ? 'connected' : 'initializing'),
    dbError: dbError
  });
});

// Debug Env (Check if vars exist)
app.get('/api/debug-env', (req, res) => {
  res.json({
    DB_NAME: !!process.env.DB_NAME,
    DB_USER: !!process.env.DB_USER,
    DB_HOST: !!process.env.DB_HOST,
    DB_PASSWORD: !!process.env.DB_PASSWORD,
    VERCEL: !!process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV
  });
});

// Database Connection
if (sequelize) {
  sequelize.authenticate()
    .then(() => {
      console.log('TiDB/MySQL Connected');
      return sequelize.sync(); // Sync models with database
    })
    .then(() => {
      console.log('Database Synced');
    })
    .catch(err => {
      console.error('Database Connection Error:', err);
      dbError = err.message;
    });
}

// Safe Route Loading Helper
const safeRoute = (path) => {
  try {
    return require(path);
  } catch (err) {
    console.error(`Failed to load route ${path}:`, err);
    return (req, res) => res.status(500).json({ error: `Route unavailable: ${err.message}` });
  }
};

// Routes
app.use('/api/auth', safeRoute('./routes/authRoutes'));
app.use('/api/messages', safeRoute('./routes/messageRoutes'));
app.use('/api/users', safeRoute('./routes/userRoutes'));
app.use('/api/verification', safeRoute('./routes/verificationRoutes'));
app.use('/api/posts', safeRoute('./routes/postRoutes'));
app.use('/api/reports', safeRoute('./routes/reportRoutes'));
app.use('/api/friends', safeRoute('./routes/friendRoutes'));
app.use('/api/admin', safeRoute('./routes/adminRoutes'));
app.use('/api/sos', safeRoute('./routes/sosRoutes'));

// Make uploads folder public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend build (for serverless deployment packaging)
app.use(express.static(path.join(__dirname, '../shieldher-frontend/dist')));

// SPA fallback for non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../shieldher-frontend/dist/index.html'));
});

// Online Users Storage
let onlineUsers = [];

// Socket.io for Real-time Messaging
if (!isVercel && io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (userId) => {
      socket.join(userId);
      
      if (!onlineUsers.some((user) => user.userId === userId)) {
        onlineUsers.push({ userId, socketId: socket.id });
      }
      
      io.emit('get_online_users', onlineUsers);
      
      console.log(`User with ID: ${userId} joined room: ${userId}`);
    });

    socket.on('send_message', (data) => {
      socket.to(data.receiver).emit('receive_message', data);
    });

    socket.on('typing', (data) => {
      socket.to(data.receiverId).emit('display_typing', { senderId: data.senderId });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.receiverId).emit('hide_typing', { senderId: data.senderId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      io.emit('get_online_users', onlineUsers);
    });
  });
}

if (isVercel) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
