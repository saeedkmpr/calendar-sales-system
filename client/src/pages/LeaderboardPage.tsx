import React, { useState, useEffect } from 'react';
import {
  Trophy,
  FileDown,
  Printer,
  FileText,
  Search,
  Medal,
  TrendingUp,
  Package,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { downloadPdfFromHtml, printFromHtml } from '../services/pdfExporter';

export const LeaderboardPage: React.FC = () => {
  const { currentCampaign } = useCampaign();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<any[]>([]);
  const [totals, setTotals] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    if (!currentCampaign) return;
    try {
      setIsLoading(true);
      const res = await api.get<any>(`/campaigns/${currentCampaign.id}/leaderboard`);
      setRows(res.rows || []);
      setTotals(res.totals || null);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentCampaign?.id]);

  const handleExcelExport = async () => {
    if (!currentCampaign) return;
    try {
      await api.downloadFile(
        `/reports/campaigns/${currentCampaign.id}/leaderboard/excel`,
        `${currentCampaign.name}_Leaderboard.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  const handlePdfDownload = () => {
    if (!currentCampaign) return;
    // Native browser print dialog triggers Chrome's vector Skia PDF generator ("Save as PDF")
    // Completely eliminates blank-page bugs, preserved fonts, and unreadable canvases!
    window.print();
  };

  const handlePrint = () => {
    if (!currentCampaign) return;
    api.openPrintWindow(`/reports/campaigns/${currentCampaign.id}/leaderboard/print`);
  };

  const filteredRows = rows.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentCode.toLowerCase().includes(q)
    );
  });

  const currency = currentCampaign?.currency || '₹';

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">
          {language === 'en' ? 'No campaign selected.' : 'ക്യാമ്പയിൻ തിരഞ്ഞെടുത്തിട്ടില്ല.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Official Print Header: only rendered in print / Save-as-PDF view */}
      <div className="hidden print:block text-center mb-4 border-b-2 border-emerald-800 pb-2">
        <h1 className="text-xl font-black text-emerald-900">{currentCampaign.name}</h1>
        {currentCampaign.institutionName && (
          <p className="text-sm font-semibold text-slate-700">{currentCampaign.institutionName}</p>
        )}
        <p className="text-xs text-slate-600 mt-1">
          <strong>കുട്ടികളുടെ ആകെ കണക്കും റാങ്കിംഗും (Student Cumulative Leaderboard)</strong> | കലണ്ടർ വില: ₹{currentCampaign.calendarPrice}
        </p>
      </div>

      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'en'
                ? 'Student Cumulative Leaderboard'
                : 'കുട്ടികളുടെ ആകെ കണക്കും റാങ്കിംഗും'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en'
              ? `Rank-based cumulative sales, expenses, and net cash across all ${currentCampaign.durationDays || 7} days`
              : `മുഴുവൻ ${currentCampaign.durationDays || 7} ദിവസങ്ങളിലെയും ആകെ കൊണ്ടുപോയ കലണ്ടർ, വിറ്റത്, ലഭിച്ച കാശ്, ചെലവ്, ബാക്കി കാശ് എന്നിവ അടിസ്ഥാനമാക്കിയുള്ള റാങ്കിംഗ്`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePdfDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            title={language === 'en' ? 'Open Chrome Print dialog to Save as PDF' : 'Print വിൻഡോ വഴി Save as PDF നൽകി സേവ് ചെയ്യുക'}
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>
              {language === 'en' ? 'Save as PDF' : '📄 Save as PDF'}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            title={language === 'en' ? 'Open printable page in new window' : 'പുതിയ വിൻഡോയിൽ പ്രിന്റ് ചെയ്യുക'}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{language === 'en' ? 'Print View' : '🖨️ പ്രിന്റ് വിൻഡോ'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'en' ? 'Total Calendars Sold' : 'ആകെ വിറ്റ കലണ്ടർ'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {totals.totalSold}
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {language === 'en' ? `Target: ${totals.totalTarget}` : `ടാർഗറ്റ്: ${totals.totalTarget}`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'en' ? 'Remaining Stock' : 'ബാക്കി സ്റ്റോക്ക്'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {totals.totalRemainingStock}
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {language === 'en' ? `Taken: ${totals.totalTaken}` : `കൊണ്ടുപോയത്: ${totals.totalTaken}`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'en' ? 'Cash Received' : 'ആകെ ലഭിച്ച കാശ്'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              {currency}{totals.totalCashReceived}
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {language === 'en' ? 'Gross cash' : 'ലഭിച്ച തുക'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'en' ? 'Total Expenses' : 'ആകെ ചെലവ്'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
              {currency}{totals.totalExpenses}
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {language === 'en' ? 'Campaign expenses' : 'അനുബന്ധ ചെലവ്'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-2xs font-bold text-emerald-800 uppercase tracking-wider block">
              {language === 'en' ? 'Total Net Cash' : 'ആകെ ബാക്കി കാശ്'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              {currency}{totals.totalNetCash}
            </div>
            <span className="text-2xs text-emerald-800/80 font-medium mt-0.5 block">
              {language === 'en' ? `Avg: ₹${totals.weightedAverage}` : `ശരാശരി: ₹${totals.weightedAverage}`}
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search student name or roll no...' : 'കുട്ടിയുടെ പേര് നൽകി തിരയുക...'}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {language === 'en' ? 'Total Ranked Students:' : 'റാങ്ക് ചെയ്ത കുട്ടികൾ:'} <strong>{rows.length}</strong>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white select-none whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-3 font-semibold text-center w-14">
                  {language === 'en' ? 'Rank' : 'റാങ്ക്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center w-16">
                  {language === 'en' ? 'Code' : 'റോൾ നമ്പർ'}
                </th>
                <th className="py-3.5 px-4 font-semibold min-w-[180px]">
                  {language === 'en' ? 'Student Name' : 'കുട്ടിയുടെ പേര്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center">
                  {language === 'en' ? 'Target' : 'ടാർഗറ്റ്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center">
                  {language === 'en' ? 'Remaining Target' : 'ടാർഗറ്റിൽ ബാക്കി'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center bg-slate-800">
                  {language === 'en' ? 'Taken' : 'കൊണ്ടുപോയത്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center bg-slate-800">
                  {language === 'en' ? 'Sold' : 'വിറ്റത്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-center bg-slate-800">
                  {language === 'en' ? 'Stock' : 'ബാക്കി സ്റ്റോക്ക്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-right">
                  {language === 'en' ? 'Received' : 'ലഭിച്ച കാശ്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-right">
                  {language === 'en' ? 'Expenses' : 'ചെലവ്'}
                </th>
                <th className="py-3.5 px-4 font-bold text-right bg-emerald-900/90 text-emerald-200">
                  {language === 'en' ? 'Total Net Cash' : 'ആകെ ബാക്കി കാശ്'}
                </th>
                <th className="py-3.5 px-3 font-semibold text-right">
                  {language === 'en' ? 'Average' : 'ശരാശരി'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    {language === 'en' ? 'Loading leaderboard...' : 'കണക്കുകൾ ലോഡ് ചെയ്യുന്നു...'}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    {language === 'en' ? 'No records found.' : 'വിവരങ്ങൾ കണ്ടെത്തിയില്ല.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isTop1 = r.rank === 1;
                  const isTop2 = r.rank === 2;
                  const isTop3 = r.rank === 3;

                  return (
                    <tr
                      key={r.studentId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTop1
                          ? 'bg-amber-50/40 font-semibold'
                          : isTop2
                          ? 'bg-slate-50/50'
                          : isTop3
                          ? 'bg-orange-50/20'
                          : ''
                      }`}
                    >
                      {/* Rank with Medal */}
                      <td className="py-3 px-3 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black shadow-xs">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-bold shadow-xs">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/80 text-white font-bold shadow-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono font-medium">
                            #{r.rank}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-500 text-xs">
                        {r.studentCode}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.studentName}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {r.target}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-500">
                        {r.targetRemaining}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-800 bg-slate-50/60">
                        {r.totalTaken}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-50/40">
                        {r.totalSold}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/30">
                        {r.remainingStock}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {currency}{r.totalCashReceived}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {currency}{r.totalExpenses}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-800 bg-emerald-50/50">
                        {currency}{r.totalNetCash}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-600">
                        {currency}{r.average}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Totals Row */}
            {totals && (
              <tfoot className="bg-slate-800 text-white font-bold border-t-2 border-emerald-500 select-none whitespace-nowrap">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 text-left font-black tracking-wider uppercase text-emerald-300">
                    {language === 'en' ? 'Grand Total (SUM)' : 'ആകെ തുക (Grand Total)'}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold">
                    {totals.totalTarget}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-300">
                    {totals.totalTargetRemaining}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold bg-slate-700">
                    {totals.totalTaken}
                  </td>
                  <td className="py-3.5 px-3 text-center font-black bg-emerald-700 text-white">
                    {totals.totalSold}
                  </td>
                  <td className="py-3.5 px-3 text-center font-black bg-amber-700 text-white">
                    {totals.totalRemainingStock}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold">
                    {currency}{totals.totalCashReceived}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-rose-300">
                    {currency}{totals.totalExpenses}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-300 bg-emerald-950/80 text-base">
                    {currency}{totals.totalNetCash}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-slate-200">
                    {currency}{totals.weightedAverage}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
