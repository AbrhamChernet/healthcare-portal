import jwt from 'jsonwebtoken';
import Appointment from '../models/Appointment.js';

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  
  if (!token) {
    return next(new Error('AUTHENTICATION_ERROR: Token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!');
    socket.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return next(new Error('AUTHENTICATION_ERROR: Invalid or expired token'));
  }
};

// Verify user authorization for a specific consultation room
export const verifyRoomAuthorization = async (userId, userRole, roomId) => {
  const appointment = await Appointment.findOne({ roomId });
  if (!appointment) {
    return { authorized: false, error: 'Appointment room not found' };
  }

  // Doctor or Patient must match the appointment records, or user must be ADMIN
  const isDoctor = appointment.doctorId.toString() === userId.toString();
  const isPatient = appointment.patientId.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isDoctor && !isPatient && !isAdmin) {
    return { authorized: false, error: 'Forbidden: You are not a participant in this consultation' };
  }

  return {
    authorized: true,
    appointment,
    roleInCall: isDoctor ? 'DOCTOR' : (isPatient ? 'PATIENT' : 'OBSERVER')
  };
};
