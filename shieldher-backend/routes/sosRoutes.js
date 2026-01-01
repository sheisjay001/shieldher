const express = require('express');
const router = express.Router();
const { SOSAlert, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Create SOS Alert
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const alert = await SOSAlert.create({
      userId: req.user.id,
      latitude,
      longitude,
      status: 'active'
    });

    // In a real app, here you would:
    // 1. Notify emergency contacts via SMS (Twilio)
    // 2. Notify nearby users via Socket.io
    
    res.status(201).json({ 
      success: true, 
      message: 'SOS Alert activated successfully',
      alert 
    });
  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({ error: 'Failed to activate SOS' });
  }
});

// Get User's Alert History
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const alerts = await SOSAlert.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SOS history' });
  }
});

module.exports = router;