import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EHRRecord from './models/EHRRecord.js';
import AuditLog from './models/AuditLog.js';
import { encryptField } from './utils/cryptoUtil.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_ehr';

async function seedEHR() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[EHR-SEED] Connected to MongoDB for EHR initial records.');

    await EHRRecord.deleteMany({});
    await AuditLog.deleteMany({});

    // Sample clinical record
    const dummyPatientId = new mongoose.Types.ObjectId('650000000000000000000001');
    const dummyDoctorId = new mongoose.Types.ObjectId('650000000000000000000002');

    const encryptedNotes = encryptField(
      'Patient presents for 3-month follow-up on essential hypertension. Reports good compliance with lisinopril 10mg. Denies chest pain, shortness of breath, or lower extremity edema. Home blood pressure logs average 128/82 mmHg. Recommend continuing current pharmacotherapy and 30 minutes daily moderate cardiovascular exercise.'
    );

    const record = await EHRRecord.create({
      patientId: dummyPatientId,
      patientName: 'John Doe',
      doctorId: dummyDoctorId,
      doctorName: 'Dr. Sarah Chen, MD',
      visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      diagnoses: [
        { code: 'I10', description: 'Essential (primary) hypertension', type: 'PRIMARY' },
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'SECONDARY' }
      ],
      clinicalNotesEncrypted: encryptedNotes,
      prescriptions: [
        {
          medicationName: 'Lisinopril',
          rxNormCode: '29046',
          dosage: '10mg',
          frequency: 'Once Daily',
          durationDays: 90,
          instructions: 'Take orally in the morning with water.'
        },
        {
          medicationName: 'Metformin HCl',
          rxNormCode: '6809',
          dosage: '500mg',
          frequency: 'Twice Daily',
          durationDays: 90,
          instructions: 'Take with meals.'
        }
      ],
      vitalsSnapshot: {
        heartRate: 72,
        bloodPressure: '126/82',
        spo2: 98,
        temperature: 36.8,
        glucose: 104,
        respiratoryRate: 16
      }
    });

    // Seed initial genesis block in AuditLog
    await AuditLog.logAction({
      userId: dummyDoctorId.toString(),
      userName: 'Dr. Sarah Chen, MD',
      userRole: 'DOCTOR',
      action: 'CREATE_EHR',
      resourceId: record._id.toString(),
      patientId: dummyPatientId.toString(),
      details: 'Genesis consultation EHR record created.'
    });

    console.log('[EHR-SEED] Sample EHR record and Genesis audit block created successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[EHR-SEED] Error seeding:', err);
    process.exit(1);
  }
}

seedEHR();
