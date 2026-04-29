const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  identifier:   { type: String, required: true, unique: true, index: true },
  count:        { type: Number, default: 0 },
  locked_until: { type: String },
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
