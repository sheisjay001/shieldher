const express = require('express');
const router = express.Router();
const { Report, User } = require('../models');

// Create a report
router.post('/', async (req, res) => {
  try {
    const { reporter, reportedTarget, targetType, reason } = req.body;

    const newReport = await Report.create({
      reporterId: reporter,
      reportedTargetId: reportedTarget,
      targetType,
      reason
    });

    res.status(201).json({ message: 'Report submitted successfully', report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reports (Admin only - simplified for now)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [{ model: User, as: 'reporter', attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
