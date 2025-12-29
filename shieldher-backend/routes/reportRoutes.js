const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Create a report
router.post('/', async (req, res) => {
  try {
    const { reporter, reportedTarget, targetType, reason } = req.body;

    const newReport = new Report({
      reporter,
      reportedTarget,
      targetType,
      reason
    });

    await newReport.save();
    res.status(201).json({ message: 'Report submitted successfully', report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reports (Admin only - simplified for now)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
