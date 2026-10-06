import express from 'express';
import jwt from 'jsonwebtoken';
import BiometricLog from '../models/BiometricLog.js';
import { evaluateBiometrics } from '../utils/thresholdEvaluator.js';

const router = express.Router();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Record a single vital log
router.post('/logs', auth, async (req, res) => {
  try {
    const { patientId, reading, customThresholds } = req.body;
    const targetPatientId = patientId || req.user.id;

    const evaluation = evaluateBiometrics(reading, customThresholds);

    const log = new BiometricLog({
      patientId: targetPatientId,
      timestamp: reading.timestamp || new Date(),
      heartRate: reading.heartRate,
      bloodPressure: reading.bloodPressure,
      spo2: reading.spo2,
      temperature: reading.temperature,
      glucose: reading.glucose,
      respiratoryRate: reading.respiratoryRate,
      source: reading.source || 'MANUAL_CLINICIAN',
      isAbnormal: evaluation.isAbnormal,
      alerts: evaluation.alerts
    });

    await log.save();
    res.status(201).json({ message: 'Vital logged', log, isCritical: evaluation.isCritical });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record vital: ' + err.message });
  }
});

// Get patient's historical vitals
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await BiometricLog.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(logs.reverse()); // Chronological order for charts
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vitals: ' + err.message });
  }
});

// Get patient vital summary statistics
router.get('/patient/:patientId/summary', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const logs = await BiometricLog.find({ patientId }).sort({ timestamp: -1 }).limit(100).lean();

    if (logs.length === 0) {
      return res.json({
        totalReadings: 0,
        avgHeartRate: null,
        avgSpo2: null,
        latestReading: null
      });
    }

    const avgHeartRate = Math.round(logs.reduce((acc, l) => acc + l.heartRate, 0) / logs.length);
    const avgSpo2 = Math.round((logs.reduce((acc, l) => acc + l.spo2, 0) / logs.length) * 10) / 10;
    const abnormalCount = logs.filter(l => l.isAbnormal).length;

    res.json({
      totalReadings: logs.length,
      avgHeartRate,
      avgSpo2,
      abnormalCount,
      latestReading: logs[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary: ' + err.message });
  }
});

export default router;
