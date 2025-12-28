const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages between two users
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark message as read (Triggering the auto-delete timer)
router.put('/:id/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = Date.now();
      
      // Set expiration to 5 minutes from now
      // 5 minutes * 60 seconds * 1000 milliseconds
      message.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      await message.save();
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
