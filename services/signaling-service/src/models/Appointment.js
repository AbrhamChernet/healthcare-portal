import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'WAITING_ROOM', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED',
    index: true
  },
  reasonForVisit: {
    type: String,
    default: 'Routine Consultation'
  },
  notes: {
    type: String,
    default: ''
  },
  patientJoinedWaitingRoomAt: {
    type: Date
  },
  doctorAdmittedPatientAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);
