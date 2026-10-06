import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldCheck, Plus, Trash2, FileText, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function NewEHRModal({ isOpen, onClose, defaultPatient, onRecordCreated }) {
  const { authFetch } = useAuth();
  const { t, lang } = useLanguage();

  const [patientId, setPatientId] = useState(defaultPatient?.patientId || defaultPatient?._id || '');
  const [patientName, setPatientName] = useState(defaultPatient?.patientName || defaultPatient?.name || 'John Doe');
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [icd10Options, setIcd10Options] = useState([]);

  // Form fields
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([
    { code: 'I10', description: 'Essential (primary) hypertension', type: 'PRIMARY' }
  ]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicationName: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', durationDays: 30, instructions: 'Take in morning' }
  ]);
  const [vitalsSnapshot, setVitalsSnapshot] = useState({
    heartRate: 72,
    bloodPressure: '124/80',
    spo2: 98,
    temperature: 36.7
  });

  const [allergyWarnings, setAllergyWarnings] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const icdRes = await authFetch('/api/ehr/icd10');
        if (icdRes.ok) {
          const list = await icdRes.json();
          setIcd10Options(list);
        }

        if (patientId) {
          const patRes = await authFetch(`/api/users/patients/${patientId}`);
          if (patRes.ok) {
            const patData = await patRes.json();
            setPatientAllergies(patData.allergies || []);
          }
        }
      } catch (err) {
        console.error('Error fetching clinical reference data:', err);
      }
    };

    loadData();
  }, [isOpen, patientId]);

  // Drug-Allergy Conflict Detection
  useEffect(() => {
    const conflicts = [];
    const allergies = patientAllergies.map(a => a.substance.toLowerCase());

    prescriptions.forEach((rx) => {
      const medLower = rx.medicationName.toLowerCase();
      allergies.forEach((allergy) => {
        if (
          (allergy.includes('penicillin') && (medLower.includes('amox') || medLower.includes('penicillin') || medLower.includes('augmentin'))) ||
          (allergy.includes('sulfa') && (medLower.includes('bactrim') || medLower.includes('sulfa'))) ||
          (allergy.includes('aspirin') && (medLower.includes('aspirin') || medLower.includes('ibuprofen')))
        ) {
          conflicts.push(
            lang === 'am'
              ? `የአለርጂ ማስጠንቀቂያ፦ '${rx.medicationName}' ታካሚው ካለበት '${allergy}' አለርጂ ጋር ይጋጫል!`
              : `CRITICAL ALLERGY CONFLICT: '${rx.medicationName}' conflicts with patient allergy to '${allergy}'!`
          );
        }
      });
    });

    setAllergyWarnings(conflicts);
  }, [prescriptions, patientAllergies, lang]);

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicationName: '', dosage: '', frequency: 'Once Daily', durationDays: 7, instructions: '' }]);
  };

  const removePrescription = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handlePrescriptionChange = (idx, field, value) => {
    const updated = [...prescriptions];
    updated[idx][field] = value;
    setPrescriptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/ehr/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          diagnoses: selectedDiagnoses,
          clinicalNotes,
          prescriptions,
          vitalsSnapshot,
          patientAllergies
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save record');
      }

      const data = await res.json();
      if (onRecordCreated) onRecordCreated(data.ehr);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
              {t('officialClinicalNote')}
            </span>
            <h3 className="text-xl font-bold text-slate-900">{t('ehrModalTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Allergy Alert Banner */}
        {allergyWarnings.length > 0 && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
            {allergyWarnings.map((warn, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('patientNameLabel')}
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('primaryDiagnosis')}
              </label>
              <select
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                onChange={(e) => {
                  const opt = icd10Options.find(o => o.code === e.target.value);
                  if (opt) setSelectedDiagnoses([{ code: opt.code, description: opt.description, type: 'PRIMARY' }]);
                }}
              >
                {icd10Options.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Assessment Notes */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">{t('clinicalNotesLabel')}</label>
              <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                <ShieldCheck className="w-3 h-3 text-orange-600" /> {lang === 'am' ? 'ሙሉ ሚስጥራዊ' : 'Strictly Confidential'}
              </span>
            </div>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              required
            />
          </div>

          {/* Prescriptions Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">{t('prescriptionsTitle')}</label>
              <button
                type="button"
                onClick={addPrescription}
                className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:text-orange-700"
              >
                <Plus className="w-3.5 h-3.5" /> {t('addMedication')}
              </button>
            </div>
            <div className="space-y-2">
              {prescriptions.map((rx, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    placeholder={t('medName')}
                    value={rx.medicationName}
                    onChange={(e) => handlePrescriptionChange(idx, 'medicationName', e.target.value)}
                    className="flex-2 text-xs p-2 border border-slate-200 rounded-xl bg-white w-1/3"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('dosage')}
                    value={rx.dosage}
                    onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                    className="text-xs p-2 border border-slate-200 rounded-xl bg-white w-1/4"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('frequency')}
                    value={rx.frequency}
                    onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                    className="text-xs p-2 border border-slate-200 rounded-xl bg-white w-1/4"
                  />
                  {prescriptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrescription(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-md shadow-orange-500/25 transition-all"
            >
              {saving ? t('loading') : t('saveEhrBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
