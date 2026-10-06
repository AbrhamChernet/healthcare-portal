import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Appointment from '../models/Appointment.js';
import { generateTurnCredentials } from '../utils/turnCredentials.js';

const router = express.Router();

// Middleware to verify JWT
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Book a new Consultation Appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const { doctorId, doctorName, patientId, patientName, scheduledAt, reasonForVisit, durationMinutes } = req.body;

    const roomId = `room-${uuidv4()}`;

    const appointment = new Appointment({
      roomId,
      doctorId: doctorId || req.user.id,
      doctorName: doctorName || 'Physician',
      patientId: patientId || req.user.id,
      patientName: patientName || req.user.name,
      scheduledAt: new Date(scheduledAt || Date.now()),
      durationMinutes: durationMinutes || 30,
      reasonForVisit: reasonForVisit || 'General Follow-up',
      status: 'SCHEDULED'
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule appointment: ' + err.message });
  }
});

// Get User's Appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'PATIENT') {
      query.patientId = req.user.id;
    }

    const appointments = await Appointment.find(query).sort({ scheduledAt: -1 }).lean();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments: ' + err.message });
  }
});

// Get Appointment details by Room ID
router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ roomId: req.params.roomId }).lean();
    if (!appointment) {
      return res.status(404).json({ error: 'Consultation room not found' });
    }

    // Check authorization
    const isDoctor = appointment.doctorId.toString() === req.user.id.toString();
    const isPatient = appointment.patientId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to view this consultation' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get room details' });
  }
});

// Time-Limited TURN Credentials Endpoint
router.get('/turn-credentials', auth, (req, res) => {
  try {
    const creds = generateTurnCredentials(req.user.id);
    res.json(creds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate TURN credentials' });
  }
});

export default router;
