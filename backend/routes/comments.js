const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/comments?entity_id=X&entity_type=task
router.get('/', auth, async (req, res) => {
  try {
    const { entity_id, entity_type = 'task' } = req.query;
    const comments = await Comment.find({ entity_id, entity_type })
      .select('-_id -__v').sort({ created_at: 1 }).limit(200).lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/comments
router.post('/', auth, async (req, res) => {
  try {
    const { entity_id, entity_type = 'task', content } = req.body;
    const now = new Date().toISOString();
    const doc = await Comment.create({
      id: uuidv4(), entity_id, entity_type,
      user_id: req.user._id, user_name: req.user.name,
      content, type: 'comment', created_at: now,
    });

    // Increment comment count
    const Model = entity_type === 'task' ? Task : Bug;
    await Model.updateOne({ id: entity_id }, { $inc: { comment_count: 1 } });

    // Notification
    const entity = await Model.findOne({ id: entity_id }).lean();
    if (entity?.assignee_id && entity.assignee_id !== req.user._id) {
      await Notification.create({
        id: uuidv4(), user_id: entity.assignee_id, type: 'comment_added',
        message: `New comment on ${entity.key || ''}: ${content.slice(0, 50)}`,
        link: '', created_at: now,
      });
    }

    const result = doc.toObject();
    delete result._id; delete result.__v;
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Comment.findOne({ id: req.params.id }).lean();
    if (!c) return res.status(404).json({ detail: 'Not found' });
    if (c.user_id !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Forbidden' });
    }
    await Comment.deleteOne({ id: req.params.id });
    const Model = c.entity_type === 'task' ? Task : Bug;
    await Model.updateOne({ id: c.entity_id }, { $inc: { comment_count: -1 } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
