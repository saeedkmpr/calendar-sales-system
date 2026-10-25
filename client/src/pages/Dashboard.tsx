import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useCampaign } from '../context/CampaignContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const { currentCampaign } = useCampaign();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!currentCampaign) return;
      try {
        setIsLoading(true);
        const res = await api.get<any>(`/campaigns/${currentCampaign.id}/dashboard`);
        setData(res);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [currentCampaign?.id]);

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">
          {language === 'en' ? 'No campaign selected.' : 'ക്യാമ്പയിൻ തിരഞ്ഞെടുത്തിട്ടില്ല.'}
        </p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalStudents: 0,
    totalTarget: 0,
    totalTaken: 0,
    totalSold: 0,
    totalRemainingStock: 0,
    totalCashReceived: 0,
    totalExpenses: 0,
    totalNetCash: 0,
    progressPercentage: 0,
    completedTargetCount: 0,
    remainingTargetCount: 0,
    highestDailyNetCash: 0,
  };

  const currency = currentCampaign.currency || '₹';

  return (
    <div className="space-y-6">
      {/* Campaign Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-500/30">
            {language === 'en' ? 'Active Campaign' : 'സജീവ ക്യാമ്പയിൻ'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">{currentCampaign.name}</h2>
          <p className="text-sm text-emerald-200 mt-1">
            {currentCampaign.institutionName || (language === 'en' ? `${currentCampaign.durationDays || 7}-Day Calendar Sales Tracking` : `${currentCampaign.durationDays || 7} ദിവസത്തെ കലണ്ടർ വിൽപന ട്രാക്കിംഗ്`)}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20">
          <Calendar className="w-8 h-8 text-emerald-300" />
          <div>
            <div className="text-xs text-emerald-200">
              {language === 'en' ? 'Calendar Price' : 'കലണ്ടർ വില'}
            </div>
            <div className="text-xl font-black">{currency}{currentCampaign.calendarPrice}</div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.dashboard.totalStudents}</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{metrics.totalStudents}</div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'Registered participants' : 'രജിസ്റ്റർ ചെയ്തവർ'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.dashboard.totalTarget}</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{metrics.totalTarget}</div>
          <div className="text-2xs text-blue-600 mt-1 font-medium">
            {language === 'en' ? 'Progress' : 'പുരോഗതി'}: {metrics.progressPercentage}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.dashboard.totalSold}</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{metrics.totalSold}</div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'Taken' : 'കൊണ്ടുപോയത്'}: {metrics.totalTaken}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.dashboard.stockRemaining}</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{metrics.totalRemainingStock}</div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'In students possession' : 'കുട്ടികളുടെ കൈവശം ബാക്കി'}
          </div>
        </div>
      </div>

      {/* Cash Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.totalCashReceived}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {currency}{metrics.totalCashReceived}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' ? 'Total gross cash collected' : 'വിദ്യാർത്ഥികളിൽ നിന്ന് ലഭിച്ച തുക'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.totalExpenses}</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">
            {currency}{metrics.totalExpenses}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' ? 'Travel allowance & campaign costs' : 'യാത്രാ ബത്ത & ചെലവുകൾ'}
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.totalNetCash}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">
            {currency}{metrics.totalNetCash}
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            {language === 'en' ? 'Cash Received - Expenses' : 'അറ്റാദായം (ലഭിച്ച തുക - ചെലവ്)'}
          </p>
        </div>
      </div>

      {/* Target Progress Bar & High Level Badges */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {language === 'en' ? 'Campaign Target Completion' : 'ലക്ഷ്യ പുരോഗതി (Campaign Target Completion)'}
            </h4>
            <p className="text-xs text-slate-500">
              {metrics.totalSold} / {metrics.totalTarget} {language === 'en' ? 'calendars sold' : 'കലണ്ടറുകൾ വിറ്റുതീർത്തു'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              {t.dashboard.completedTargetStudents}: <strong>{metrics.completedTargetCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              {t.dashboard.remainingTargetStudents}: <strong>{metrics.remainingTargetCount}</strong>
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">
            {language === 'en' ? 'Calendars Sold Per Day' : 'ദിവസേനയുള്ള കലണ്ടർ വിൽപ്പന (Calendars Sold Per Day)'}
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sold" name={language === 'en' ? 'Sold' : 'വിറ്റ കലണ്ടർ'} fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">
            {language === 'en' ? 'Daily Net Cash Trend' : 'ദിവസേനയുള്ള ബാക്കി കാശ് (Net Cash Trend)'}
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="netCash"
                  name={language === 'en' ? 'Net Cash (₹)' : 'ബാക്കി കാശ് (₹)'}
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Students by Sales & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'en' ? 'Top 5 Performers' : 'മുൻനിര വിദ്യാർത്ഥികൾ (Top 5 Performers)'}
              </h4>
            </div>
            <button
              onClick={() => navigate('/students')}
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              {language === 'en' ? 'View All' : 'എല്ലാവരെയും കാണുക'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.topStudentsByNetCash?.map((student: any, index: number) => (
              <div key={index} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-amber-50 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{student.name}</div>
                    <div className="text-2xs text-slate-400 font-mono">{student.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-700">
                    {currency}{student.netCash}
                  </div>
                  <div className="text-2xs text-slate-400">
                    {student.sold} {language === 'en' ? 'sold' : 'കലണ്ടറുകൾ വിറ്റു'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">
            {language === 'en' ? 'Quick Jump to Daily Sheets' : 'ദിവസേനയുള്ള ഷീറ്റുകളിലേക്ക് നേരിട്ട് പോകുക'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {Array.from({ length: currentCampaign.durationDays || 7 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => navigate(`/days/${d}`)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-left transition-all group"
              >
                <div className="text-xs text-slate-500 group-hover:text-emerald-700">
                  {language === 'en' ? 'Sheet' : 'ഷീറ്റ്'}
                </div>
                <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-800">
                  {language === 'en' ? `Day ${d}` : `ദിവസം ${d}`}
                </div>
              </button>
            ))}
            <button
              onClick={() => navigate('/summary')}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-left transition-all col-span-2 sm:col-span-1"
            >
              <div className="text-xs text-emerald-700">
                {language === 'en' ? 'Full Report' : 'പൂർണ്ണ റിപ്പോർട്ട്'}
              </div>
              <div className="text-sm font-bold text-emerald-900">{t.nav.summary}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
