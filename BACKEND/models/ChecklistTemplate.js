const mongoose = require('mongoose');

const ChecklistTemplateSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
