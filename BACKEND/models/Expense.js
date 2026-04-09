const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['Electrical', 'Cleaning', 'Plumbing', 'Security', 'Maintenance', 'Water', 'Miscellaneous'],
    default: 'Miscellaneous',
  },
  description: {
    type: String,
  },
  photoProof: {
    type: String, // Path to the uploaded image
  },
  createdBy: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
