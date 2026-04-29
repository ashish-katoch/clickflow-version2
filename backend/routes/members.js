const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/members
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password_hash -__v').lean();
    const result = users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name || '',
      role: u.role || 'member',
      avatar_url: u.avatar_url || '',
      created_at: u.created_at || '',
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/members/:id/role?role=X
router.put('/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Only admins can change roles' });
    }
    const role = req.query.role;
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ detail: 'Invalid role' });
    }
    await User.findByIdAndUpdate(req.params.id, { $set: { role } });
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
