const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { sequelize } = require('./models'); // Import sequelize from models/index.js
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const postRoutes = require('./routes/postRoutes');
const reportRoutes = require('./routes/reportRoutes');
const friendRoutes = require('./routes/friendRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const isVercel = !!process.env.VERCEL;
let server;
let io;

if (!isVercel) {
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
}

// Middleware
app.use(cors({
  origin: '*', // Be explicitly permissive
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database Connection
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
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);

// Make uploads folder public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
