const express = require('express');
const router = express.Router();
const { Message } = require('../models');
const { moderateContent } = require('../utils/moderation');
const { Op } = require('sequelize');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    
    // AI Safety Check
    const moderationResult = moderateContent(content);
    
    if (!moderationResult.isSafe) {
        if (moderationResult.reasons.includes('harassment')) {
            return res.status(400).json({ error: 'Message blocked: Harassment detected.' });
        }
        // If just profanity, we use the clean text
        const newMessage = await Message.create({ 
            senderId: sender, 
            receiverId: receiver, 
            content: moderationResult.cleanText 
        });
        return res.status(201).json(newMessage);
    }

    const newMessage = await Message.create({ 
        senderId: sender, 
        receiverId: receiver, 
        content 
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages between two users
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark message as read (Triggering the auto-delete timer)
router.put('/:id/read', async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      
      // Set expiration to 5 minutes from now
      message.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      await message.save();
    }
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
