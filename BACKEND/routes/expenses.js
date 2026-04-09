const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { uploadToFirebase } = require('../middleware/firebaseUpload');

// Multer memory storage for Firebase
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── Get All Expenses ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Create Expense ───────────────────────────────────────────────
router.post('/', upload.single('photo'), async (req, res) => {
  const { title, amount, category, description, createdBy, date } = req.body;
  try {
    let photoProof = null;
    if (req.file) {
      photoProof = await uploadToFirebase(req.file, 'expenses');
    }
    const newExpense = new Expense({ 
      title, 
      amount: parseFloat(amount), 
      category, 
      description, 
      createdBy, 
      date: date || new Date(),
      photoProof 
    });
    await newExpense.save();
    res.json({ success: true, expense: newExpense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Delete Expense ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
