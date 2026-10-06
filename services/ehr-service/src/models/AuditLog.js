import mongoose from 'mongoose';
import { computeAuditHash } from '../utils/cryptoUtil.js';

const auditLogSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  userId: {
    type: String,
    required: true,
    immutable: true
  },
  userName: {
    type: String,
    default: 'Unknown'
  },
  userRole: {
    type: String,
    required: true,
    immutable: true
  },
  action: {
    type: String,
    enum: [
      'READ_EHR',
      'CREATE_EHR',
      'UPDATE_EHR',
      'EXPORT_FHIR',
      'BREAK_GLASS_ACCESS',
      'VIEW_AUDIT_LOG'
    ],
    required: true,
    immutable: true
  },
  resourceId: {
    type: String,
    required: true,
    immutable: true
  },
  patientId: {
    type: String,
    default: null,
    immutable: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  details: {
    type: String,
    default: ''
  },
  isBreakGlass: {
    type: Boolean,
    default: false
  },
  previousHash: {
    type: String,
    required: true,
    immutable: true
  },
  hash: {
    type: String,
    required: true,
    immutable: true
  }
}, {
  timestamps: false // Handled explicitly for tamper-proofing
});

/**
 * Append-only helper to create a verifiable hash-chained audit log
 */
auditLogSchema.statics.logAction = async function({
  userId,
  userName,
  userRole,
  action,
  resourceId,
  patientId,
  ipAddress,
  details,
  isBreakGlass
}) {
  const lastEntry = await this.findOne().sort({ index: -1 });
  const index = lastEntry ? lastEntry.index + 1 : 1;
  const previousHash = lastEntry ? lastEntry.hash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date();

  const hash = computeAuditHash({
    index,
    timestamp: timestamp.toISOString(),
    userId,
    action,
    resourceId,
    previousHash
  });

  return this.create({
    index,
    timestamp,
    userId,
    userName: userName || 'Authenticated User',
    userRole,
    action,
    resourceId,
    patientId: patientId || null,
    ipAddress: ipAddress || '127.0.0.1',
    details: details || '',
    isBreakGlass: !!isBreakGlass,
    previousHash,
    hash
  });
};

export default mongoose.model('AuditLog', auditLogSchema);
