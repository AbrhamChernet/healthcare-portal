import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  licenseStateOrCountry: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bio: {
    type: String,
    default: ''
  },
  consultationFee: {
    type: Number,
    default: 100
  },
  availabilitySlots: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String, // "09:00"
    endTime: String,   // "17:00"
    slotDurationMinutes: {
      type: Number,
      default: 30
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('DoctorProfile', doctorProfileSchema);
