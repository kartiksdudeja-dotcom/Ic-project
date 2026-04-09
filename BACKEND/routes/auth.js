const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Simple login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save FCM Token
router.post('/save-fcm-token', async (req, res) => {
  const { userId, fcmToken } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.json({ success: true, message: 'FCM Token saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user (simple)
router.get('/me', async (req, res) => {
  // In a real app, this would use a token-based middleware.
  // For now, we'll just keep it simple.
  res.json({ success: true, message: 'Auth active' });
});

module.exports = router;
