const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({}).select('-_id -__v').sort({ created_at: -1 }).lean();
    for (const p of projects) {
      p.task_count = await Task.countDocuments({ project_id: p.id });
      p.bug_count = await Bug.countDocuments({ project_id: p.id });
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Project.findOne({ id: req.params.id }).select('-_id -__v').lean();
    if (!p) return res.status(404).json({ detail: 'Project not found' });
    p.task_count = await Task.countDocuments({ project_id: p.id });
    p.bug_count = await Bug.countDocuments({ project_id: p.id });
    res.json(p);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  try {
    const { name, key, color = '#6366f1', description = '' } = req.body;
    let projectKey = (key || name.slice(0, 3)).toUpperCase().trim();
    const existing = await Project.findOne({ key: projectKey });
    if (existing) {
      const count = await Project.countDocuments({});
      projectKey = projectKey + (count + 1);
    }
    const doc = await Project.create({
      id: uuidv4(), name, key: projectKey, description, color,
      members: [req.user._id], created_by: req.user._id,
    });
    const result = doc.toObject();
    delete result._id; delete result.__v;
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const updated = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $set: { name, description, color } },
      { new: true }
    ).select('-_id -__v').lean();
    if (!updated) return res.status(404).json({ detail: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Project.deleteOne({ id: req.params.id });
    await Task.deleteMany({ project_id: req.params.id });
    await Bug.deleteMany({ project_id: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
