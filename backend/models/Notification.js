const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  user_id:    { type: String, required: true, index: true },
  type:       { type: String, enum: ['task_assigned', 'bug_assigned', 'status_changed', 'comment_added'], required: true },
  message:    { type: String, required: true },
  link:       { type: String, default: '' },
  read:       { type: Boolean, default: false, index: true },
  created_at: { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('Notification', notificationSchema);
