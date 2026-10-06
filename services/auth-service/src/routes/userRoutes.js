import express from 'express';
import {
  getDoctors,
  getAllDoctorsAdmin,
  verifyDoctorStatus,
  updateDoctorAvailability,
  getPatientProfile,
  updatePatientThresholds,
  getAllUsersAdmin
} from '../controllers/userController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated route to get list of verified doctors
router.get('/doctors', verifyToken, getDoctors);

// Doctor profile updates (Doctor only)
router.put('/doctors/availability', verifyToken, requireRole('DOCTOR'), updateDoctorAvailability);

// Patient profile & thresholds (Doctor, Patient, or Admin)
router.get('/patients/:patientId?', verifyToken, getPatientProfile);
router.put('/patients/:patientId/thresholds', verifyToken, requireRole('DOCTOR', 'ADMIN'), updatePatientThresholds);

// Admin credentialing & user management routes
router.get('/admin/doctors', verifyToken, requireRole('ADMIN'), getAllDoctorsAdmin);
router.patch('/admin/doctors/:doctorProfileId/verify', verifyToken, requireRole('ADMIN'), verifyDoctorStatus);
router.get('/admin/users', verifyToken, requireRole('ADMIN'), getAllUsersAdmin);

export default router;
