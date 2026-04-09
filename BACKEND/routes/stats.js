const express = require('express');
const router = express.Router();
const Violation = require('../models/Violation');
const Vehicle = require('../models/Vehicle');

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/stats/dashboard
//  All numbers needed for the admin dashboard in one call
// ═══════════════════════════════════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalViolations,
      totalWarnings,
      totalFines,
      unpaidFines,
      todayViolations,
      monthViolations,
      totalVehicles,
      blacklisted,
      fineStats,
    ] = await Promise.all([
      Violation.countDocuments(),
      Violation.countDocuments({ action: 'WARNING' }),
      Violation.countDocuments({ action: 'FINE' }),
      Violation.countDocuments({ action: 'FINE', finePaid: false }),
      Violation.countDocuments({ createdAt: { $gte: startOfToday } }),
      Violation.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ isBlacklisted: true }),
      // Sum up all fines and paid amounts
      Violation.aggregate([
        { $match: { action: 'FINE' } },
        {
          $group: {
            _id: null,
            totalFineAmount: { $sum: '$fineAmount' },
            totalPaidAmount: {
              $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] },
            },
          },
        },
      ]),
    ]);

    const totalFineAmount = fineStats[0]?.totalFineAmount || 0;
    const totalPaidAmount = fineStats[0]?.totalPaidAmount || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalViolations,
        totalWarnings,
        totalFines,
        unpaidFines,
        todayViolations,
        monthViolations,
        totalVehicles,
        blacklisted,
        totalFineAmount,
        totalPaidAmount,
        totalDueAmount: totalFineAmount - totalPaidAmount,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/stats/monthly
//  Last 6 months of violations grouped by month (for chart)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/monthly', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Violation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          warnings: { $sum: { $cond: [{ $eq: ['$action', 'WARNING'] }, 1, 0] } },
          fines: { $sum: { $cond: [{ $eq: ['$action', 'FINE'] }, 1, 0] } },
          fineAmount: { $sum: '$fineAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatted = monthly.map((m) => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      warnings: m.warnings,
      fines: m.fines,
      fineAmount: m.fineAmount,
    }));

    return res.status(200).json({ success: true, monthly: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
