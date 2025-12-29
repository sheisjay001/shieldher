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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development/demo
    methods: ["GET", "POST"]
  }
});

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

// Make uploads folder public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Online Users Storage
let onlineUsers = [];

// Socket.io for Real-time Messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    
    // Add user to online list if not already present
    if (!onlineUsers.some((user) => user.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    
    // Broadcast updated online users list
    io.emit('get_online_users', onlineUsers);
    
    console.log(`User with ID: ${userId} joined room: ${userId}`);
  });

  socket.on('send_message', (data) => {
    // data should contain { receiverId, messageContent, ... }
    socket.to(data.receiver).emit('receive_message', data);
  });

  // Typing Indicators
  socket.on('typing', (data) => {
    // data: { receiverId, senderId }
    socket.to(data.receiverId).emit('display_typing', { senderId: data.senderId });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.receiverId).emit('hide_typing', { senderId: data.senderId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    // Remove user from online list
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit('get_online_users', onlineUsers);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
