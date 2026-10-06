import express from 'express';
import { z } from 'zod';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  setupMFA,
  verifyAndEnableMFA,
  recordConsent
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name is required'),
    role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).optional(),
    doctorDetails: z.object({
      specialization: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseStateOrCountry: z.string().optional(),
      bio: z.string().optional(),
      consultationFee: z.number().optional()
    }).optional(),
    patientDetails: z.object({
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      bloodGroup: z.string().optional()
    }).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    mfaToken: z.string().optional()
  })
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);

// MFA endpoints
router.post('/mfa/setup', verifyToken, setupMFA);
router.post('/mfa/verify', verifyToken, verifyAndEnableMFA);

// Consent
router.post('/consent', verifyToken, recordConsent);

export default router;
