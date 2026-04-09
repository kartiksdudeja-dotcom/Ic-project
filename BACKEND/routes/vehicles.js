const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');
const adminAuth = require('../middleware/adminAuth');

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/vehicles
//  List all vehicles with their violation counts
//  Query: page, limit, isBlacklisted
// ═══════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, isBlacklisted } = req.query;

    const filter = {};
    if (isBlacklisted !== undefined) filter.isBlacklisted = isBlacklisted === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Vehicle.countDocuments(filter);

    const vehicles = await Vehicle.find(filter)
      .sort({ totalViolations: -1 }) // worst offenders first
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      vehicles,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/vehicles/:vehicleNumber
//  Get full profile of one vehicle + all its violations
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:vehicleNumber', async (req, res) => {
  try {
    const vehicleNumber = req.params.vehicleNumber.toUpperCase().trim();

    const vehicle = await Vehicle.findOne({ vehicleNumber });

    if (!vehicle) {
      return res.status(200).json({
        success: true,
        found: false,
        vehicleNumber,
        message: 'No violations on record for this vehicle.',
      });
    }

    // Get all violations for this vehicle
    const violations = await Violation.find({ vehicleNumber }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      found: true,
      vehicle,
      violations,
      summary: {
        totalViolations: vehicle.totalViolations,
        totalFines: vehicle.totalFines,
        totalFineAmount: vehicle.totalFineAmount,
        totalPaid: vehicle.totalPaidAmount,
        totalDue: vehicle.totalFineAmount - vehicle.totalPaidAmount,
      },
    });
  } catch (error) {
    console.error('Get vehicle profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PATCH /api/vehicles/:vehicleNumber/blacklist   (admin only)
//  Blacklist or un-blacklist a vehicle
//  Body: { blacklisted: true/false }
// ═══════════════════════════════════════════════════════════════════════════
router.patch('/:vehicleNumber/blacklist', adminAuth, async (req, res) => {
  try {
    const vehicleNumber = req.params.vehicleNumber.toUpperCase().trim();
    const { blacklisted = true } = req.body;

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleNumber },
      { isBlacklisted: blacklisted },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({
      success: true,
      message: blacklisted
        ? `🚫 ${vehicleNumber} has been blacklisted.`
        : `✅ ${vehicleNumber} removed from blacklist.`,
      vehicle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
