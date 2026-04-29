const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true, trim: true },
  key:         { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#6366f1' },
  members:     [{ type: String }],
  created_by:  { type: String },
  created_at:  { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('Project', projectSchema);
