const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  project_id: { type: String, required: true, unique: true },
  seq:        { type: Number, default: 0 },
});

// Auto-increment key helper
counterSchema.statics.getNextKey = async function (projectId, prefix) {
  const result = await this.findOneAndUpdate(
    { project_id: projectId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `${prefix}-${result.seq}`;
};

module.exports = mongoose.model('Counter', counterSchema);
