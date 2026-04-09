const mongoose = require('mongoose');

const ChecklistSchema = new mongoose.Schema({
  date: {
    type: String, // String format 'YYYY-MM-DD' for easy daily lookup
    required: true,
    unique: true
  },
  items: [
    {
      task: String,
      isDone: { type: Boolean, default: false }
    }
  ],
  photoProof: {
    type: String, // URL/Path to the proof image
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  completedBy: {
    type: String, // Name of the caretaker
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Checklist', ChecklistSchema);
