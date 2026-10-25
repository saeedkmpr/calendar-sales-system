import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const AuditLogsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        const data = await api.get<any[]>('/audit-logs');
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900">{t.nav.auditLogs}</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'en'
            ? 'Complete immutable audit trail of all data changes and system actions'
            : 'ഡാറ്റയിൽ വരുത്തിയ എല്ലാ മാറ്റങ്ങളുടെയും സുരക്ഷിത ഓഡിറ്റ് റെക്കോർഡുകൾ'}
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Timestamp' : 'സമയം'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'User' : 'ഉപയോക്താവ്'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Action' : 'നടപടി (Action)'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Category' : 'വിഭാഗം'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Details' : 'വിശദാംശങ്ങൾ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {language === 'en' ? 'Loading audit records...' : 'ലോഡ് ചെയ്യുന്നു...'}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {language === 'en' ? 'No audit records found.' : 'ലോഗുകൾ ലഭ്യമല്ല.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(language === 'en' ? 'en-IN' : 'ml-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.userName || (language === 'en' ? 'System' : 'സിസ്റ്റം')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-2xs font-bold uppercase bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-slate-500 max-w-xs truncate">
                      {log.newValues || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
