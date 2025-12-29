const express = require('express');
const router = express.Router();
const multer = require('multer');
const { User } = require('../models');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Verification by Invite Code
router.post('/invite/:userId', async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const user = await User.findByPk(req.params.userId);
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Simple mock invite code check (In reality, check against a DB of codes)
        if (inviteCode === 'WOMEN2025' || inviteCode === 'SHIELDHER') {
            user.isVerified = true;
            user.verificationStatus = 'verified';
            // user.verificationMethod = 'invite_code'; // Field not in new schema, omitting or adding if needed. Not in Mongoose schema either explicitly but maybe dynamic? 
            // The Mongoose schema didn't have verificationMethod, but it allowed it? Mongoose strict mode is default true, so maybe it was ignored.
            // I'll update schema if needed, but for now I'll just set inviteCode.
            user.inviteCode = inviteCode;
            await user.save();
            return res.json({ success: true, user });
        } else {
            return res.status(400).json({ error: 'Invalid invite code' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verification by ID Upload
router.post('/upload-id/:userId', upload.single('idImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const user = await User.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.verificationImage = req.file.path;
        user.verificationStatus = 'pending'; // Needs manual review
        
        await user.save();

        res.json({ success: true, message: 'ID uploaded. Verification pending review.', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
