import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Video, FilePlus, HeartPulse, ShieldAlert,
  Users, Activity, CheckCircle2, Clock, Plus,
  Stethoscope, Sparkles, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import EHRList from '../components/EHR/EHRList';
import NewEHRModal from '../components/EHR/NewEHRModal';
import VitalCharts from '../components/Vitals/VitalCharts';
import DeviceSimulator from '../components/Vitals/DeviceSimulator';

export default function DoctorDashboard() {
  const { user, authFetch } = useAuth();
  const { vitalsSocket } = useSocket();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('650000000000000000000001');
  const [patientEHRs, setPatientEHRs] = useState([]);
  const [patientVitals, setPatientVitals] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [isEHRModalOpen, setIsEHRModalOpen] = useState(false);
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(clock);
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await authFetch('/api/consultations/my-appointments');
      if (res.ok) setAppointments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatientEHRs = async (patId) => {
    try {
      const res = await authFetch(`/api/ehr/patient/${patId}`);
      if (res.ok) setPatientEHRs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatientVitals = async (patId) => {
    try {
      const res = await authFetch(`/api/vitals/patient/${patId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientVitals(data);
        if (data.length > 0) setLatestVital(data[data.length - 1]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPatientEHRs(selectedPatientId);
    loadPatientVitals(selectedPatientId);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!vitalsSocket) return;
    vitalsSocket.emit('subscribe-patient-vitals', { patientId: selectedPatientId });

    const handleVitalUpdate = (data) => {
      setLatestVital(data);
      setPatientVitals(prev => [...prev.slice(-30), data]);
    };

    vitalsSocket.on('live-vital-update', handleVitalUpdate);
    return () => {
      vitalsSocket.emit('unsubscribe-patient-vitals', { patientId: selectedPatientId });
      vitalsSocket.off('live-vital-update', handleVitalUpdate);
    };
  }, [vitalsSocket, selectedPatientId]);

  const handleBreakGlass = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/ehr/break-glass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatientId, reason: breakGlassReason })
      });
      if (res.ok) {
        const data = await res.json();
        alert(lang === 'am' ? 'የአስቸኳይ ጊዜ መዝገብ ተከፍቷል። እርምጃው በይፋ ተመዝግቧል።' : 'Emergency record access granted. Action officially logged.');
        setPatientEHRs(data.records);
        setBreakGlassOpen(false);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Physician Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> {t('docWelcome')}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {t('docClock')}: <strong className="text-slate-200">{currentTime}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {lang === 'am' ? `እንኳን ደህና መጡ፣ ${user?.name}` : `Welcome back, ${user?.name}`}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>{t('licenseNumber')}: <strong className="text-white">{user?.profile?.licenseNumber || 'MD-883921'}</strong></span>
            <span>•</span>
            <span className="text-orange-300 font-semibold">{user?.profile?.specialization || 'Cardiology & Internal Medicine'}</span>
            <span>•</span>
            <span className="text-orange-400 font-semibold">{t('verified')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => setBreakGlassOpen(true)}
            className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" /> {t('breakGlassBtn')}
          </button>

          <button
            onClick={() => setIsEHRModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4" /> {t('newRecordBtn')}
          </button>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scheduled Appointments & Health Tracker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800">{t('scheduledVisits')}</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {appointments.length}
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                {t('noVisits')}
              </div>
            ) : (
              <div className="space-y-3.5">
                {appointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{appt.patientName}</h4>
                        <span className="text-[10px] text-slate-400">{t('patient')} ID: {appt.patientId?.slice(-6)}</span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          appt.status === 'WAITING_ROOM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {appt.status === 'WAITING_ROOM' ? t('patientInWaitingRoom') : appt.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-snug">
                      <strong>{t('visitReason')}:</strong> {appt.reasonForVisit}
                    </p>

                    <button
                      onClick={() => navigate(`/room/${appt.roomId}`)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/25"
                    >
                      <Video className="w-3.5 h-3.5" /> {t('startVisit')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DeviceSimulator patientId={selectedPatientId} />
        </div>

        {/* Right Column: Vitals Oscilloscope & EHR Records (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <VitalCharts vitalsHistory={patientVitals} latestReading={latestVital} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('ehrSectionTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'am' ? 'የታካሚው የህክምና ታሪክ እና የታዘዙ መድሃኒቶች' : 'Patient diagnoses, doctor notes, and current prescriptions'}
                </p>
              </div>

              <button
                onClick={() => setIsEHRModalOpen(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/80 transition-colors"
              >
                {t('addRecord')}
              </button>
            </div>

            <EHRList records={patientEHRs} patientId={selectedPatientId} />
          </div>
        </div>
      </div>

      {/* Break Glass Modal */}
      {breakGlassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-xl font-bold text-slate-900">{t('breakGlassBtn')}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {lang === 'am'
                ? 'የአስቸኳይ ጊዜ ህክምና ለመስጠት የታካሚውን መዝገብ ይክፈቱ። ይህ እርምጃ በይፋ የሚመዘገብ መሆኑን ይገንዘቡ።'
                : 'Emergency clinical access enables immediate review outside scheduled visits. This access is recorded in the permanent audit ledger.'}
            </p>
            <form onSubmit={handleBreakGlass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'am' ? 'የአስቸኳይ ጊዜ ምክንያት' : 'Emergency Justification Reason'}
                </label>
                <textarea
                  rows={3}
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  placeholder={lang === 'am' ? 'ለምሳሌ፦ ድንገተኛ የልብ ህመም ምልክት ስላሳየ አስቸኳይ የመድሃኒት ታሪክ ፍተሻ...' : 'e.g. Acute clinical emergency requiring historical allergy review...'}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 transition-all"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBreakGlassOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"
                >
                  {lang === 'am' ? 'መዝገቡን ክፈት' : 'Confirm Emergency Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New EHR Modal */}
      <NewEHRModal
        isOpen={isEHRModalOpen}
        onClose={() => setIsEHRModalOpen(false)}
        defaultPatient={{ patientId: selectedPatientId, name: 'John Doe' }}
        onRecordCreated={(newRec) => setPatientEHRs(prev => [newRec, ...prev])}
      />
    </div>
  );
}
