const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdBy: {
    type: String, // Store name or username
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  comments: [
    {
      user: String,
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
