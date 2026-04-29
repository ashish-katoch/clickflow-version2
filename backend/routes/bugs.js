const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/bugs
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.project_id) query.project_id = req.query.project_id;
    if (req.query.assignee_id) query.assignee_id = req.query.assignee_id;
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    const bugs = await Bug.find(query).select('-_id -__v').sort({ created_at: -1 }).limit(500).lean();
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/bugs/all
router.get('/all', auth, async (req, res) => {
  try {
    const bugs = await Bug.find({}).select('-_id -__v').sort({ created_at: -1 }).limit(500).lean();
    for (const b of bugs) {
      const proj = await Project.findOne({ id: b.project_id }).select('name key color -_id').lean();
      b.project = proj;
    }
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/bugs?project_id=X
router.post('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;
    const project = await Project.findOne({ id: project_id }).lean();
    if (!project) return res.status(404).json({ detail: 'Project not found' });

    const key = await Counter.getNextKey(project_id, project.key);
    const { title, description = '', status = 'open', priority = 'medium', assignee_id = null } = req.body;
    const now = new Date().toISOString();
    const bugId = uuidv4();

    const doc = await Bug.create({
      id: bugId, project_id, key, title, description, status, priority,
      assignee_id, created_by: req.user._id, created_by_name: req.user.name,
      created_at: now, updated_at: now,
    });

    await Comment.create({
      id: uuidv4(), entity_id: bugId, entity_type: 'bug',
      user_id: req.user._id, user_name: req.user.name,
      content: 'reported this bug', type: 'activity', created_at: now,
    });

    if (assignee_id && assignee_id !== req.user._id) {
      await Notification.create({
        id: uuidv4(), user_id: assignee_id, type: 'bug_assigned',
        message: `Bug ${key}: ${title} assigned to you`,
        link: `/project/${project_id}/bugs`, created_at: now,
      });
    }

    const result = doc.toObject();
    delete result._id; delete result.__v;
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/bugs/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const old = await Bug.findOne({ id: req.params.id }).select('-_id -__v').lean();
    if (!old) return res.status(404).json({ detail: 'Bug not found' });

    const updateData = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (v !== undefined && v !== null) updateData[k] = v;
    }
    updateData.updated_at = new Date().toISOString();
    await Bug.updateOne({ id: req.params.id }, { $set: updateData });
    const now = new Date().toISOString();

    if (updateData.status && updateData.status !== old.status) {
      await Comment.create({
        id: uuidv4(), entity_id: req.params.id, entity_type: 'bug',
        user_id: req.user._id, user_name: req.user.name,
        content: `changed status to ${updateData.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        type: 'activity', created_at: now,
      });
      const target = old.assignee_id || old.created_by;
      if (target && target !== req.user._id) {
        await Notification.create({
          id: uuidv4(), user_id: target, type: 'status_changed',
          message: `${old.key} status changed to ${updateData.status}`,
          link: `/project/${old.project_id}/bugs`, created_at: now,
        });
      }
    }

    if (updateData.assignee_id && updateData.assignee_id !== old.assignee_id) {
      const assigneeUser = await User.findById(updateData.assignee_id);
      const assigneeName = assigneeUser?.name || 'someone';
      await Comment.create({
        id: uuidv4(), entity_id: req.params.id, entity_type: 'bug',
        user_id: req.user._id, user_name: req.user.name,
        content: `assigned this to ${assigneeName}`, type: 'activity', created_at: now,
      });
    }

    const updated = await Bug.findOne({ id: req.params.id }).select('-_id -__v').lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/bugs/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Bug.deleteOne({ id: req.params.id });
    await Comment.deleteMany({ entity_id: req.params.id });
    res.json({ message: 'Bug deleted' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/bugs/:id/attachments
router.post('/:id/attachments', auth, async (req, res) => {
  try {
    const bug = await Bug.findOne({ id: req.params.id });
    if (!bug) return res.status(404).json({ detail: 'Bug not found' });
    const { file_name, file_url, file_type = 'image/png' } = req.body;
    const att = {
      id: uuidv4(), file_name, file_url, file_type,
      uploaded_by: req.user._id, created_at: new Date().toISOString(),
    };
    await Bug.updateOne({ id: req.params.id }, { $push: { attachments: att } });
    res.json(att);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/bugs/:id/attachments/:attId
router.delete('/:id/attachments/:attId', auth, async (req, res) => {
  try {
    await Bug.updateOne({ id: req.params.id }, { $pull: { attachments: { id: req.params.attId } } });
    res.json({ message: 'Attachment removed' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
