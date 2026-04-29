const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name:          { type: String, required: true, trim: true },
  role:          { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  avatar_url:    { type: String, default: '' },
  created_at:    { type: String, default: () => new Date().toISOString() },
});

module.exports = mongoose.model('User', userSchema);
