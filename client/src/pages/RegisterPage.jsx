import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentAgreed) {
      setError(lang === 'am' ? 'እባክዎ ከመቀጠልዎ በፊት የታካሚ ሚስጥራዊነት ደንቦችን ይቀበሉ።' : 'Please acknowledge the Patient Privacy Notice to continue.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'DOCTOR' && {
          doctorDetails: {
            specialization,
            licenseNumber: licenseNumber || 'LIC-' + Math.floor(100000 + Math.random() * 900000),
            licenseStateOrCountry: 'Medical Board',
            consultationFee: 100
          }
        }),
        ...(role === 'PATIENT' && {
          patientDetails: {
            bloodGroup,
            gender: 'Male',
            allergies: []
          }
        })
      };

      await register(payload);
      if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 bg-grid-pattern">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl border border-slate-100 my-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('registerTitle')}</h2>
          <p className="text-xs text-slate-400 mt-1">{t('registerSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            className={`py-2.5 rounded-xl transition-all ${
              role === 'PATIENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            {t('patientOption')}
          </button>
          <button
            type="button"
            onClick={() => setRole('DOCTOR')}
            className={`py-2.5 rounded-xl transition-all ${
              role === 'DOCTOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            {t('doctorOption')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'DOCTOR' ? 'Dr. Sarah Chen' : 'John Doe'}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              required
            />
          </div>

          {role === 'DOCTOR' ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('specialization')}</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Cardiology"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('licenseNumber')}</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="MD-123456"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('bloodGroup')}</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Consent Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="consent"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="consent" className="cursor-pointer text-[11px] leading-tight">
              {t('consentText')}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-orange-500/25"
          >
            {loading ? t('loading') : t('createAccountBtn')}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          {t('haveAccount')}{' '}
          <Link to="/login" className="text-orange-600 font-bold hover:underline">
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
