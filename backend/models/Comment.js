const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  entity_id:   { type: String, required: true, index: true },
  entity_type: { type: String, enum: ['task', 'bug'], default: 'task', index: true },
  user_id:     { type: String },
  user_name:   { type: String, default: '' },
  content:     { type: String, required: true },
  type:        { type: String, enum: ['comment', 'activity'], default: 'comment' },
  created_at:  { type: String, default: () => new Date().toISOString() },
});

commentSchema.index({ entity_id: 1, entity_type: 1 });

module.exports = mongoose.model('Comment', commentSchema);
