import mongoose from 'mongoose';

const biometricLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  heartRate: {
    type: Number, // bpm
    required: true
  },
  bloodPressure: {
    systolic: { type: Number, required: true },  // mmHg
    diastolic: { type: Number, required: true }  // mmHg
  },
  spo2: {
    type: Number, // percentage, e.g. 98
    required: true
  },
  temperature: {
    type: Number, // Celsius, e.g. 36.8
    required: true
  },
  glucose: {
    type: Number, // mg/dL, e.g. 105
    default: null
  },
  respiratoryRate: {
    type: Number, // breaths/min, e.g. 16
    default: null
  },
  source: {
    type: String,
    enum: ['WEARABLE_IOT', 'MANUAL_CLINICIAN', 'SIMULATOR', 'APPLE_HEALTH', 'GOOGLE_FIT'],
    default: 'SIMULATOR'
  },
  isAbnormal: {
    type: Boolean,
    default: false
  },
  alerts: [String]
}, {
  timestamps: true
});

export default mongoose.model('BiometricLog', biometricLogSchema);
