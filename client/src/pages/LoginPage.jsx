import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock, Mail, ShieldCheck, AlertCircle, ArrowRight,
  KeyRound, Sparkles, UserCheck, Stethoscope, Shield, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, mfaToken);
      if (res?.mfaRequired) {
        setMfaRequired(true);
      } else {
        const role = res.user?.role;
        if (role === 'DOCTOR') navigate('/doctor');
        else if (role === 'ADMIN') navigate('/admin');
        else navigate('/patient');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 bg-grid-pattern">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 glass-card rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
        {/* Left Information Branding Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-800 text-[11px] font-bold text-orange-400">
              <ShieldCheck className="w-3.5 h-3.5" /> {lang === 'am' ? 'የታካሚ ሚስጥራዊነት የተረጋገጠ' : 'Certified Private & Confidential'}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {lang === 'am' ? 'ወደ ጤና ሀብ የህክምና አገልግሎት ይግቡ' : 'Virtual Healthcare for You & Your Family'}
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {lang === 'am'
                  ? 'ከሐኪምዎ ጋር በቪዲዮ ለመገናኘት፣ የጤና ምርመራ ውጤቶችዎን እና የታዘዙ መድሃኒቶችን ለመመልከት ይግቡ።'
                  : 'Connect with your physician via private video visit, review medical reports, and manage prescriptions safely.'}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{lang === 'am' ? 'ሙሉ በሙሉ ሚስጥራዊ የቪዲዮ ግንኙነት' : 'Private & Secure Video Consultations'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{lang === 'am' ? 'የተጠበቀ የግል የህክምና ታሪክ' : 'Strictly Confidential Medical Records'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{lang === 'am' ? 'ከተመሰከረላቸው ሐኪሞች ጋር ብቻ የሚደረግ' : 'Licensed & Board Certified Specialists'}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 z-10">
            {lang === 'am' ? 'የታካሚ መብት እና ሚስጥራዊነት የተጠበቀ ነው።' : 'Patient Privacy & Healthcare Safeguards Active'}
          </div>

          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Right Sign-in Form Column */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white/90">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">{t('loginTitle')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('loginSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('emailLabel')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-2xl bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-2xl bg-slate-50/60 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  required
                />
              </div>
            </div>

            {mfaRequired && (
              <div className="animate-in fade-in space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {lang === 'am' ? 'የደህንነት ማረጋገጫ ቁጥር (2FA)' : 'Two-Factor Security Code'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full text-xs pl-10 pr-3 py-3 border border-orange-300 rounded-2xl bg-orange-50/30 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group"
            >
              {loading ? t('loading') : t('signIn')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
              {t('demoLoginsTitle')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('dr.chen@telehealth.com', 'Doctor123!')}
                className="p-2.5 text-center bg-slate-50 hover:bg-orange-50/60 border border-slate-200/80 hover:border-orange-300 rounded-2xl transition-all group"
              >
                <Stethoscope className="w-4 h-4 mx-auto text-orange-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">{t('demoDrChen')}</span>
                <span className="block text-[9px] text-orange-600 font-semibold">{t('demoDrChenSub')}</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('john.doe@patient.com', 'Patient123!')}
                className="p-2.5 text-center bg-slate-50 hover:bg-orange-50/60 border border-slate-200/80 hover:border-orange-300 rounded-2xl transition-all group"
              >
                <UserCheck className="w-4 h-4 mx-auto text-orange-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">{t('demoPatient')}</span>
                <span className="block text-[9px] text-orange-600 font-semibold">{t('demoPatientSub')}</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@telehealth.com', 'AdminPass123!')}
                className="p-2.5 text-center bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 rounded-2xl transition-all group"
              >
                <Shield className="w-4 h-4 mx-auto text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">{t('demoAdmin')}</span>
                <span className="block text-[9px] text-purple-600 font-semibold">{t('demoAdminSub')}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-orange-600 font-bold hover:underline">
              {t('signUpHere')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
