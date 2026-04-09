const mongoose = require('mongoose');

// ─── Tracks total violation count per unique vehicle ───────────────────────
// This is the "master record" — updated every time a vehicle is caught
const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,     // one doc per vehicle number
      uppercase: true,
      trim: true,
    },
    totalViolations: {
      type: Number,
      default: 0,
    },
    totalFines: {
      type: Number,
      default: 0,       // number of fines issued (not warnings)
    },
    totalFineAmount: {
      type: Number,
      default: 0,       // total money owed
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,   // future feature: block entry
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
