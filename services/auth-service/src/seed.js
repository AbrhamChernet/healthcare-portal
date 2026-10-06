import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import DoctorProfile from './models/DoctorProfile.js';
import PatientProfile from './models/PatientProfile.js';
import Consent from './models/Consent.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_auth';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[SEED] Connected to MongoDB for initial clinical demo accounts.');

    // Clear existing demo accounts
    await User.deleteMany({ email: { $in: [
      'dr.chen@telehealth.com',
      'dr.patel@telehealth.com',
      'john.doe@patient.com',
      'admin@telehealth.com'
    ] } });

    // 1. Dr. Sarah Chen, MD (Cardiologist)
    const drChen = await User.create({
      name: 'Dr. Sarah Chen, MD',
      email: 'dr.chen@telehealth.com',
      password: 'Doctor123!',
      role: 'DOCTOR'
    });

    await DoctorProfile.create({
      userId: drChen._id,
      specialization: 'Cardiology & Internal Medicine',
      licenseNumber: 'MD-883921',
      licenseStateOrCountry: 'California Medical Board',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      bio: 'Board-certified cardiologist with 14 years clinical experience specializing in real-time hemodynamic monitoring and remote patient care.',
      consultationFee: 120,
      availabilitySlots: [
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Friday', startTime: '10:00', endTime: '15:00' }
      ]
    });

    // 2. Dr. Marcus Patel, MD (Pulmonologist)
    const drPatel = await User.create({
      name: 'Dr. Marcus Patel, MD',
      email: 'dr.patel@telehealth.com',
      password: 'Doctor123!',
      role: 'DOCTOR'
    });

    await DoctorProfile.create({
      userId: drPatel._id,
      specialization: 'Pulmonology & Respiratory Medicine',
      licenseNumber: 'MD-449102',
      licenseStateOrCountry: 'New York State Board of Medicine',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      bio: 'Specialist in chronic obstructive pulmonary disease (COPD), asthma monitoring, and continuous pulse oximetry tracking.',
      consultationFee: 110,
      availabilitySlots: [
        { dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 'Thursday', startTime: '08:00', endTime: '16:00' }
      ]
    });

    // 3. Patient: John Doe
    const patientJohn = await User.create({
      name: 'John Doe',
      email: 'john.doe@patient.com',
      password: 'Patient123!',
      role: 'PATIENT'
    });

    await PatientProfile.create({
      userId: patientJohn._id,
      dateOfBirth: new Date('1982-06-15'),
      gender: 'Male',
      bloodGroup: 'A+',
      allergies: [
        { substance: 'Penicillin', severity: 'SEVERE', reaction: 'Anaphylaxis / Urticaria' },
        { substance: 'Sulfa Antibiotics', severity: 'MODERATE', reaction: 'Skin rash and pruritus' }
      ],
      chronicConditions: ['Stage 1 Essential Hypertension', 'Hyperlipidemia'],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1 (555) 234-8901'
      },
      customVitalThresholds: {
        heartRateMin: 55,
        heartRateMax: 100,
        systolicMax: 135,
        diastolicMax: 88,
        spo2Min: 94,
        tempMax: 37.8
      }
    });

    // Record Patient Consent
    await Consent.create({
      userId: patientJohn._id,
      consentType: 'TELEHEALTH_TREATMENT',
      version: '1.0',
      agreed: true,
      ipAddress: '127.0.0.1'
    });

    // 4. Admin User
    await User.create({
      name: 'Elena Vance (Clinical Admin)',
      email: 'admin@telehealth.com',
      password: 'AdminPass123!',
      role: 'ADMIN'
    });

    console.log('[SEED] Demo medical team, patient, and admin seeded successfully:');
    console.log(' - Doctor: dr.chen@telehealth.com / Doctor123!');
    console.log(' - Doctor: dr.patel@telehealth.com / Doctor123!');
    console.log(' - Patient: john.doe@patient.com / Patient123!');
    console.log(' - Admin: admin@telehealth.com / AdminPass123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error seeding data:', err);
    process.exit(1);
  }
}

seed();
