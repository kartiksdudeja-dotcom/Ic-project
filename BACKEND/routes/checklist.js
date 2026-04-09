const express = require('express');
const router = express.Router();
const Checklist = require('../models/Checklist');
const ChecklistTemplate = require('../models/ChecklistTemplate'); // Added template model
const multer = require('multer');
const path = require('path');

const { uploadToFirebase } = require('../middleware/firebaseUpload');

// Multer memory storage for Firebase
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Template Management (For Manager/Chairman) ---

// Get the current checklist template (active tasks)
router.get('/template/all', async (req, res) => {
  try {
    const template = await ChecklistTemplate.find({ isActive: true });
    res.json({ success: true, tasks: template });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Add a new task point to the daily checklist
router.post('/template/add', async (req, res) => {
  const { taskName } = req.body;
  try {
    const newTask = new ChecklistTemplate({ taskName });
    await newTask.save();
    res.json({ success: true, task: newTask });
  } catch (err) { res.status(500).json({ success: false, message: 'Task already exists or error saving' }); }
});

// Remove a task point (deactivate)
router.delete('/template/:id', async (req, res) => {
  try {
    await ChecklistTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task removed from template' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// --- Daily Checklist Logic ---

// Get checklist for a specific date (YYYY-MM-DD) or current day
router.get('/:date', async (req, res) => {
  const { date } = req.params;
  try {
    let checklist = await Checklist.findOne({ date });
    const template = await ChecklistTemplate.find({ isActive: true });
    const templateTasks = template.map(t => t.taskName);

    if (!checklist) {
      // Create fresh list from template
      const dailyTasks = template.length > 0 
        ? template.map(t => ({ task: t.taskName, isDone: false }))
        : [{ task: 'General Cleaning', isDone: false }];

      return res.json({ 
        success: true, 
        isNew: true, 
        items: dailyTasks,
        status: 'Pending'
      });
    }

    // SYNC LOGIC: If a new task was added to template but isn't in today's checklist yet
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      let needsSave = false;
      templateTasks.forEach(taskName => {
        const alreadyExists = checklist.items.some(it => it.task === taskName);
        if (!alreadyExists) {
          checklist.items.push({ task: taskName, isDone: false });
          checklist.status = 'Pending'; // Re-open if a new task is added
          needsSave = true;
        }
      });
      if (needsSave) await checklist.save();
    }

    res.json({ success: true, checklist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create or Update checklist with photo proof
router.post('/', upload.single('photo'), async (req, res) => {
  const { date, items, completedBy, status } = req.body;
  const parsedItems = JSON.parse(items);
  
  try {
    let checklist = await Checklist.findOne({ date });
    const updateData = {
      date,
      items: parsedItems,
      status: status || 'Pending',
      completedBy,
      completedAt: status === 'Completed' ? new Date() : null
    };

    if (req.file) {
      const publicUrl = await uploadToFirebase(req.file, 'checklists');
      updateData.photoProof = publicUrl;
    }

    if (checklist) {
      checklist = await Checklist.findByIdAndUpdate(checklist._id, updateData, { new: true });
    } else {
      checklist = new Checklist(updateData);
      await checklist.save();
    }
    
    res.json({ success: true, checklist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all checklist history for audit
router.get('/history/all', async (req, res) => {
  try {
    const history = await Checklist.find().sort({ date: -1 }).limit(30);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
