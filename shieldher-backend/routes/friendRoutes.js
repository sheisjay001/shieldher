const express = require('express');
const router = express.Router();
const { User, FriendRequest } = require('../models');
const { Op } = require('sequelize');

// Send Friend Request
router.post('/request/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // Receiver ID
    const senderId = req.body.senderId; // In a real app, get this from auth middleware req.user.id

    if (senderId == userId) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const existingRequest = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId, receiverId: userId },
          { senderId: userId, receiverId: senderId }
        ]
      }
    });

    if (existingRequest) {
        if (existingRequest.status === 'accepted') {
            return res.status(400).json({ error: 'Already friends' });
        }
        if (existingRequest.status === 'pending') {
            return res.status(400).json({ error: 'Friend request already pending' });
        }
    }

    await FriendRequest.create({
      senderId,
      receiverId: userId,
      status: 'pending'
    });

    res.json({ success: true, message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept Friend Request
router.put('/accept/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await FriendRequest.findByPk(requestId);
    
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = 'accepted';
    await request.save();

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Friend Request
router.put('/reject/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await FriendRequest.findByPk(requestId);
    
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = 'rejected';
    await request.save();

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Pending Requests (Received)
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await FriendRequest.findAll({
      where: {
        receiverId: userId,
        status: 'pending'
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'email', 'isVerified'] }
      ]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get My Friends
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const friends = await FriendRequest.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] }
      ]
    });

    // Format to just return the friend user object
    const friendList = friends.map(f => {
        return f.senderId == userId ? f.receiver : f.sender;
    });

    res.json(friendList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search Users
router.get('/search', async (req, res) => {
    try {
        const { query, currentUserId } = req.query;
        const users = await User.findAll({
            where: {
                username: { [Op.like]: `%${query}%` },
                id: { [Op.ne]: currentUserId }
            },
            attributes: ['id', 'username', 'isVerified']
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
