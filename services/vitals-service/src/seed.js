import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BiometricLog from './models/BiometricLog.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_vitals';

async function seedVitals() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[VITALS-SEED] Connected to MongoDB for sample vitals time-series.');

    await BiometricLog.deleteMany({});

    const dummyPatientId = new mongoose.Types.ObjectId('650000000000000000000001');

    // Generate 30 data points over the last 24 hours
    const logs = [];
    const now = Date.now();

    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(now - i * 45 * 60 * 1000); // every 45 mins
      // Realistic variance
      const heartRate = Math.floor(68 + Math.sin(i / 2) * 8 + (Math.random() * 6 - 3));
      const systolic = Math.floor(124 + Math.cos(i / 3) * 6 + (Math.random() * 4 - 2));
      const diastolic = Math.floor(80 + Math.sin(i / 3) * 4 + (Math.random() * 4 - 2));
      const spo2 = Math.floor(97 + Math.random() * 2);
      const temperature = Math.round((36.6 + (Math.random() * 0.4)) * 10) / 10;
      const glucose = Math.floor(95 + Math.random() * 20);

      const isAbnormal = systolic > 135 || heartRate > 100;

      logs.push({
        patientId: dummyPatientId,
        timestamp,
        heartRate,
        bloodPressure: { systolic, diastolic },
        spo2,
        temperature,
        glucose,
        respiratoryRate: 16,
        source: 'WEARABLE_IOT',
        isAbnormal,
        alerts: isAbnormal ? ['ELEVATED_SYSTOLIC_BP'] : []
      });
    }

    await BiometricLog.insertMany(logs);
    console.log(`[VITALS-SEED] Successfully created ${logs.length} biometric time-series records.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[VITALS-SEED] Error seeding:', err);
    process.exit(1);
  }
}

seedVitals();
