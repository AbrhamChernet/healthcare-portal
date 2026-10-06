import React, { useState, useEffect } from 'react';
import {
  Play, Square, Activity, AlertTriangle, Cpu,
  Zap, BatteryCharging, Bluetooth, RefreshCw, Radio
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';

export default function DeviceSimulator({ patientId, customThresholds }) {
  const { vitalsSocket } = useSocket();
  const { t, lang } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('NORMAL');
  const [packetCount, setPacketCount] = useState(0);

  useEffect(() => {
    if (!isRunning || !vitalsSocket || !patientId) return;

    const interval = setInterval(() => {
      let heartRate = 72 + Math.floor(Math.random() * 8 - 4);
      let systolic = 120 + Math.floor(Math.random() * 6 - 3);
      let diastolic = 80 + Math.floor(Math.random() * 4 - 2);
      let spo2 = 98 + Math.floor(Math.random() * 2);
      let temperature = 36.8 + Math.round((Math.random() * 0.3 - 0.15) * 10) / 10;

      // Apply chosen simulation mode
      if (mode === 'TACHYCARDIA') {
        heartRate = 126 + Math.floor(Math.random() * 10);
      } else if (mode === 'HYPOXIA') {
        spo2 = 88 + Math.floor(Math.random() * 3);
      } else if (mode === 'HYPERTENSIVE') {
        systolic = 184 + Math.floor(Math.random() * 8);
        diastolic = 122 + Math.floor(Math.random() * 6);
      }

      const reading = {
        timestamp: new Date(),
        heartRate,
        bloodPressure: { systolic, diastolic },
        spo2,
        temperature,
        glucose: 102,
        respiratoryRate: 16,
        source: 'WEARABLE_IOT'
      };

      vitalsSocket.emit('stream-vital-reading', {
        patientId,
        reading,
        customThresholds
      });

      setPacketCount(c => c + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, mode, vitalsSocket, patientId, customThresholds]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden">
      {/* Top Device Status Bar */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              {t('simDeviceTitle')}
            </h4>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Bluetooth className="w-3 h-3 text-orange-400" /> {t('simDeviceSub')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <BatteryCharging className="w-3.5 h-3.5 text-orange-400" /> 96%
          </span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
              isRunning
                ? 'bg-orange-950 text-orange-400 border border-orange-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-orange-400 animate-ping' : 'bg-slate-500'}`} />
            {isRunning ? t('simBroadcasting') : t('simIdle')}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
        {t('simDesc')}
      </p>

      {/* Preset Mode Selection Grid */}
      <div className="space-y-1.5 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          {t('simScenariosTitle')}
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setMode('NORMAL')}
            className={`p-2 rounded-xl text-left font-semibold border transition-all ${
              mode === 'NORMAL'
                ? 'bg-orange-600/30 text-orange-300 border-orange-500 shadow-xs'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <span className="block text-[11px]">{t('simNormalResting')}</span>
            <span className="text-[9px] text-slate-400 font-normal">72 BPM • 120/80 • 98%</span>
          </button>

          <button
            onClick={() => setMode('TACHYCARDIA')}
            className={`p-2 rounded-xl text-left font-semibold border transition-all ${
              mode === 'TACHYCARDIA'
                ? 'bg-rose-600/30 text-rose-300 border-rose-500 shadow-xs'
                : 'bg-slate-800/60 text-rose-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <span className="block text-[11px] text-rose-400">{t('simTachycardia')}</span>
            <span className="text-[9px] text-slate-400 font-normal">128+ BPM ({t('critical')})</span>
          </button>

          <button
            onClick={() => setMode('HYPOXIA')}
            className={`p-2 rounded-xl text-left font-semibold border transition-all ${
              mode === 'HYPOXIA'
                ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-xs'
                : 'bg-slate-800/60 text-amber-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <span className="block text-[11px] text-amber-400">{t('simHypoxemia')}</span>
            <span className="text-[9px] text-slate-400 font-normal">&lt; 90% SpO2 ({t('attention')})</span>
          </button>

          <button
            onClick={() => setMode('HYPERTENSIVE')}
            className={`p-2 rounded-xl text-left font-semibold border transition-all ${
              mode === 'HYPERTENSIVE'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-xs'
                : 'bg-slate-800/60 text-purple-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <span className="block text-[11px] text-purple-400">{t('simHypertension')}</span>
            <span className="text-[9px] text-slate-400 font-normal">184/122 mmHg ({t('critical')})</span>
          </button>
        </div>
      </div>

      {/* Broadcast Toggle Button */}
      <button
        onClick={() => setIsRunning(!isRunning)}
        className={`w-full py-3 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
          isRunning
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
            : 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25'
        }`}
      >
        {isRunning ? (
          <>
            <Square className="w-3.5 h-3.5 fill-current" /> {t('simStopBroadcast')} ({t('packetsSent')}: {packetCount})
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" /> {t('simStartBroadcast')}
          </>
        )}
      </button>
    </div>
  );
}
