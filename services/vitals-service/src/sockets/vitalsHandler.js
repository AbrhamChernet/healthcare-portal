import BiometricLog from '../models/BiometricLog.js';
import { evaluateBiometrics } from '../utils/thresholdEvaluator.js';

export const registerVitalsHandlers = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[VITALS-SOCKET] Connected: ${socket.id} (User: ${user?.name || 'Anonymous'})`);

    // Subscribe to live vitals for a given patient
    socket.on('subscribe-patient-vitals', ({ patientId }) => {
      const room = `vitals:${patientId}`;
      socket.join(room);
      console.log(`[VITALS-SOCKET] ${user?.name || socket.id} subscribed to ${room}`);
    });

    socket.on('unsubscribe-patient-vitals', ({ patientId }) => {
      const room = `vitals:${patientId}`;
      socket.leave(room);
    });

    // Stream a real-time vital reading (from wearable simulator or device)
    socket.on('stream-vital-reading', async (data) => {
      try {
        const { patientId, reading, customThresholds } = data;
        if (!patientId || !reading) return;

        const evaluation = evaluateBiometrics(reading, customThresholds);

        const logEntry = new BiometricLog({
          patientId,
          timestamp: reading.timestamp || new Date(),
          heartRate: reading.heartRate,
          bloodPressure: reading.bloodPressure,
          spo2: reading.spo2,
          temperature: reading.temperature,
          glucose: reading.glucose || null,
          respiratoryRate: reading.respiratoryRate || null,
          source: reading.source || 'SIMULATOR',
          isAbnormal: evaluation.isAbnormal,
          alerts: evaluation.alerts
        });

        // Save to DB
        await logEntry.save();

        const payload = {
          ...logEntry.toObject(),
          isCritical: evaluation.isCritical
        };

        // Broadcast to all doctors/listeners subscribed to this patient
        io.to(`vitals:${patientId}`).emit('live-vital-update', payload);

        // If critical vital threshold breached, trigger high-priority alert escalation
        if (evaluation.isCritical) {
          io.to(`vitals:${patientId}`).emit('critical-vital-escalation', {
            patientId,
            timestamp: new Date().toISOString(),
            alerts: evaluation.alerts,
            reading
          });
        }
      } catch (err) {
        console.error('[VITALS-SOCKET] Error processing vital reading:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[VITALS-SOCKET] Disconnected: ${socket.id}`);
    });
  });
};
