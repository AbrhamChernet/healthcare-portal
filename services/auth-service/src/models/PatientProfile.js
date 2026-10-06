import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer Not to Say'],
    default: 'Other'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: [{
    substance: String, // e.g. "Penicillin", "Sulfa drugs", "Latex"
    severity: {
      type: String,
      enum: ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']
    },
    reaction: String
  }],
  chronicConditions: [String], // e.g. ["Hypertension", "Type 2 Diabetes"]
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  // Custom patient biometric thresholds (clinician-customizable)
  customVitalThresholds: {
    heartRateMin: { type: Number, default: 55 },
    heartRateMax: { type: Number, default: 105 },
    systolicMax: { type: Number, default: 135 },
    diastolicMax: { type: Number, default: 88 },
    spo2Min: { type: Number, default: 94 },
    tempMax: { type: Number, default: 38.0 }
  }
}, {
  timestamps: true
});

export default mongoose.model('PatientProfile', patientProfileSchema);
