const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user_id: req.user._id })
      .select('-_id -__v').sort({ created_at: -1 }).limit(50).lean();
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user_id: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', auth, async (req, res) => {
  try {
    await Notification.updateOne({ id: req.params.id }, { $set: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
