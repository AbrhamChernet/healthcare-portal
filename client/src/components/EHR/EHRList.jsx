import React, { useState } from 'react';
import { Calendar, User, FileText, Download, ShieldCheck, Pill, Activity, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function EHRList({ records = [], patientId }) {
  const { authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleDownloadFHIR = async () => {
    if (!patientId && records.length > 0) {
      patientId = records[0].patientId;
    }
    if (!patientId) return;

    setExporting(true);
    try {
      const res = await authFetch(`/api/ehr/export/fhir/${patientId}`);
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Medical_Record_Summary_${patientId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert((lang === 'am' ? 'የማውረድ ስህተት፦ ' : 'Error downloading summary: ') + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-xs text-slate-400">
        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-bold text-slate-700">
          {t('noRecordsYetTitle')}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {t('noRecordsYetSub')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-500">
          {records.length} {t('certifiedRecordsCount')}
        </span>
        <button
          onClick={handleDownloadFHIR}
          disabled={exporting}
          className="text-xs font-bold text-orange-800 hover:text-orange-900 bg-orange-50 border border-orange-200/80 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? t('loading') : t('exportFhirBtn')}
        </button>
      </div>

      {records.map((rec) => (
        <div
          key={rec._id}
          className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                Rx
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{rec.doctorName || t('doctor')}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-normal">
                    {t('patient')}: {rec.patientName}
                  </span>
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(rec.visitDate || rec.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-orange-500 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('doctorVerifiedBadge')}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnoses */}
            <div className="flex flex-wrap gap-1.5">
              {rec.diagnoses?.map((diag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold rounded-xl"
                >
                  {diag.description}
                </span>
              ))}
            </div>
          </div>

          {/* Assessment Notes */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              {t('doctorAssessmentTitle')}
            </span>
            {rec.clinicalNotes || t('routineAssessmentComplete')}
          </div>

          {/* Prescriptions */}
          {rec.prescriptions && rec.prescriptions.length > 0 && (
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-2">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-purple-600" /> {t('prescriptionsTitle')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rec.prescriptions.map((rx, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-purple-100 text-xs text-slate-800 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900">{rx.medicationName} {rx.dosage}</strong>
                      <span className="text-[10px] text-slate-400">{rx.instructions || rx.frequency}</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">
                      {rx.durationDays} {t('durationDaysLabel')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
