import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShieldCheck, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function DoctorApproval() {
  const { authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const res = await authFetch('/api/users/admin/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleUpdateStatus = async (doctorProfileId, status) => {
    try {
      const res = await authFetch(`/api/users/admin/doctors/${doctorProfileId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Reviewed by Admin on ${new Date().toLocaleDateString()}` })
      });
      if (res.ok) {
        fetchDoctors();
      }
    } catch (err) {
      alert((lang === 'am' ? 'ሁኔታውን የመቀየር ስህተት፦ ' : 'Error updating status: ') + err.message);
    }
  };

  if (loading) return <div className="p-4 text-xs text-slate-400">{t('loading')}</div>;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{t('credentialingTitle')}</h4>
          <p className="text-xs text-slate-400">{t('credentialingSubtitle')}</p>
        </div>
        <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          {doctors.length} {t('doctorsCatalogedCount')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3">{t('doctorColumn')}</th>
              <th className="pb-3">{t('specialtyColumn')}</th>
              <th className="pb-3">{t('licenseColumn')}</th>
              <th className="pb-3">{t('jurisdictionColumn')}</th>
              <th className="pb-3">{t('status')}</th>
              <th className="pb-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((doc) => (
              <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 font-semibold text-slate-800">
                  {doc.userId?.name || t('doctor')}
                  <span className="block text-[10px] text-slate-400 font-normal">{doc.userId?.email}</span>
                </td>
                <td className="py-3 text-slate-600">{doc.specialization}</td>
                <td className="py-3 font-mono font-medium text-slate-700">{doc.licenseNumber}</td>
                <td className="py-3 text-slate-500">{doc.licenseStateOrCountry}</td>
                <td className="py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      doc.verificationStatus === 'VERIFIED'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : doc.verificationStatus === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {doc.verificationStatus === 'VERIFIED'
                      ? t('verified')
                      : doc.verificationStatus === 'REJECTED'
                      ? t('rejected')
                      : t('pending')}
                  </span>
                </td>
                <td className="py-3 text-right space-x-1.5">
                  {doc.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleUpdateStatus(doc._id, 'VERIFIED')}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                    >
                      {t('approve')}
                    </button>
                  )}
                  {doc.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(doc._id, 'REJECTED')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      {t('reject')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
