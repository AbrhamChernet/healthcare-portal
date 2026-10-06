import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity, ShieldCheck, User, LogOut, Video,
  FileText, LayoutDashboard, Languages, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'DOCTOR') return '/doctor';
    if (user.role === 'ADMIN') return '/admin';
    return '/patient';
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TH';

  const getRoleDisplayName = (role) => {
    if (role === 'DOCTOR') return t('doctor');
    if (role === 'ADMIN') return t('admin');
    return t('patient');
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-xs border-b border-slate-200/80 py-2.5'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform duration-300">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-900">
                {lang === 'am' ? 'ጤና ሀብ' : 'TeleHealth'}<span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{lang === 'am' ? ' (TenaHub)' : 'Hub'}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 uppercase tracking-widest hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" /> {t('live')}
              </span>
            </div>
            <span className="block text-[10px] font-semibold text-slate-400 tracking-wider">
              {t('brandTagline')}
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (when authenticated) */}
        {user && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
            <Link
              to={getDashboardPath()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === getDashboardPath()
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> {t('dashboard')}
            </Link>

            {user.role === 'DOCTOR' && (
              <span className="px-3 py-1.5 text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-orange-500" /> {t('docWelcome')}
              </span>
            )}

            {user.role === 'PATIENT' && (
              <span className="px-3 py-1.5 text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-orange-600" /> {t('patSub')}
              </span>
            )}
          </div>
        )}

        {/* Right Controls: Language Switcher + User Profile */}
        <div className="flex items-center gap-3">
          {/* Bilingual Language Switcher Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all hover:border-orange-400"
            title="Switch Language / ቋንቋ ቀይር"
          >
            <Globe className="w-3.5 h-3.5 text-orange-500" />
            <span>{lang === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span
                  className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    user.role === 'DOCTOR'
                      ? 'text-cyan-700 bg-cyan-50'
                      : user.role === 'ADMIN'
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-orange-700 bg-orange-50'
                  }`}
                >
                  {getRoleDisplayName(user.role)}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                title={t('signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-orange-600 px-3 py-2 transition-colors"
              >
                {t('signIn')}
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/25"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
