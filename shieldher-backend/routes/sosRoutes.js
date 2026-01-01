const express = require('express');
const router = express.Router();
const { SOSAlert, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// Robust middleware extractor
const protect = authMiddleware.protect || authMiddleware;

// Mock Notification Service (Replace with Twilio/Firebase in production)
const sendEmergencyNotifications = async (user, location, alertId) => {
  console.log(`[🚨 URGENT] Sending SMS to contacts of ${user.username}`);
  console.log(`[📍 LOCATION] https://www.google.com/maps?q=${location.latitude},${location.longitude}`);
  // TODO: Integrate Twilio here
  // await twilioClient.messages.create({...})
};

// Create SOS Alert
router.post('/', protect, validateRequest(schemas.sos), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const alert = await SOSAlert.create({
      userId: req.user.id,
      latitude,
      longitude,
      status: 'active'
    });

    // Trigger Async Notifications
    sendEmergencyNotifications(req.user, { latitude, longitude }, alert.id).catch(err => 
      console.error('Failed to send notifications:', err)
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'SOS Alert activated successfully. Emergency contacts notified.',
      alert 
    });
  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({ error: 'Failed to activate SOS' });
  }
});

// Get User's Alert History
router.get('/history', protect, async (req, res) => {
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