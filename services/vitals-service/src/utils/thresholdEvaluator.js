/**
 * Evaluate biometric reading against standard clinical thresholds or customized patient thresholds
 */
export const evaluateBiometrics = (reading, customThresholds = {}) => {
  const alerts = [];
  let isAbnormal = false;
  let isCritical = false;

  const thresholds = {
    heartRateMin: customThresholds.heartRateMin || 55,
    heartRateMax: customThresholds.heartRateMax || 105,
    systolicMax: customThresholds.systolicMax || 135,
    diastolicMax: customThresholds.diastolicMax || 88,
    spo2Min: customThresholds.spo2Min || 94,
    tempMax: customThresholds.tempMax || 38.0
  };

  // Heart Rate Check
  if (reading.heartRate > thresholds.heartRateMax) {
    isAbnormal = true;
    if (reading.heartRate > 120) isCritical = true;
    alerts.push(`ELEVATED_HEART_RATE: ${reading.heartRate} BPM (Normal: ${thresholds.heartRateMin}-${thresholds.heartRateMax})`);
  } else if (reading.heartRate < thresholds.heartRateMin) {
    isAbnormal = true;
    if (reading.heartRate < 48) isCritical = true;
    alerts.push(`LOW_HEART_RATE: ${reading.heartRate} BPM (Bradycardia Risk)`);
  }

  // Blood Pressure Check
  if (reading.bloodPressure) {
    const { systolic, diastolic } = reading.bloodPressure;
    if (systolic >= 180 || diastolic >= 120) {
      isAbnormal = true;
      isCritical = true;
      alerts.push(`CRITICAL_HYPERTENSIVE_CRISIS: ${systolic}/${diastolic} mmHg`);
    } else if (systolic > thresholds.systolicMax || diastolic > thresholds.diastolicMax) {
      isAbnormal = true;
      alerts.push(`HIGH_BLOOD_PRESSURE: ${systolic}/${diastolic} mmHg`);
    }
  }

  // SpO2 Check
  if (reading.spo2 < thresholds.spo2Min) {
    isAbnormal = true;
    if (reading.spo2 < 90) isCritical = true;
    alerts.push(`LOW_OXYGEN_SATURATION: ${reading.spo2}% (Hypoxemia Risk)`);
  }

  // Temperature Check
  if (reading.temperature > thresholds.tempMax) {
    isAbnormal = true;
    if (reading.temperature > 39.5) isCritical = true;
    alerts.push(`FEVER_DETECTED: ${reading.temperature}°C`);
  }

  return {
    isAbnormal,
    isCritical,
    alerts
  };
};
