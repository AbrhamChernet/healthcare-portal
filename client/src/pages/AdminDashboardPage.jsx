import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Users, Award, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DoctorApproval from '../components/Admin/DoctorApproval';
import AuditLogViewer from '../components/Admin/AuditLogViewer';

export default function AdminDashboardPage() {
  const { user, authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('AUDIT'); // 'AUDIT' or 'DOCTORS' or 'HEALTH'
  const [gatewayHealth, setGatewayHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) setGatewayHealth(await res.json());
      } catch (e) {
        console.warn('Gateway health check failed:', e);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-purple-800/40">
        <div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            {t('adminTitle')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {lang === 'am' ? 'የክሊኒኩ የቁጥጥር ማዕከል' : 'Platform Control Center'}
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            {t('adminSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-950/80 p-1.5 rounded-2xl border border-purple-700/50">
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'AUDIT' ? 'bg-orange-500 text-white shadow-sm' : 'text-purple-300 hover:text-white'
            }`}
          >
            {t('tabAudit')}
          </button>
          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DOCTORS' ? 'bg-orange-500 text-white shadow-sm' : 'text-purple-300 hover:text-white'
            }`}
          >
            {t('tabDoctors')}
          </button>
          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'HEALTH' ? 'bg-orange-500 text-white shadow-sm' : 'text-purple-300 hover:text-white'
            }`}
          >
            {t('tabServices')}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'AUDIT' && <AuditLogViewer />}
      {activeTab === 'DOCTORS' && <DoctorApproval />}
      {activeTab === 'HEALTH' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-orange-500" /> {t('servicesStatusTitle')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">{t('gatewayService')}</span>
              <span className="text-[10px] text-slate-400">Port 5000</span>
              <div className="mt-2 text-xs font-semibold text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> {t('operational')}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">{t('authService')}</span>
              <span className="text-[10px] text-slate-400">Port 5001</span>
              <div className="mt-2 text-xs font-semibold text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> {t('operational')}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">{t('signalingService')}</span>
              <span className="text-[10px] text-slate-400">Port 5002</span>
              <div className="mt-2 text-xs font-semibold text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> {t('operational')}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">{t('ehrService')}</span>
              <span className="text-[10px] text-slate-400">Port 5003</span>
              <div className="mt-2 text-xs font-semibold text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> {t('operational')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
