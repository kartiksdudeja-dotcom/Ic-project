const mongoose = require('mongoose');

// ─── Single violation record ───────────────────────────────────────────────
const violationSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      uppercase: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    officeNumber: {
      type: String,
      trim: true,
      default: '',
    },
    violationType: {
      type: String,
      enum: [
        'NO_PARKING', 
        'BLOCKED_ENTRANCE', 
        'DOUBLE_PARKING', 
        'FIRE_HYDRANT', 
        'LOADING_ZONE', 
        'DISABLED_SPACE', 
        'OVERNIGHT', 
        'OTHER'
      ],
      default: 'NO_PARKING',
    },
    // warning = 1st time, fine = 2nd+ time
    action: {
      type: String,
      enum: ['WARNING', 'FINE'],
      required: true,
    },
    fineAmount: {
      type: Number,
      default: 0, // 0 for warnings, 500 for fines
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    finePaidAt: {
      type: Date,
      default: null,
    },
    // Photo of the vehicle (stored as URL or base64 string)
    vehiclePhoto: {
      type: String,
      default: '',
    },
    // Which guard recorded this
    recordedBy: {
      type: String,
      trim: true,
      default: 'Security Guard',
    },
    // How many total violations this vehicle has had (at time of this record)
    violationCount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Index for fast lookup by vehicle number
violationSchema.index({ vehicleNumber: 1 });
violationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Violation', violationSchema);
