import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createEHR,
  getPatientEHRs,
  breakGlassAccess,
  exportFHIR,
  getAuditLogs,
  verifyAuditChain,
  getICD10List
} from '../controllers/ehrController.js';

const router = express.Router();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Clinical Reference Data
router.get('/icd10', auth, getICD10List);

// Records CRUD
router.post('/records', auth, createEHR);
router.get('/patient/:patientId', auth, getPatientEHRs);

// Break-Glass Emergency
router.post('/break-glass', auth, breakGlassAccess);

// FHIR Interoperability Export
router.get('/export/fhir/:patientId', auth, exportFHIR);

// Audit Trail & Tamper Verification
router.get('/audit', auth, getAuditLogs);
router.get('/audit/verify', auth, verifyAuditChain);

export default router;
