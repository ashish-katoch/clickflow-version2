const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  file_name:   { type: String },
  file_url:    { type: String },
  file_type:   { type: String, default: 'image/png' },
  uploaded_by: { type: String },
  created_at:  { type: String, default: () => new Date().toISOString() },
}, { _id: false });

const bugSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  project_id:      { type: String, required: true, index: true },
  key:             { type: String, required: true },
  title:           { type: String, required: true, trim: true },
  description:     { type: String, default: '' },
  status:          { type: String, enum: ['open', 'in_progress', 'ready_for_qa', 'verified', 'closed'], default: 'open', index: true },
  priority:        { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignee_id:     { type: String, default: null, index: true },
  attachments:     [attachmentSchema],
  created_by:      { type: String },
  created_by_name: { type: String, default: '' },
  created_at:      { type: String, default: () => new Date().toISOString() },
  updated_at:      { type: String, default: () => new Date().toISOString() },
  comment_count:   { type: Number, default: 0 },
});

module.exports = mongoose.model('Bug', bugSchema);
