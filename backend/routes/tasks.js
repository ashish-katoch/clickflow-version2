const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.project_id) query.project_id = req.query.project_id;
    if (req.query.assignee_id) query.assignee_id = req.query.assignee_id;
    if (req.query.status) query.status = req.query.status;
    const tasks = await Task.find(query).select('-_id -__v').sort({ created_at: -1 }).limit(500).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/tasks/my
router.get('/my', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee_id: req.user._id }).select('-_id -__v').sort({ created_at: -1 }).limit(200).lean();
    for (const t of tasks) {
      const proj = await Project.findOne({ id: t.project_id }).select('name key color -_id').lean();
      t.project = proj;
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/tasks?project_id=X
router.post('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;
    const project = await Project.findOne({ id: project_id }).lean();
    if (!project) return res.status(404).json({ detail: 'Project not found' });

    const key = await Counter.getNextKey(project_id, project.key);
    const { title, description = '', status = 'backlog', priority = 'medium', assignee_id = null, due_date = null } = req.body;
    const now = new Date().toISOString();
    const taskId = uuidv4();

    const doc = await Task.create({
      id: taskId, project_id, key, title, description, status, priority,
      assignee_id, due_date, created_by: req.user._id, created_by_name: req.user.name,
      created_at: now, updated_at: now,
    });

    // Activity log
    await Comment.create({
      id: uuidv4(), entity_id: taskId, entity_type: 'task',
      user_id: req.user._id, user_name: req.user.name,
      content: 'created this task', type: 'activity', created_at: now,
    });

    // Notification
    if (assignee_id && assignee_id !== req.user._id) {
      await Notification.create({
        id: uuidv4(), user_id: assignee_id, type: 'task_assigned',
        message: `You were assigned to ${key}: ${title}`,
        link: `/project/${project_id}/board`, created_at: now,
      });
    }

    const result = doc.toObject();
    delete result._id; delete result.__v;
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const old = await Task.findOne({ id: req.params.id }).select('-_id -__v').lean();
    if (!old) return res.status(404).json({ detail: 'Task not found' });

    const updateData = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (v !== undefined && v !== null) updateData[k] = v;
    }
    updateData.updated_at = new Date().toISOString();

    await Task.updateOne({ id: req.params.id }, { $set: updateData });
    const now = new Date().toISOString();

    // Status change activity
    if (updateData.status && updateData.status !== old.status) {
      await Comment.create({
        id: uuidv4(), entity_id: req.params.id, entity_type: 'task',
        user_id: req.user._id, user_name: req.user.name,
        content: `changed status to ${updateData.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        type: 'activity', created_at: now,
      });
      const target = old.assignee_id || old.created_by;
      if (target && target !== req.user._id) {
        await Notification.create({
          id: uuidv4(), user_id: target, type: 'status_changed',
          message: `${old.key} status changed to ${updateData.status}`,
          link: `/project/${old.project_id}/board`, created_at: now,
        });
      }
    }

    // Assignee change activity
    if (updateData.assignee_id && updateData.assignee_id !== old.assignee_id) {
      const assigneeUser = await User.findById(updateData.assignee_id);
      const assigneeName = assigneeUser?.name || 'someone';
      await Comment.create({
        id: uuidv4(), entity_id: req.params.id, entity_type: 'task',
        user_id: req.user._id, user_name: req.user.name,
        content: `assigned this to ${assigneeName}`, type: 'activity', created_at: now,
      });
      if (updateData.assignee_id !== req.user._id) {
        await Notification.create({
          id: uuidv4(), user_id: updateData.assignee_id, type: 'task_assigned',
          message: `You were assigned to ${old.key}: ${old.title}`,
          link: `/project/${old.project_id}/board`, created_at: now,
        });
      }
    }

    const updated = await Task.findOne({ id: req.params.id }).select('-_id -__v').lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.deleteOne({ id: req.params.id });
    await Comment.deleteMany({ entity_id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
