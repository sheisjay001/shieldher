const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users (excluding password)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
