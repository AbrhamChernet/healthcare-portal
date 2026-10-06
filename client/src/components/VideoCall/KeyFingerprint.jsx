import React, { useState } from 'react';
import { ShieldCheck, Lock, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function KeyFingerprint({ fingerprint }) {
  const { t, lang } = useLanguage();
  const [isVerified, setIsVerified] = useState(false);

  if (!fingerprint) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-white backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl ${isVerified ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-orange-400'}`}>
          {isVerified ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">{t('securityCode')}:</span>
            <span className="font-mono text-sm font-bold tracking-widest text-orange-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {fingerprint}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {t('securityCodeSub')}
          </span>
        </div>
      </div>

      <button
        onClick={() => setIsVerified(!isVerified)}
        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
          isVerified
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}
      >
        {isVerified ? (
          <>
            <Check className="w-3.5 h-3.5" /> {t('codeVerified')}
          </>
        ) : (
          t('verifyCodeBtn')
        )}
      </button>
    </div>
  );
}
