const express = require('express');
const router = express.Router();
const { User } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Get all users (excluding password)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Profile Picture
router.post('/:userId/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const user = await User.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update profile picture path
        // Use forward slashes for cross-platform compatibility
        user.profilePicture = req.file.path.replace(/\\/g, '/');
        await user.save();

        res.json({ success: true, profilePicture: user.profilePicture });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
