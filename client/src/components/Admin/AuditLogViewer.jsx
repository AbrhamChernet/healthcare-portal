import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AuditLogViewer() {
  const { authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await authFetch('/api/ehr/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await authFetch('/api/ehr/audit/verify');
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
      }
    } catch (err) {
      alert((lang === 'am' ? 'የማረጋገጥ ስህተት፦ ' : 'Verification error: ') + err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{t('auditTitle')}</h4>
          <p className="text-xs text-slate-400">{t('auditSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            title={lang === 'am' ? 'አድስ' : 'Refresh'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/25"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? t('calculatingHashes') : t('verifyAuditBtn')}
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in ${
            verificationResult.verified
              ? 'bg-orange-50 border-orange-200 text-orange-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {verificationResult.verified ? (
              <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {verificationResult.verified ? t('verificationSuccessTitle') : (lang === 'am' ? 'የመዝገብ ለውጥ ተገኝቷል' : 'Integrity Issue Detected')}
              </span>
              <span className="text-[11px] text-slate-600">
                {verificationResult.verified ? t('verificationSuccessSub') : verificationResult.status}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            {t('verifiedAt')} {new Date(verificationResult.checkedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-white border-b border-slate-100 text-slate-400 font-sans text-[10px] uppercase tracking-wider">
            <tr>
              <th className="pb-2.5">{t('blockNumber')}</th>
              <th className="pb-2.5">{t('timestamp')}</th>
              <th className="pb-2.5">{t('userColumn')}</th>
              <th className="pb-2.5">{t('actionColumn')}</th>
              <th className="pb-2.5">{lang === 'am' ? 'የሰነድ መለያ' : 'Resource ID'}</th>
              <th className="pb-2.5">{lang === 'am' ? 'የደህንነት ኮድ' : 'Cryptographic Hash'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/50">
                <td className="py-2.5 font-mono font-bold text-slate-700">#{log.index}</td>
                <td className="py-2.5 text-slate-500 text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2.5">
                  <span className="font-semibold text-slate-800">{log.userName}</span>
                  <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
                </td>
                <td className="py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.isBreakGlass
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 text-slate-600 font-mono text-[11px] truncate max-w-[120px]">
                  {log.resourceId}
                </td>
                <td className="py-2.5 font-mono text-[10px] text-slate-400 truncate max-w-[160px]" title={log.hash}>
                  {log.hash.slice(0, 16)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
