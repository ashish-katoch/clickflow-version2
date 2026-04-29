const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  project_id:      { type: String, required: true, index: true },
  key:             { type: String, required: true },
  title:           { type: String, required: true, trim: true },
  description:     { type: String, default: '' },
  status:          { type: String, enum: ['backlog', 'in_progress', 'completed'], default: 'backlog', index: true },
  priority:        { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignee_id:     { type: String, default: null, index: true },
  due_date:        { type: String, default: null },
  created_by:      { type: String },
  created_by_name: { type: String, default: '' },
  created_at:      { type: String, default: () => new Date().toISOString() },
  updated_at:      { type: String, default: () => new Date().toISOString() },
  comment_count:   { type: Number, default: 0 },
});

module.exports = mongoose.model('Task', taskSchema);
