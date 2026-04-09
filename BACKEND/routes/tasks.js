const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const admin = require('firebase-admin');

// Helper to send notifications to all users with tokens
const sendNotificationToAll = async (title, body) => {
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: "" } });
    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    
    console.log(`📡 Sending notifications to ${tokens.length} subscribers...`);
    
    if (tokens.length === 0) {
      console.log('⚠️ No active tokens found in database.');
      return;
    }

    const message = {
      notification: { title, body },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Push Sent: ${response.successCount} success, ${response.failureCount} failure.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Token failure [${tokens[idx].slice(0, 10)}...]:`, resp.error.message);
        }
      });
    }
  } catch (error) {
    console.error('❌ Critical Notification Error:', error);
  }
};

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  const { title, description, createdBy } = req.body;
  try {
    const newTask = new Task({ title, description, createdBy });
    await newTask.save();
    
    // Notify all users
    sendNotificationToAll(`New Task: ${title}`, `Assigned/Created by ${createdBy}`);
    
    res.json({ success: true, task: newTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update task status (e.g., Pending -> Completed or back)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // Notify status change
    sendNotificationToAll(`Task Update: ${task.title}`, `Status changed to ${status}`);
    
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add a comment to a task (reason why not done, etc.)
router.post('/:id/comment', async (req, res) => {
  const { user, text } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ user, text });
    await task.save();
    
    // Notify all users
    sendNotificationToAll(`New Note on: ${task.title}`, `${user}: ${text}`);

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a comment
router.delete('/:id/comment/:commentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.pull({ _id: req.params.commentId });
    await task.save();
    res.json({ success: true, message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
