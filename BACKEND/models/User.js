const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true, // In a real app, hash this!
  },
  role: {
    type: String,
    enum: ['Secretary', 'Chairman', 'Treasurer', 'Manager', 'Caretaker'],
    required: true,
  },
    name: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
