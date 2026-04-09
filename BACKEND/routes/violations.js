const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Violation = require('../models/Violation');
const Vehicle = require('../models/Vehicle');
const adminAuth = require('../middleware/adminAuth');

// ─── Helper: format validation errors nicely ──────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/violations/check
//  Check if a vehicle has been seen before (before recording violation)
//  Body: { vehicleNumber: "MH12AB1234" }
// ═══════════════════════════════════════════════════════════════════════════
router.post(
  '/check',
  [
    body('vehicleNumber')
      .notEmpty().withMessage('Vehicle number is required')
      .trim()
      .toUpperCase(),
  ],
  async (req, res) => {
    const err = validate(req, res);
    if (err) return;

    try {
      const { vehicleNumber } = req.body;

      // Find vehicle master record
      const vehicle = await Vehicle.findOne({ vehicleNumber });

      if (!vehicle) {
        // First time ever seen
        return res.status(200).json({
          success: true,
          vehicleNumber,
          isFirstTime: true,
          totalPastViolations: 0,
          action: 'WARNING',
          message: `First offence. A warning will be issued.`,
        });
      }

      const nextCount = vehicle.totalViolations + 1;
      const action = nextCount === 1 ? 'WARNING' : 'FINE';
      const fineAmount = action === 'FINE' ? Number(process.env.FINE_AMOUNT || 500) : 0;

      return res.status(200).json({
        success: true,
        vehicleNumber,
        isFirstTime: false,
        totalPastViolations: vehicle.totalViolations,
        action,
        fineAmount,
        message:
          action === 'WARNING'
            ? `First offence. A warning will be issued.`
            : `Repeat offender (${vehicle.totalViolations} past violation${vehicle.totalViolations > 1 ? 's' : ''}). Fine of ₹${fineAmount} will be issued.`,
      });
    } catch (error) {
      console.error('Check vehicle error:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

const multer = require('multer');
const { uploadToFirebase } = require('../middleware/firebaseUpload');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ═══════════════════════════════════════════════════════════════════════════
//  POST /api/violations/record
//  Record a new violation (warning or fine)
// ═══════════════════════════════════════════════════════════════════════════
router.post(
  '/record',
  upload.single('photo'),
  [
    body('vehicleNumber').notEmpty().trim().toUpperCase(),
    body('ownerName').notEmpty().trim().withMessage('Owner name required'),
    body('mobileNumber')
      .notEmpty()
      .matches(/^[0-9]{10}$/)
      .withMessage('Mobile number must be 10 digits'),
  ],
  async (req, res) => {
    const err = validate(req, res);
    if (err) return;

    try {
      const {
        vehicleNumber,
        ownerName,
        mobileNumber,
        officeNumber = '',
        violationType = 'NO_PARKING',
        recordedBy = 'Security Guard',
        notes = '',
      } = req.body;

      // Handle Firebase Photo Upload
      let vehiclePhoto = '';
      if (req.file) {
        vehiclePhoto = await uploadToFirebase(req.file, 'violations');
      }

      const FINE_AMOUNT = Number(process.env.FINE_AMOUNT || 500);

      // ── Step 1: Get or create vehicle master record ──────────────────────
      let vehicle = await Vehicle.findOne({ vehicleNumber });

      if (!vehicle) {
        vehicle = new Vehicle({ vehicleNumber });
      }

      // Increment total violations
      vehicle.totalViolations += 1;
      vehicle.lastSeen = new Date();

      const violationCount = vehicle.totalViolations;

      // ── Step 2: Decide action ────────────────────────────────────────────
      // 1st violation = WARNING (no fine)
      // 2nd violation onwards = FINE ₹500
      const action = violationCount === 1 ? 'WARNING' : 'FINE';
      const fineAmount = action === 'FINE' ? FINE_AMOUNT : 0;

      if (action === 'FINE') {
        vehicle.totalFines += 1;
        vehicle.totalFineAmount += fineAmount;
      }

      await vehicle.save();

      // ── Step 3: Create violation record ─────────────────────────────────
      const violation = new Violation({
        vehicleNumber,
        ownerName,
        mobileNumber,
        officeNumber,
        violationType,
        action,
        fineAmount,
        vehiclePhoto,
        recordedBy,
        violationCount,
        notes,
      });

      await violation.save();

      // ── Step 4: Build receipt data ───────────────────────────────────────
      const receipt = buildReceipt(violation, vehicle);

      return res.status(201).json({
        success: true,
        message:
          action === 'WARNING'
            ? '⚠️ Warning issued successfully.'
            : `✅ Fine of ₹${fineAmount} recorded successfully.`,
        violation,
        receipt,
      });
    } catch (error) {
      console.error('Record violation error:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  PATCH /api/violations/:id/pay
//  Mark a fine as paid
//  Body: { paidAmount }  (optional, defaults to fine amount)
// ═══════════════════════════════════════════════════════════════════════════
router.patch('/:id/pay', async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    if (violation.action === 'WARNING') {
      return res.status(400).json({ success: false, message: 'Warnings have no fine to pay.' });
    }

    if (violation.finePaid) {
      return res.status(400).json({ success: false, message: 'Fine already marked as paid.' });
    }

    // Update violation record
    violation.finePaid = true;
    violation.finePaidAt = new Date();
    await violation.save();

    // Update vehicle master record
    await Vehicle.findOneAndUpdate(
      { vehicleNumber: violation.vehicleNumber },
      { $inc: { totalPaidAmount: violation.fineAmount } }
    );

    const receipt = buildReceipt(violation, null);

    return res.status(200).json({
      success: true,
      message: `✅ Fine of ₹${violation.fineAmount} marked as paid.`,
      violation,
      receipt,
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/violations/history
//  Get all violations with filters and pagination
//  Query params: vehicleNumber, action, finePaid, page, limit, startDate, endDate
// ═══════════════════════════════════════════════════════════════════════════
router.get('/history', async (req, res) => {
  try {
    const {
      vehicleNumber,
      action,
      finePaid,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    // Build filter object
    const filter = {};

    if (vehicleNumber) filter.vehicleNumber = vehicleNumber.toUpperCase().trim();
    if (action) filter.action = action.toUpperCase();
    if (finePaid !== undefined) filter.finePaid = finePaid === 'true';

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Violation.countDocuments(filter);

    const violations = await Violation.find(filter)
      .sort({ createdAt: -1 })  // newest first
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      violations,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/violations/:id
//  Get single violation by ID + receipt
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }
    const receipt = buildReceipt(violation, null);
    return res.status(200).json({ success: true, violation, receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

//  DELETE /api/violations/:id
//  Delete a violation record
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const violation = await Violation.findByIdAndDelete(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    // Also decrement vehicle totals if necessary
    await Vehicle.findOneAndUpdate(
      { vehicleNumber: violation.vehicleNumber },
      { 
        $inc: { 
          totalViolations: -1,
          totalFineAmount: violation.action === 'FINE' ? -violation.fineAmount : 0,
          totalFines: violation.action === 'FINE' ? -1 : 0
        } 
      }
    );

    return res.status(200).json({ success: true, message: 'Violation deleted permanently.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ─── Helper: Build receipt object ────────────────────────────────────────
function buildReceipt(violation, vehicle) {
  const date = new Date(violation.createdAt || Date.now());

  return {
    receiptNumber: `RCP-${violation._id?.toString().slice(-8).toUpperCase() || 'XXXXXXXX'}`,
    company: process.env.COMPANY_NAME || 'My Building Society',
    title: violation.action === 'WARNING' ? 'Parking Warning Notice' : 'Parking Fine Receipt',
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    vehicleNumber: violation.vehicleNumber,
    ownerName: violation.ownerName,
    mobileNumber: violation.mobileNumber,
    officeNumber: violation.officeNumber || 'N/A',
    violationType: (violation.violationType || 'OTHER').replace(/_/g, ' '),
    action: violation.action,
    violationCount: violation.violationCount,
    fineAmount: violation.fineAmount,
    finePaid: violation.finePaid,
    finePaidAt: violation.finePaidAt
      ? new Date(violation.finePaidAt).toLocaleDateString('en-IN')
      : null,
    recordedBy: violation.recordedBy,
    notes: violation.notes || '',
    message:
      violation.action === 'WARNING'
        ? 'This is a first warning. A fine of ₹500 will be charged on next violation.'
        : violation.finePaid
        ? `Fine of ₹${violation.fineAmount} has been paid.`
        : `Please pay ₹${violation.fineAmount} immediately to the security office.`,
  };
}

module.exports = router;
