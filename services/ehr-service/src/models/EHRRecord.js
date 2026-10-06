import mongoose from 'mongoose';

const encryptedFieldSchema = new mongoose.Schema({
  ciphertext: String,
  iv: String,
  authTag: String
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  medicationName: { type: String, required: true },
  rxNormCode: { type: String, default: '' },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  durationDays: { type: Number, default: 7 },
  instructions: String,
  prescribedAt: { type: Date, default: Date.now }
}, { _id: false });

const ehrRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true
  },
  consultationId: {
    type: String,
    default: null
  },
  visitDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Clinical Diagnoses with ICD-10
  diagnoses: [{
    code: { type: String, required: true }, // e.g. "I10"
    description: { type: String, required: true }, // "Essential (primary) hypertension"
    type: { type: String, enum: ['PRIMARY', 'SECONDARY'], default: 'PRIMARY' }
  }],
  // Sensitive clinical evaluation fields encrypted with AES-256-GCM
  clinicalNotesEncrypted: {
    type: encryptedFieldSchema,
    required: true
  },
  prescriptions: [prescriptionSchema],
  vitalsSnapshot: {
    heartRate: Number,
    bloodPressure: String,
    spo2: Number,
    temperature: Number,
    glucose: Number,
    respiratoryRate: Number
  },
  status: {
    type: String,
    enum: ['DRAFT', 'FINALIZED', 'AMENDED'],
    default: 'FINALIZED'
  }
}, {
  timestamps: true
});

export default mongoose.model('EHRRecord', ehrRecordSchema);
