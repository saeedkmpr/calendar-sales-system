import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Printer,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
} from 'lucide-react';
import { downloadPdfFromHtml, printFromHtml } from '../services/pdfExporter';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const SummaryPage: React.FC = () => {
  const { currentCampaign } = useCampaign();
  const { token } = useAuth();
  const { t, language } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    async function loadSummary() {
      if (!currentCampaign) return;
      try {
        setIsLoading(true);
        const res = await api.get<any>(`/campaigns/${currentCampaign.id}/summary`);
        setData(res);
      } catch (error) {
        console.error('Failed to load summary:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, [currentCampaign?.id]);

  const handleExcelExport = async () => {
    if (!currentCampaign) return;
    try {
      await api.downloadFile(
        `/reports/campaigns/${currentCampaign.id}/summary/excel`,
        `Summary_Report.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  const handlePdfDownload = () => {
    if (!currentCampaign) return;
    // Native browser print dialog triggers Chrome's vector Skia PDF generator ("Save as PDF")
    window.print();
  };

  const handlePrint = () => {
    if (!currentCampaign) return;
    api.openPrintWindow(`/reports/campaigns/${currentCampaign.id}/summary/print`);
  };

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">
          {language === 'en' ? 'No campaign selected.' : 'ക്യാമ്പയിൻ തിരഞ്ഞെടുത്തിട്ടില്ല.'}
        </p>
      </div>
    );
  }

  const totals = data?.totals || {
    totalSold: 0,
    currentStockRemaining: 0,
    totalCashReceived: 0,
    totalExpenses: 0,
    totalNetCash: 0,
  };

  const currency = currentCampaign.currency || '₹';

  return (
    <div className="space-y-6">
      {/* Official Print Header: only rendered in print / Save-as-PDF view */}
      <div className="hidden print:block text-center mb-4 border-b-2 border-emerald-800 pb-2">
        <h1 className="text-xl font-black text-emerald-900">{currentCampaign?.name}</h1>
        {currentCampaign?.institutionName && (
          <p className="text-sm font-semibold text-slate-700">{currentCampaign.institutionName}</p>
        )}
        <p className="text-xs text-slate-600 mt-1">
          <strong>{currentCampaign?.durationDays || 7} ദിവസത്തെ ആകെ വിൽപ്പന സംഗ്രഹം (Overall Campaign Summary)</strong>
        </p>
      </div>

      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.nav.summary} ({language === 'en' ? `${currentCampaign?.durationDays || 7}-Day Campaign Overview` : `${currentCampaign?.durationDays || 7} ദിവസത്തെ ആകെ സംഗ്രഹം`})
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en'
              ? `Unified summary of sales, expenses, and net cash across all ${currentCampaign?.durationDays || 7} days`
              : `${currentCampaign?.durationDays || 7} ദിവസങ്ങളിലെയും വിൽപ്പന, ചെലവ്, ബാക്കി കാശ് എന്നിവയുടെ ഏകീകൃത സംഗ്രഹം`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePdfDownload}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            title={language === 'en' ? 'Open Chrome Print dialog to Save as PDF' : 'Print വിൻഡോ വഴി Save as PDF നൽകി സേവ് ചെയ്യുക'}
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>
              {language === 'en' ? 'Save as PDF' : '📄 Save as PDF'}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            title={language === 'en' ? 'Open standalone printable page' : 'പുതിയ വിൻഡോയിൽ പ്രിന്റ് ചെയ്യുക'}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{language === 'en' ? 'Print View' : '🖨️ പ്രിന്റ് വിൻഡോ'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.summaryCols.totalSold}</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">
            {totals.totalSold}
          </div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? `Total across ${currentCampaign?.durationDays || 7} days` : `${currentCampaign?.durationDays || 7} ദിവസങ്ങളിലായി വിറ്റത്`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.dashboard.stockRemaining}</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">
            {totals.currentStockRemaining}
          </div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'Current remaining stock' : 'നിലവിൽ ബാക്കിയുള്ള സ്റ്റോക്ക്'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.summaryCols.cashReceived}</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            {currency}{totals.totalCashReceived}
          </div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'Gross cash collected' : 'മൊത്തം പിരിഞ്ഞ തുക'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.summaryCols.expenses}</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-800">
            {currency}{totals.totalExpenses}
          </div>
          <div className="text-2xs text-slate-400 mt-1">
            {language === 'en' ? 'Total campaign expenses' : 'മൊത്തം ചെലവായ തുക'}
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-300 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold">{t.dashboard.totalNetCash}</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {currency}{totals.totalNetCash}
          </div>
          <div className="text-2xs text-emerald-700 mt-1 font-medium">
            {language === 'en' ? 'Cash Received - Expenses' : 'ലഭിച്ച കാശ് - ചെലവ്'}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">
            {language === 'en'
              ? 'Day-by-Day Summary Breakdown'
              : 'ദിവസേനയുള്ള സംഗ്രഹ പട്ടിക (Day-by-Day Summary Breakdown)'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white select-none">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-24">{t.summaryCols.day}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.summaryCols.totalSold}</th>
                <th className="py-3 px-4 font-semibold text-center text-amber-300">{t.summaryCols.totalRemaining}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.summaryCols.cashReceived} ({currency})</th>
                <th className="py-3 px-4 font-semibold text-center">{t.summaryCols.expenses} ({currency})</th>
                <th className="py-3 px-4 font-bold text-center bg-emerald-900 text-emerald-200">{t.summaryCols.dailyNetCash} ({currency})</th>
                <th className="py-3 px-4 font-bold text-center bg-emerald-950 text-emerald-300">{t.summaryCols.cumulativeNetCash} ({currency})</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {language === 'en' ? 'Loading summary...' : 'വിവരങ്ങൾ ലഭ്യമാക്കുന്നു...'}
                  </td>
                </tr>
              ) : (
                data?.dailySummaries?.map((row: any) => (
                  <tr key={row.dayNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 bg-slate-50/50">
                      {language === 'en' ? `Day ${row.dayNumber}` : row.dayLabel}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {row.calendarsSold}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-amber-800 bg-amber-50/30">
                      {row.remainingCalendars}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {currency}{row.cashReceived}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-rose-700">
                      {row.expenses > 0 ? `${currency}${row.expenses}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-800 bg-emerald-100/40">
                      {currency}{row.dailyNetCash}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-950 bg-emerald-200/50">
                      {currency}{row.cumulativeNetCash}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Row */}
            <tfoot className="bg-slate-100 text-slate-900 border-t-2 border-slate-300 font-bold">
              <tr className="divide-x divide-slate-200">
                <td className="py-3.5 px-4 text-center font-bold bg-slate-200">
                  {t.common.total}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-900">
                  {totals.totalSold}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-amber-900 bg-amber-100/50">
                  {totals.currentStockRemaining}
                </td>
                <td className="py-3.5 px-4 text-center font-bold">
                  {currency}{totals.totalCashReceived}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-rose-900">
                  {currency}{totals.totalExpenses}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-900 bg-emerald-200/60">
                  {currency}{totals.totalNetCash}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-950 bg-emerald-300/80">
                  {currency}{totals.totalNetCash}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
