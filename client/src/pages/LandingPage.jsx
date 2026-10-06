import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video, HeartPulse, ShieldCheck, Activity, Lock,
  ArrowRight, CheckCircle2, Sparkles, Stethoscope,
  Clock, Shield, UserCheck, PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('VIDEO');
  const [demoBpm, setDemoBpm] = useState(74);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoBpm(prev => Math.floor(72 + Math.sin(Date.now() / 2000) * 5 + (Math.random() * 4 - 2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16 pb-24 overflow-hidden bg-slate-50 bg-grid-pattern">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Vibrant Orange Ambient Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-orange-400/20 via-amber-400/20 to-orange-500/20 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Reassuring Healthcare Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-orange-200/80 shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              {t('heroBadge')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            {t('heroTitle')}
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* User Call-to-Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            {user ? (
              <Link
                to={user.role === 'DOCTOR' ? '/doctor' : user.role === 'ADMIN' ? '/admin' : '/patient'}
                className="px-7 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-orange-500/25 flex items-center gap-2 group"
              >
                {t('heroEnterDashboard')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-7 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-orange-500/25 flex items-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4" /> {t('heroActionPatient')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-7 py-4 bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 font-bold rounded-2xl text-sm transition-all shadow-xs backdrop-blur-sm hover:border-orange-300"
                >
                  {t('signIn')}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Interactive Patient-Doctor Consultation Preview */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'am' ? 'የቀጥታ የሕክምና ምክክር እና የጤና መከታተያ' : 'Live Consultation & Health Monitor'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'am' ? 'የተጠበቀ እና ሚስጥራዊ የቪዲዮ ግንኙነት' : 'Private and confidential doctor visit'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('verified')}
                </span>
              </div>
            </div>

            {/* Interactive Showcase Screen */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Doctor Video Mockup */}
              <div className="md:col-span-2 bg-slate-950 rounded-2xl p-4 text-white relative overflow-hidden flex flex-col justify-between aspect-video border border-slate-800 shadow-inner">
                {/* Doctor Name Overlay */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-[11px] font-semibold text-orange-300 flex items-center gap-1.5 border border-orange-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {lang === 'am' ? 'ዶ/ር ሳራ ቼን (የልብ ስፔሻሊስት)' : 'Dr. Sarah Chen, MD (Cardiologist)'}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-[10px] text-slate-300 border border-slate-700">
                    {lang === 'am' ? 'ሚስጥራዊ ምክክር' : 'Private Consultation'}
                  </span>
                </div>

                {/* Friendly Avatar & Status */}
                <div className="my-auto text-center space-y-2 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
                    <Video className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    {lang === 'am' ? 'ከሐኪምዎ ጋር በቀጥታ ተገናኝተዋል' : 'Connected directly with your doctor'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'am' ? 'ጥራት ያለው ቪዲዮ እና ድምፅ' : 'High quality audio and video'}
                  </p>
                </div>

                {/* Patient PiP Box */}
                <div className="flex items-end justify-between z-10">
                  <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 text-xs">
                    <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span>{t('heartRate')}: <strong className="text-rose-400 font-mono">{demoBpm} {t('bpm')}</strong></span>
                  </div>

                  <div className="w-24 aspect-video rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center text-[10px] text-slate-300">
                    {lang === 'am' ? 'እርስዎ (ታካሚ)' : 'You (Patient)'}
                  </div>
                </div>
              </div>

              {/* Patient Live Vitals Feed */}
              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold flex items-center gap-1.5 text-slate-700">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> {t('heartRate')}
                    </span>
                    <span className="text-[10px] text-orange-600 font-bold">{t('vitalNormal')}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {demoBpm} <span className="text-xs font-normal text-slate-400">{t('bpm')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (demoBpm / 140) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-slate-700">{t('bloodPressure')}</span>
                    <span className="text-[10px] text-orange-600 font-bold">{t('vitalNormal')}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    122/80 <span className="text-xs font-normal text-slate-400">{t('bpUnit')}</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-slate-700">{t('oxygen')}</span>
                    <span className="text-[10px] text-orange-600 font-bold">{t('vitalNormal')}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    99%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Benefits for Patients and Clinicians */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            {lang === 'am' ? 'የቴሌሄልዝ አገልግሎቶች' : 'Telemedicine Care Services'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'am' ? 'ለእርስዎ እና ለቤተሰብዎ የተዘጋጀ የተሟላ እንክብካቤ' : 'Comprehensive Care for You and Your Family'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-7 border border-white/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('pillar1Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar1Desc')}</p>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar1Point1')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar1Point2')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar1Point3')}
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-7 border border-white/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('pillar2Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar2Desc')}</p>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar2Point1')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar2Point2')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar2Point3')}
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-7 border border-white/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('pillar3Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar3Desc')}</p>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar3Point1')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar3Point2')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> {t('pillar3Point3')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-black text-orange-400">{t('trust1Title')}</div>
              <div className="text-xs text-slate-300">{t('trust1Sub')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-amber-400">{t('trust2Title')}</div>
              <div className="text-xs text-slate-300">{t('trust2Sub')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-rose-400">{t('trust3Title')}</div>
              <div className="text-xs text-slate-300">{t('trust3Sub')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-purple-400">{t('trust4Title')}</div>
              <div className="text-xs text-slate-300">{t('trust4Sub')}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
