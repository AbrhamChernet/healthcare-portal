import EHRRecord from '../models/EHRRecord.js';
import AuditLog from '../models/AuditLog.js';
import { encryptField, decryptField, computeAuditHash } from '../utils/cryptoUtil.js';
import { checkDrugAllergyConflicts, exportToFHIRBundle, ICD10_CODES } from '../utils/clinicalStandards.js';

// Create a new EHR record with AES-256-GCM encryption
export const createEHR = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      consultationId,
      diagnoses,
      clinicalNotes,
      prescriptions,
      vitalsSnapshot,
      patientAllergies
    } = req.body;

    // Drug allergy check
    const allergyWarnings = checkDrugAllergyConflicts(prescriptions || [], patientAllergies || []);

    // Encrypt sensitive clinical notes using AES-256-GCM
    const encryptedNotes = encryptField(clinicalNotes || 'Routine clinical assessment completed.');

    const ehr = new EHRRecord({
      patientId,
      patientName,
      doctorId: req.user.id,
      doctorName: req.user.name,
      consultationId: consultationId || null,
      diagnoses: diagnoses || [{ code: 'Z00.00', description: 'General adult medical examination' }],
      clinicalNotesEncrypted: encryptedNotes,
      prescriptions: prescriptions || [],
      vitalsSnapshot: vitalsSnapshot || {}
    });

    await ehr.save();

    // Log to tamper-evident audit log
    await AuditLog.logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_EHR',
      resourceId: ehr._id.toString(),
      patientId: patientId.toString(),
      ipAddress: req.ip,
      details: `Created EHR record with ${diagnoses?.length || 0} diagnoses and ${prescriptions?.length || 0} prescriptions.`
    });

    res.status(201).json({
      message: 'EHR record saved securely with AES-256-GCM encryption',
      recordId: ehr._id,
      allergyWarnings,
      ehr: {
        ...ehr.toObject(),
        clinicalNotes // Return decrypted for immediate author review
      }
    });
  } catch (err) {
    console.error('[EHR] Error creating record:', err);
    res.status(500).json({ error: 'Failed to create EHR: ' + err.message });
  }
};

// Get EHR records for a patient (Decrypts notes for authorized user)
export const getPatientEHRs = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check authorization: Must be the patient, a doctor, or an admin
    if (req.user.role === 'PATIENT' && req.user.id !== patientId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own medical records' });
    }

    const records = await EHRRecord.find({ patientId }).sort({ visitDate: -1 }).lean();

    // Decrypt clinical notes
    const decryptedRecords = records.map(r => ({
      ...r,
      clinicalNotes: decryptField(r.clinicalNotesEncrypted)
    }));

    // Log access
    await AuditLog.logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'READ_EHR',
      resourceId: `PATIENT_RECORDS_${patientId}`,
      patientId: patientId.toString(),
      ipAddress: req.ip,
      details: `Viewed ${records.length} EHR records for patient.`
    });

    res.json(decryptedRecords);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve records: ' + err.message });
  }
};

// Break-Glass Emergency Access Flow
export const breakGlassAccess = async (req, res) => {
  try {
    const { patientId, reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Valid emergency clinical justification is required.' });
    }

    const records = await EHRRecord.find({ patientId }).sort({ visitDate: -1 }).lean();
    const decryptedRecords = records.map(r => ({
      ...r,
      clinicalNotes: decryptField(r.clinicalNotesEncrypted)
    }));

    // Explicit high-priority tamper-evident audit log
    await AuditLog.logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BREAK_GLASS_ACCESS',
      resourceId: `BREAK_GLASS_PATIENT_${patientId}`,
      patientId: patientId.toString(),
      ipAddress: req.ip,
      isBreakGlass: true,
      details: `EMERGENCY OVERRIDE: ${reason}`
    });

    res.json({
      alert: 'EMERGENCY BREAK-GLASS ACCESS GRANTED. This action has been recorded in the immutable audit log.',
      records: decryptedRecords
    });
  } catch (err) {
    res.status(500).json({ error: 'Break-glass failed: ' + err.message });
  }
};

// Export Patient Records to HL7 FHIR standard
export const exportFHIR = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await EHRRecord.find({ patientId }).lean();
    const bundle = exportToFHIRBundle({ _id: patientId, name: 'Patient Record' }, records);

    await AuditLog.logAction({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EXPORT_FHIR',
      resourceId: `FHIR_${patientId}`,
      patientId: patientId.toString(),
      ipAddress: req.ip,
      details: 'Exported records to FHIR R4 Bundle format.'
    });

    res.json(bundle);
  } catch (err) {
    res.status(500).json({ error: 'FHIR export failed: ' + err.message });
  }
};

// Audit Log Viewer (Admin Only)
export const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can inspect audit logs' });
    }

    const logs = await AuditLog.find().sort({ index: -1 }).limit(100).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
};

// Cryptographic Verification of the Entire Audit Hash Chain
export const verifyAuditChain = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ index: 1 }).lean();
    let isTampered = false;
    let tamperedIndex = null;

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      const expectedPreviousHash = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : logs[i - 1].hash;

      if (entry.previousHash !== expectedPreviousHash) {
        isTampered = true;
        tamperedIndex = entry.index;
        break;
      }

      const calculatedHash = computeAuditHash({
        index: entry.index,
        timestamp: new Date(entry.timestamp).toISOString(),
        userId: entry.userId,
        action: entry.action,
        resourceId: entry.resourceId,
        previousHash: entry.previousHash
      });

      if (calculatedHash !== entry.hash) {
        isTampered = true;
        tamperedIndex = entry.index;
        break;
      }
    }

    res.json({
      verified: !isTampered,
      totalEntriesChecked: logs.length,
      status: isTampered ? `CHAIN TAMPER DETECTED AT BLOCK #${tamperedIndex}` : 'HASH CHAIN INTACT AND VERIFIED',
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
};

// Get ICD-10 reference list
export const getICD10List = (req, res) => {
  res.json(ICD10_CODES);
};
