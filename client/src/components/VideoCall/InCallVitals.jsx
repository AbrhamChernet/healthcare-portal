import React from 'react';
import { HeartPulse, Activity, Droplets, Thermometer, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function InCallVitals({ latestVital }) {
  const { t, lang } = useLanguage();

  if (!latestVital) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl backdrop-blur-md text-white">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <HeartPulse className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>{lang === 'am' ? 'የታካሚውን የቀጥታ ጤና መረጃ በማገናኘት ላይ...' : 'Connecting to Patient Vitals Stream...'}</span>
        </div>
      </div>
    );
  }

  const { heartRate, bloodPressure, spo2, temperature, isAbnormal, alerts } = latestVital;

  return (
    <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md text-white shadow-2xl space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-orange-400" /> {t('patientTelemetry')}
        </span>
        {isAbnormal ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
            <AlertTriangle className="w-3 h-3" /> {t('attention')}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded-full border border-orange-800">
            {t('stable')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Heart Rate */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
            <HeartPulse className="w-3 h-3 text-rose-400" /> {t('heartRate')}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-bold ${heartRate > 100 ? 'text-amber-400' : 'text-white'}`}>
              {heartRate}
            </span>
            <span className="text-[10px] text-slate-400">{t('bpm')}</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
            <Droplets className="w-3 h-3 text-amber-400" /> {t('oxygen')}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-bold ${spo2 < 95 ? 'text-amber-400' : 'text-white'}`}>
              {spo2}
            </span>
            <span className="text-[10px] text-slate-400">%</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <div className="text-[10px] text-slate-400 mb-0.5">{t('bloodPressure')}</div>
          <div className="text-sm font-bold text-white">
            {bloodPressure ? `${bloodPressure.systolic}/${bloodPressure.diastolic}` : '--/--'}
            <span className="text-[9px] font-normal text-slate-400 ml-1">{t('bpUnit')}</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
            <Thermometer className="w-3 h-3 text-orange-400" /> {t('temp')}
          </div>
          <div className="text-sm font-bold text-white">
            {temperature}{t('tempUnit')}
          </div>
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="text-[10px] text-amber-300 bg-amber-950/50 p-1.5 rounded-lg border border-amber-900/60">
          {alerts[0]}
        </div>
      )}
    </div>
  );
}
