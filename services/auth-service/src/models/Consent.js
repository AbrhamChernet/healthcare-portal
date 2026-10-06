import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  consentType: {
    type: String,
    enum: [
      'TELEHEALTH_TREATMENT',
      'PRIVACY_PRACTICES_ACKNOWLEDGMENT',
      'RECORDING_CONSENT',
      'DATA_SHARING'
    ],
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  agreed: {
    type: Boolean,
    required: true,
    default: true
  },
  agreedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

consentSchema.index({ userId: 1, consentType: 1 });

export default mongoose.model('Consent', consentSchema);
