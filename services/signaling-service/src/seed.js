import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_consultations';

async function seedAppointments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[CONSULTATION-SEED] Connected to MongoDB for appointments.');

    await Appointment.deleteMany({});

    // Appointment with static test room ID: room-cardio-consult-101
    await Appointment.create({
      roomId: 'room-cardio-consult-101',
      doctorId: new mongoose.Types.ObjectId('650000000000000000000002'),
      doctorName: 'Dr. Sarah Chen, MD',
      patientId: new mongoose.Types.ObjectId('650000000000000000000001'),
      patientName: 'John Doe',
      scheduledAt: new Date(),
      durationMinutes: 30,
      reasonForVisit: 'Hypertension Management & Wearable Vitals Telemetry Review',
      status: 'SCHEDULED'
    });

    console.log('[CONSULTATION-SEED] Seeded initial appointment with Room ID: room-cardio-consult-101');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAppointments();
