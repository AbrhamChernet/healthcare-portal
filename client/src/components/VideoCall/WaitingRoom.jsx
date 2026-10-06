import React from 'react';
import { Clock, UserCheck, ShieldCheck, Video, HeartPulse, Sparkles, Radio } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WaitingRoom({
  isDoctor,
  patientName,
  doctorName,
  onAdmitPatient,
  isPatientWaiting
}) {
  const { t, lang } = useLanguage();

  if (isDoctor) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-10 glass-card-dark rounded-3xl border border-slate-800 text-white max-w-xl mx-auto my-12 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/10">
          <Clock className="w-8 h-8 animate-spin duration-3000" />
        </div>

        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800 uppercase tracking-widest mb-2">
          {t('lobbyTitleDoctor')}
        </span>

        <h2 className="text-2xl font-black mb-2 text-white">
          {t('examQueueTitle')}
        </h2>
        <p className="text-slate-400 text-xs mb-8 max-w-sm">
          {t('lobbyDescDoctor')}
        </p>

        {isPatientWaiting ? (
          <div className="w-full bg-gradient-to-r from-orange-950/70 to-slate-900 border border-orange-500/50 p-6 rounded-3xl text-left mb-6 shadow-xl animate-in zoom-in-95">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                  {t('patientArrived')}
                </span>
                <h4 className="text-base font-bold text-white">{patientName || t('scheduledPatient')}</h4>
                <p className="text-xs text-slate-400">
                  {t('patientReadySub')}
                </p>
              </div>

              <button
                onClick={onAdmitPatient}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> {t('admitBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 w-full mb-6 text-slate-400 text-xs">
            <p className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              {t('waitingPatientMsg')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80 w-full">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-400" /> {t('encryptedVideoLine')}
          </span>
          <span className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-400" /> {t('vitalsReadyNotice')}
          </span>
        </div>
      </div>
    );
  }

  // Patient Waiting Screen
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg mx-auto my-12 text-center relative overflow-hidden">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/10">
          <Clock className="w-10 h-10 animate-pulse text-orange-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
        </div>
      </div>

      <span className="px-3.5 py-1 bg-orange-50 text-orange-700 text-[10px] font-black rounded-full mb-3 uppercase tracking-widest border border-orange-200">
        {t('lobbyTitlePatient')}
      </span>

      <h2 className="text-2xl font-black text-slate-900 mb-2">
        {t('virtualWaitingRoomTitle')}
      </h2>
      <p className="text-slate-500 text-xs mb-8 max-w-sm leading-relaxed">
        {t('lobbyDescPatient')}
      </p>

      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{t('privateConfidentialNotice')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Video className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{t('cameraMicReadyNotice')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{t('vitalsConnectedNotice')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        {t('connectionLineReady')}
      </div>
    </div>
  );
}
