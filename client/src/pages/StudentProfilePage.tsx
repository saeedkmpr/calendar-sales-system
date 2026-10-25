import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const StudentProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentCampaign } = useCampaign();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!currentCampaign || !studentId) return;
      try {
        setIsLoading(true);
        const res = await api.get<any>(
          `/campaigns/${currentCampaign.id}/students/${studentId}/history`
        );
        setData(res);
      } catch (error) {
        console.error('Failed to load student history:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [currentCampaign?.id, studentId]);

  if (isLoading || !data) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        {language === 'en' ? 'Loading student performance records...' : 'വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു...'}
      </div>
    );
  }

  const { student, totals, days, campaign } = data;
  const currency = campaign.currency || '₹';

  return (
    <div className="space-y-6">
      {/* Back button & Profile Header */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'en' ? 'Back to Student List' : 'കുട്ടികളുടെ പട്ടികയിലേക്ക് മടങ്ങുക'}</span>
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl shadow-inner">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {student.name}
              </h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {student.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'en' ? 'Campaign:' : 'ക്യാമ്പയിൻ:'} <strong>{campaign.name}</strong>
            </p>
          </div>
        </div>

        {/* Target Progress Metric */}
        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">
              {language === 'en' ? 'Target Progress' : 'ടാർഗറ്റ് പുരോഗതി'}
            </div>
            <div className="text-xl font-black text-emerald-700">
              {totals.targetAchievedPercentage}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">
              {language === 'en' ? 'Cumulative Net Cash' : 'ആകെ ബാക്കി കാശ്'}
            </div>
            <div className="text-xl font-black text-slate-900">
              {currency}{totals.cumulativeNetCash}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">{t.day1Cols.target}</div>
          <div className="text-2xl font-bold text-slate-800">{totals.target}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">{t.daysCols.cumulativeSold}</div>
          <div className="text-2xl font-bold text-blue-900">{totals.cumulativeSold}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">{t.daysCols.targetRemaining}</div>
          <div className="text-2xl font-bold text-amber-700">{totals.targetRemaining}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-emerald-800 font-semibold mb-1">
            {language === 'en' ? 'Total Net Cash' : 'ആകെ അറ്റാദായം (Net)'}
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {currency}{totals.cumulativeNetCash}
          </div>
        </div>
      </div>

      {/* 7-Day Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">
            {language === 'en' ? `${currentCampaign?.durationDays || 7}-Day Performance History` : `${currentCampaign?.durationDays || 7} ദിവസത്തെ വിൽപ്പന ചരിത്രം`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white select-none">
              <tr>
                <th className="py-3 px-3 text-center">{t.summaryCols.day}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.taken}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.sold}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.remainingCalendars}</th>
                <th className="py-3 px-3 text-center">{t.daysCols.cumulativeSold}</th>
                <th className="py-3 px-3 text-center">{t.daysCols.targetRemaining}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.cashReceived}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.expenses}</th>
                <th className="py-3 px-3 text-center bg-emerald-900 text-emerald-200 font-bold">{t.day1Cols.netCash}</th>
                <th className="py-3 px-3 text-center">{t.day1Cols.average}</th>
                <th className="py-3 px-3 text-center bg-emerald-950 text-emerald-300 font-bold">{t.daysCols.cumulativeNetCash}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {days.map((d: any) => (
                <tr key={d.dayNumber} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50">
                    {language === 'en' ? `Day ${d.dayNumber}` : `ദിവസം ${d.dayNumber}`}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">{d.calendarsTaken}</td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-900">{d.calendarsSold}</td>
                  <td className="py-3 px-3 text-center font-medium text-emerald-700">{d.remainingStock}</td>
                  <td className="py-3 px-3 text-center font-bold text-blue-900 bg-blue-50/30">{d.cumulativeSold}</td>
                  <td className="py-3 px-3 text-center font-medium text-amber-700 bg-amber-50/30">{d.targetRemaining}</td>
                  <td className="py-3 px-3 text-center font-medium">{currency}{d.cashReceived}</td>
                  <td className="py-3 px-3 text-center font-medium text-rose-700">
                    {d.expenses > 0 ? `${currency}${d.expenses}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-100/50">
                    {currency}{d.netCash}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">{currency}{d.average}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-950 bg-emerald-200/60">
                    {currency}{d.cumulativeNetCash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
