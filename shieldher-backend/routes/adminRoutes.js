const express = require('express');
const router = express.Router();
const { User, Report, Post, Comment } = require('../models');
const { protect, admin } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

// Apply protection and admin check to all routes
router.use(protect);
router.use(admin);

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const verifiedUsers = await User.count({ where: { isVerified: true } });
    const pendingVerifications = await User.count({ where: { verificationStatus: 'pending' } });
    const totalReports = await Report.count();
    const totalPosts = await Post.count();

    res.json({
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      totalReports,
      totalPosts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Users (with filtering)
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Pending Verifications
router.get('/verifications', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { verificationStatus: 'pending' },
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Verification
router.put('/verify/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isVerified = true;
    user.verificationStatus = 'verified';
    await user.save();

    res.json({ success: true, message: 'User verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Verification
router.put('/reject/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isVerified = false;
    user.verificationStatus = 'rejected';
    // Optionally delete the verification image to save space
    // user.verificationImage = null; 
    await user.save();

    res.json({ success: true, message: 'Verification rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User (Ban)
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: User, as: 'reporter', attributes: ['username', 'id'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dismiss Report (Delete Report)
router.delete('/reports/:reportId', async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.reportId);
        if (!report) return res.status(404).json({ error: 'Report not found' });

        await report.destroy();
        res.json({ success: true, message: 'Report dismissed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Content (Post) based on Report
router.delete('/content/post/:postId', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        await post.destroy();
        
        // Also clean up reports associated with this post
        await Report.destroy({ where: { reportedTargetId: req.params.postId, targetType: 'Post' } });

        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
