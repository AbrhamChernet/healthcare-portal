import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Video, HeartPulse, FileText, Plus,
  ShieldCheck, AlertTriangle, Clock, User, Sparkles,
  Stethoscope, Droplets, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import EHRList from '../components/EHR/EHRList';
import VitalCharts from '../components/Vitals/VitalCharts';
import DeviceSimulator from '../components/Vitals/DeviceSimulator';

export default function PatientDashboard() {
  const { user, authFetch } = useAuth();
  const { vitalsSocket } = useSocket();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [ehrs, setEhrs] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Load patient data
  const loadData = async () => {
    try {
      const apptRes = await authFetch('/api/consultations/my-appointments');
      if (apptRes.ok) setAppointments(await apptRes.json());

      const docRes = await authFetch('/api/users/doctors');
      if (docRes.ok) {
        const docList = await docRes.json();
        setDoctors(docList);
        if (docList.length > 0) setSelectedDoctorId(docList[0].doctorId);
      }

      if (user?.id) {
        const ehrRes = await authFetch(`/api/ehr/patient/${user.id}`);
        if (ehrRes.ok) setEhrs(await ehrRes.json());

        const vitRes = await authFetch(`/api/vitals/patient/${user.id}`);
        if (vitRes.ok) {
          const vList = await vitRes.json();
          setVitalsHistory(vList);
          if (vList.length > 0) setLatestVital(vList[vList.length - 1]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!vitalsSocket || !user?.id) return;
    vitalsSocket.emit('subscribe-patient-vitals', { patientId: user.id });

    const handleVital = (data) => {
      setLatestVital(data);
      setVitalsHistory(prev => [...prev.slice(-30), data]);
    };

    vitalsSocket.on('live-vital-update', handleVital);
    return () => {
      vitalsSocket.emit('unsubscribe-patient-vitals', { patientId: user.id });
      vitalsSocket.off('live-vital-update', handleVital);
    };
  }, [vitalsSocket, user]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const doc = doctors.find(d => d.doctorId === selectedDoctorId);
    try {
      const res = await authFetch('/api/consultations/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          doctorName: doc ? doc.name : 'Physician',
          patientId: user.id,
          patientName: user.name,
          scheduledAt: new Date(),
          reasonForVisit: reasonForVisit || (lang === 'am' ? 'መደበኛ የጤና ምርመራ' : 'Routine Health Consultation')
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAppointments([data.appointment, ...appointments]);
        setBookingOpen(false);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Health Banner - High Concentrated Vibrant Orange */}
      <div className="bg-gradient-to-r from-orange-950 via-amber-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-6 border border-orange-500/40">
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-orange-950/80 text-orange-300 border border-orange-700/80 flex items-center gap-1.5 w-fit">
            <Activity className="w-3.5 h-3.5 text-orange-400" /> {t('patSub')}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {lang === 'am' ? `እንኳን ደህና መጡ፣ ${user?.name}` : `Welcome, ${user?.name}`}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-orange-100/90">
            <span>{t('bloodGroup')}: <strong className="text-white">{user?.profile?.bloodGroup || 'A+'}</strong></span>
            <span>•</span>
            <span className="text-orange-300 font-semibold">{t('bpMonitored')}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              {t('confidentialCareActive')}
            </span>
          </div>
        </div>

        <button
          onClick={() => setBookingOpen(true)}
          className="px-6 py-3 bg-white hover:bg-orange-50 text-orange-950 font-black rounded-2xl text-xs flex items-center gap-2 transition-all shadow-xl shadow-black/10 z-10 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform text-orange-600" />
          {t('bookConsultBtn')}
        </button>

        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scheduled Appointments & Health Tracker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800">{t('myConsultations')}</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {appointments.length}
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                {t('noBooked')}
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
                        <h4 className="font-bold text-xs text-slate-900">{appt.doctorName}</h4>
                        <span className="text-[10px] text-slate-400">{lang === 'am' ? 'የልብ ስፔሻሊስት' : 'Cardiologist'}</span>
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
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/25"
                    >
                      <Video className="w-3.5 h-3.5" /> {t('joinRoomBtn')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DeviceSimulator patientId={user?.id} />
        </div>

        {/* Right Column: Vitals Oscilloscope & EHR History (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <VitalCharts vitalsHistory={vitalsHistory} latestReading={latestVital} />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t('myEhrTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'am' ? 'የተመዘገቡ የህመም ውጤቶች፣ የታዘዙ መድሃኒቶች እና የሐኪም ማስታወሻዎች' : 'Your diagnoses, doctor recommendations, and active prescriptions'}
              </p>
            </div>

            <EHRList records={ehrs} patientId={user?.id} />
          </div>
        </div>
      </div>

      {/* Book Consultation Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{t('bookConsultBtn')}</h3>
            <p className="text-xs text-slate-500 mb-5">{lang === 'am' ? 'የሚፈልጉትን የህክምና ባለሙያ ይምረጡ' : 'Select a medical specialist for virtual care'}</p>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('selectDoctor')}</label>
                <div className="space-y-2">
                  {doctors.map((doc) => (
                    <label
                      key={doc.doctorId}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedDoctorId === doc.doctorId
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="doctor"
                          value={doc.doctorId}
                          checked={selectedDoctorId === doc.doctorId}
                          onChange={() => setSelectedDoctorId(doc.doctorId)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-900">{doc.name}</span>
                          <span className="block text-[11px] text-slate-500">{doc.specialization}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-orange-600">${doc.consultationFee}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('visitReason')}</label>
                <input
                  type="text"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder={lang === 'am' ? 'ለምሳሌ፦ የደም ግፊት ምርመራ፣ የመድሃኒት ማዘዣ...' : 'e.g. Blood pressure review, medication refill, regular follow-up'}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25"
                >
                  {t('confirmBooking')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
