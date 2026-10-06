import React, { useState } from 'react';
import { HeartPulse, Droplets, Activity, Thermometer, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function VitalCharts({ vitalsHistory = [], latestReading }) {
  const { t, lang } = useLanguage();
  const [activeMetric, setActiveMetric] = useState('ALL');

  // Take last 20 readings for smooth SVG chart
  const recentVitals = vitalsHistory.slice(-20);

  // SVG dimensions
  const width = 600;
  const height = 140;
  const padding = 24;

  // Render SVG Path for Heart Rate
  const renderHeartRatePath = () => {
    if (recentVitals.length < 2) return '';
    const minHR = 50;
    const maxHR = 140;

    const points = recentVitals.map((v, i) => {
      const x = padding + (i / (recentVitals.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((v.heartRate - minHR) / (maxHR - minHR)) * (height - 2 * padding);
      return `${x},${Math.max(padding, Math.min(height - padding, y))}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Render SVG Path for Systolic BP
  const renderSystolicPath = () => {
    if (recentVitals.length < 2) return '';
    const minBP = 80;
    const maxBP = 200;

    const points = recentVitals.map((v, i) => {
      const sys = v.bloodPressure?.systolic || 120;
      const x = padding + (i / (recentVitals.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((sys - minBP) / (maxBP - minBP)) * (height - 2 * padding);
      return `${x},${Math.max(padding, Math.min(height - padding, y))}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const current = latestReading || (vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1] : null);

  // Calculate vital status colors
  const isHrElevated = current?.heartRate > 100;
  const isBpElevated = current?.bloodPressure && (current.bloodPressure.systolic > 135 || current.bloodPressure.diastolic > 88);
  const isSpo2Low = current?.spo2 && current.spo2 < 95;

  return (
    <div className="space-y-5">
      {/* 4 Premium Glassmorphic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate Card */}
        <div className="glass-card rounded-3xl p-5 border border-white/80 shadow-md relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" /> {t('heartRate')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isHrElevated
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {isHrElevated ? t('vitalElevated') : t('vitalNormal')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {current?.heartRate || 72}
            </span>
            <span className="text-xs font-semibold text-slate-400">{t('bpm')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('rangeLabel')}: {t('normalRangeText')}</span>
            <span className="text-orange-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {t('sinusRhythm')}
            </span>
          </div>

          {/* Bottom color accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
        </div>

        {/* Blood Pressure Card */}
        <div className="glass-card rounded-3xl p-5 border border-white/80 shadow-md relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <Activity className="w-4 h-4 text-orange-500" /> {t('bloodPressure')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isBpElevated
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {isBpElevated ? t('vitalElevated') : t('optimal')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {current?.bloodPressure ? `${current.bloodPressure.systolic}/${current.bloodPressure.diastolic}` : '122/80'}
            </span>
            <span className="text-xs font-semibold text-slate-400">{t('bpUnit')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('targetLabel')}: {t('bpTargetText')}</span>
            <span className="text-orange-600 font-semibold">{t('arterialLog')}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
        </div>

        {/* SpO2 Card */}
        <div className="glass-card rounded-3xl p-5 border border-white/80 shadow-md relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <Droplets className="w-4 h-4 text-amber-500" /> {t('oxygen')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isSpo2Low
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {isSpo2Low ? t('vitalHypoxia') : t('vitalNormal')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {current?.spo2 || 98}
            </span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('targetLabel')}: {t('spo2TargetText')}</span>
            <span className="text-orange-600 font-semibold">{t('pulseOximetry')}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
        </div>

        {/* Temperature Card */}
        <div className="glass-card rounded-3xl p-5 border border-white/80 shadow-md relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <Thermometer className="w-4 h-4 text-orange-500" /> {t('temp')}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {t('normal')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {current?.temperature || 36.8}
            </span>
            <span className="text-xs font-semibold text-slate-400">{t('tempUnit')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('normal')}: {t('tempNormalText')}</span>
            <span className="text-orange-600 font-semibold">{t('afebrile')}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
      </div>

      {/* Critical Escalation Notification Banner */}
      {current?.isAbnormal && (
        <div className="p-4 bg-gradient-to-r from-rose-950 to-slate-900 border border-rose-500/50 rounded-3xl shadow-xl text-white flex flex-wrap items-center justify-between gap-3 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">
                {t('thresholdAlertTitle')}
              </span>
              <span className="text-xs text-slate-200">
                {current.alerts?.join(' • ') || t('thresholdAlertSub')}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-rose-600 text-white px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
            {t('alertDispatched')}
          </span>
        </div>
      )}

      {/* Dark Oscilloscope Time-Series Telemetry Monitor */}
      <div className="bg-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Header of Monitor */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t('rhythmMonitorTitle')}</span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950 px-2.5 py-0.5 rounded-full border border-orange-800">
                  {t('live')}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">{t('rhythmMonitorSub')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> {t('heartRate')} ({t('bpm')})
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> {t('bloodPressure')} ({t('bpUnit')})
            </span>
          </div>
        </div>

        {/* Oscilloscope Grid & SVG Path */}
        <div className="relative w-full overflow-hidden bg-slate-900/60 rounded-2xl p-2 border border-slate-800/80">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 stroke-2 fill-none">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="4 4" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeDasharray="3 3" />

            {/* Threshold line: 100 BPM */}
            <line
              x1={padding}
              y1={height - padding - ((100 - 50) / 90) * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - ((100 - 50) / 90) * (height - 2 * padding)}
              stroke="#ef4444"
              strokeDasharray="2 4"
              strokeWidth="1.5"
            />

            {/* Heart Rate Waveform */}
            <path
              d={renderHeartRatePath()}
              className="stroke-rose-500 transition-all duration-300"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Systolic BP Path */}
            <path
              d={renderSystolicPath()}
              className="stroke-orange-400 transition-all duration-300"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Subdued ECG pulse line at bottom */}
          <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-mono">
            {lang === 'am' ? 'የቀጥታ ስርጭት፦ 2,000ms' : 'Live stream interval: 2,000ms'}
          </div>
        </div>
      </div>
    </div>
  );
}
