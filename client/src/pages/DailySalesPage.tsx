import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  FileDown,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle,
  Columns,
  RotateCcw,
  Upload,
  FileText,
} from 'lucide-react';
import { downloadPdfFromHtml } from '../services/pdfExporter';
import { ReportModal } from '../components/ReportModal';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Day1Row,
  DailySalesRow,
  RankingRow,
  DayTotals
} from '../types';
import {
  calculateDay1Row,
  calculateDayRow,
  calculateDay1Totals,
  calculateDailyTotals,
  calculateDay1Ranking,
  calculateDailyRanking,
  StudentInputData,
  StudentHistoricalData
} from '../services/calculations';
import { DailySalesTable } from '../components/DailySalesTable';
import { DailyRankingTable } from '../components/DailyRankingTable';
import { ExpectedCashReconciliation } from '../components/ExpectedCashReconciliation';

export const DailySalesPage: React.FC = () => {
  const { dayNumber: dayParam } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const dayNumber = parseInt(dayParam || '1', 10);

  const { currentCampaign } = useCampaign();
  const { canEdit, isAdmin, token } = useAuth();
  const { t, language } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'split'>('stacked');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResettingSales, setIsResettingSales] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Working state
  const [rows, setRows] = useState<(Day1Row | DailySalesRow)[]>([]);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [totals, setTotals] = useState<DayTotals | null>(null);
  const [rankingTotals, setRankingTotals] = useState<any>(null);
  const [calendarPrice, setCalendarPrice] = useState<number>(100);
  const [currency, setCurrency] = useState<string>('₹');

  // Raw inputs map to preserve intermediate edits: { studentId: { calendarsTaken, calendarsSold, cashReceived, expenses } }
  const [inputMap, setInputMap] = useState<{ [studentId: string]: StudentInputData }>({});
  // History map for Days 2-7
  const [historyMap, setHistoryMap] = useState<{ [studentId: string]: StudentHistoricalData }>({});

  const fetchDayData = async () => {
    if (!currentCampaign) return;
    try {
      setIsLoading(true);
      setSaveError(null);

      const res = await api.get<any>(`/campaigns/${currentCampaign.id}/days/${dayNumber}`);

      setCalendarPrice(res.calendarPrice || 100);
      setCurrency(res.currency || '₹');
      setRows(res.entryRows);
      setTotals(res.entryTotals);
      setRankingRows(res.rankingRows);
      setRankingTotals(res.rankingTotals);

      // Build inputs map
      const inputs: { [studentId: string]: StudentInputData } = {};
      const histories: { [studentId: string]: StudentHistoricalData } = {};

      res.entryRows.forEach((r: any) => {
        inputs[r.studentId] = {
          studentId: r.studentId,
          studentCode: r.studentCode,
          studentName: r.studentName,
          target: r.target,
          calendarsTaken: r.calendarsTaken,
          calendarsSold: r.calendarsSold,
          cashReceived: r.cashReceived,
          expenses: r.expenses,
        };

        if (dayNumber > 1) {
          histories[r.studentId] = {
            previousCumulativeSold: (r.cumulativeSold || 0) - r.calendarsSold,
            previousCumulativeNetCash: (r.cumulativeNetCash || 0) - r.netCash,
          };
        }
      });

      setInputMap(inputs);
      setHistoryMap(histories);
      setIsDirty(false);
    } catch (error: any) {
      console.error('Fetch day error:', error);
      setSaveError(error.message || (language === 'en' ? 'Failed to fetch day data' : 'വിവരങ്ങൾ എടുക്കുന്നതിൽ പിഴവ് സംഭവിച്ചു'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData();
  }, [currentCampaign?.id, dayNumber]);

  // Recalculate on any cell change
  const handleCellChange = (
    studentId: string,
    field: 'calendarsTaken' | 'calendarsSold' | 'cashReceived' | 'expenses',
    value: number
  ) => {
    setIsDirty(true);
    setSaveSuccess(false);

    const updatedInputs = {
      ...inputMap,
      [studentId]: {
        ...inputMap[studentId],
        [field]: value,
      },
    };
    setInputMap(updatedInputs);

    if (dayNumber === 1) {
      const newRows: Day1Row[] = rows.map((r) => {
        const input = updatedInputs[r.studentId] || {
          studentId: r.studentId,
          studentCode: r.studentCode,
          studentName: r.studentName,
          target: r.target,
          calendarsTaken: 0,
          calendarsSold: 0,
          cashReceived: 0,
          expenses: 0,
        };
        return calculateDay1Row(input, calendarPrice);
      });

      const newTotals = calculateDay1Totals(newRows);
      const newRanking = calculateDay1Ranking(newRows);

      setRows(newRows);
      setTotals(newTotals);
      setRankingRows(newRanking.rankingRows);
      setRankingTotals(newRanking.totals);
    } else {
      const newRows: DailySalesRow[] = rows.map((r) => {
        const input = updatedInputs[r.studentId] || {
          studentId: r.studentId,
          studentCode: r.studentCode,
          studentName: r.studentName,
          target: r.target,
          calendarsTaken: 0,
          calendarsSold: 0,
          cashReceived: 0,
          expenses: 0,
        };
        const history = historyMap[r.studentId] || {
          previousCumulativeSold: 0,
          previousCumulativeNetCash: 0,
        };
        return calculateDayRow(input, history, calendarPrice);
      });

      const newTotals = calculateDailyTotals(newRows);
      const newRanking = calculateDailyRanking(newRows);

      setRows(newRows);
      setTotals(newTotals);
      setRankingRows(newRanking.rankingRows);
      setRankingTotals(newRanking.totals);
    }
  };

  const handleSave = async () => {
    if (!currentCampaign) return;
    try {
      setIsSaving(true);
      setSaveError(null);

      const entries = Object.values(inputMap).map((item) => ({
        studentId: item.studentId,
        calendarsTaken: item.calendarsTaken,
        calendarsSold: item.calendarsSold,
        cashReceived: item.cashReceived,
        expenses: item.expenses,
      }));

      await api.post(`/campaigns/${currentCampaign.id}/days/${dayNumber}/batch`, {
        entries,
      });

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error: any) {
      setSaveError(error.message || t.common.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcelExport = async () => {
    if (!currentCampaign) return;
    try {
      await api.downloadFile(
        `/reports/campaigns/${currentCampaign.id}/days/${dayNumber}/excel`,
        `Day_${dayNumber}_Report.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  const handlePdfDownload = async () => {
    if (!currentCampaign) return;
    try {
      setIsExportingPdf(true);
      const html = await api.getText(`/reports/campaigns/${currentCampaign.id}/days/${dayNumber}/print`);
      await downloadPdfFromHtml(html, `${currentCampaign.name}_Day_${dayNumber}_Report.pdf`);
    } catch (err: any) {
      alert(err.message || 'PDF ഡൗൺലോഡ് പരാജയപ്പെട്ടു');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenReportModal = () => {
    setShowReportModal(true);
  };

  const handleImportDaySales = async () => {
    if (!currentCampaign || !importText.trim()) return;
    try {
      setIsImporting(true);
      setImportResultMsg(null);
      const res = await api.post<any>(`/campaigns/${currentCampaign.id}/days/${dayNumber}/import`, {
        text: importText,
      });
      setImportResultMsg(res.message);
      await fetchDayData();
      setTimeout(() => {
        setShowImportModal(false);
        setImportText('');
        setImportResultMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'ഇറക്കുമതി പരാജയപ്പെട്ടു');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSales = async () => {
    if (!currentCampaign) return;
    try {
      setIsResettingSales(true);
      await api.post(`/campaigns/${currentCampaign.id}/reset-sales`, {});
      setShowResetModal(false);
      await fetchDayData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset sales');
    } finally {
      setIsResettingSales(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">
          {language === 'en' ? 'No Campaign Selected' : 'ക്യാമ്പയിൻ ലഭ്യമല്ല'}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'en'
            ? 'Please select or create a sales campaign.'
            : 'ദയവായി ഒരു ക്യാമ്പയിൻ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ സൃഷ്ടിക്കുക.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Official Print Header: only rendered in print / Save-as-PDF view */}
      <div className="hidden print:block text-center mb-4 border-b-2 border-emerald-800 pb-2">
        <h1 className="text-xl font-black text-emerald-900">{currentCampaign?.name}</h1>
        {currentCampaign?.institutionName && (
          <p className="text-sm font-semibold text-slate-700">{currentCampaign.institutionName}</p>
        )}
        <p className="text-xs text-slate-600 mt-1">
          <strong>ദിവസം {dayNumber} — വിൽപ്പന & റാങ്കിംഗ് റിപ്പോർട്ട് (Day {dayNumber} Sales & Ranking Report)</strong> | കലണ്ടർ വില: ₹{calendarPrice}
        </p>
      </div>

      {/* Top Navigation & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        {/* Day Switcher Tabs (Dynamic based on campaign duration) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap -mx-1 px-1 touch-pan-x">
          {Array.from({ length: currentCampaign?.durationDays || 7 }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => navigate(`/days/${d}`)}
              className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                dayNumber === d
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {language === 'en' ? `Day ${d}` : `ദിവസം ${d}`}
            </button>
          ))}
        </div>

        {/* Action Buttons: Save, Excel, Print */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-sm transition-all ${
                  isDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? t.common.saving : isDirty ? (language === 'en' ? 'Save Changes *' : 'സേവ് ചെയ്യുക *') : t.common.saved}
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                title={language === 'en' ? 'Import from Excel / CSV for this day' : 'ഈ ദിവസത്തെ വിവരങ്ങൾ എക്സലിൽ നിന്ന് ഇറക്കുമതി ചെയ്യുക'}
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">{language === 'en' ? 'Import Day Excel' : 'Excel ഇറക്കുമതി'}</span>
              </button>
            )}

            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
              title={t.common.exportExcel}
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handlePdfDownload}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              title={language === 'en' ? 'Download official Day PDF report' : 'ഔദ്യോഗിക PDF ഫയൽ ഡൗൺലോഡ് ചെയ്യുക'}
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExportingPdf ? 'Saving...' : (language === 'en' ? 'Download PDF' : '📄 PDF ഡൗൺലോഡ്')}
              </span>
            </button>

            <button
              onClick={handleOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              title={language === 'en' ? 'View and print official report document' : 'ഔദ്യോഗിക രേഖ കാണുക / പ്രിന്റ് ചെയ്യുക'}
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{language === 'en' ? 'View & Print' : '👁️ കാണുക / പ്രിന്റ്'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                title={language === 'en' ? 'Reset entered sales back to 0' : 'രേഖപ്പെടുത്തിയ വിൽപന വിവരങ്ങൾ പൂജ്യമാക്കി മാറ്റുക'}
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">{language === 'en' ? 'Reset Sales' : 'വിൽപന റീസെറ്റ്'}</span>
              </button>
            )}
          </div>

          {/* Toggle Layout Button */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'stacked' ? 'split' : 'stacked')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium"
            title={language === 'en' ? 'Toggle layout' : 'ടേബിൾ ലേഔട്ട് മാറ്റുക'}
          >
            <Columns className="w-4 h-4" />
            {layoutMode === 'stacked'
              ? (language === 'en' ? 'Side-by-Side' : 'സൈഡ്-ബൈ-സൈഡ്')
              : (language === 'en' ? 'Stacked' : 'ലംബമായ ലേഔട്ട്')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t.common.saved}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={() => fetchDayData()}
            className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold transition-all shadow-sm shrink-0"
          >
            {language === 'en' ? 'Retry' : 'വീണ്ടും ശ്രമിക്കുക'}
          </button>
        </div>
      )}

      {/* Stock & Cash Reconciliation */}
      {totals && (
        <ExpectedCashReconciliation
          totals={totals}
          calendarPrice={calendarPrice}
          currency={currency}
        />
      )}

      {/* Main Content: Two Distinct Tables */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          {language === 'en' ? 'Loading daily records...' : 'വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു... ദയവായി കാത്തിരിക്കുക.'}
        </div>
      ) : (
        <div
          className={`gap-6 ${
            layoutMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-2' : 'space-y-8'
          }`}
        >
          {/* Table A: Data Entry Table */}
          <div className="w-full">
            <DailySalesTable
              dayNumber={dayNumber}
              rows={rows}
              totals={totals || calculateDay1Totals([])}
              isEditable={canEdit}
              onCellChange={handleCellChange}
              currency={currency}
            />
          </div>

          {/* Table B: Automatic Ranking Table */}
          <div className="w-full">
            <DailyRankingTable
              dayNumber={dayNumber}
              rankingRows={rankingRows}
              totals={
                rankingTotals || {
                  calendarsSold: 0,
                  cashReceived: 0,
                  expenses: 0,
                  netCash: 0,
                  weightedAverage: 0,
                }
              }
              currency={currency}
            />
          </div>
        </div>
      )}

      {/* Reset Sales Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {language === 'en' ? 'Reset All Sales Entries?' : 'വിൽപന വിവരങ്ങൾ റീസെറ്റ് ചെയ്യണോ?'}
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              {language === 'en'
                ? `This will reset all daily sales numbers back to 0 across all ${currentCampaign?.durationDays || 7} days. Student names and targets will remain unchanged.`
                : `${currentCampaign?.durationDays || 7} ദിവസത്തെയും രേഖപ്പെടുത്തിയ വിൽപന വിവരങ്ങൾ (കൊണ്ടുപോയ കലണ്ടർ, വിറ്റത്, ലഭിച്ച കാശ്, ചെലവ്) പൂജ്യമാക്കി മാറ്റപ്പെടും. കുട്ടികളുടെ പേരുകളും ടാർഗറ്റും നിലനിൽക്കും.`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isResettingSales}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={isResettingSales}
                onClick={handleResetSales}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {isResettingSales
                  ? (language === 'en' ? 'Resetting...' : 'റീസെറ്റ് ചെയ്യുന്നു...')
                  : (language === 'en' ? 'Confirm Reset' : 'റീസെറ്റ് സ്ഥിരീകരിക്കുക')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Day Sales Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'en' ? `Import Day ${dayNumber} Sales (Excel / CSV)` : `ദിവസം ${dayNumber} — എക്സൽ വിവരങ്ങൾ ഇറക്കുമതി ചെയ്യുക`}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {language === 'en'
                ? 'Paste copied rows from your Excel sheet or upload a CSV file. Format: Student Name, Taken, Sold, Cash Received, Expenses'
                : 'നിങ്ങളുടെ Excel ഷീറ്റിൽ നിന്നോ CSV ഫയലിൽ നിന്നോ കോപ്പി ചെയ്ത് താഴെ പേസ്റ്റ് ചെയ്യുക. (ഫോർമാറ്റ്: കുട്ടിയുടെ പേര്, കൊണ്ടുപോയത്, വിറ്റത്, ലഭിച്ച കാശ്, ചെലവ്)'}
            </p>

            {importResultMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-300 font-medium">
                {importResultMsg}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                {language === 'en' ? 'Upload .csv or .txt file:' : 'CSV അല്ലെങ്കിൽ TXT ഫയൽ അപ്‌ലോഡ് ചെയ്യാം:'}
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileChange}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`നാജി പൂന്താനം, 60, 40, 3346, 226\nജുബൈർ മണ്ണുംകുളം, 60, 48, 3936, 256\nമിർദാസ് താനൂർ, 50, 17, 1526, 386`}
              className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isImporting}
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={isImporting || !importText.trim()}
                onClick={handleImportDaySales}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {isImporting
                  ? (language === 'en' ? 'Importing...' : 'ഇറക്കുമതി ചെയ്യുന്നു...')
                  : (language === 'en' ? 'Confirm Import' : 'ഇറക്കുമതി സ്ഥിരീകരിക്കുക')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Save Button on Mobile */}
      {isDirty && canEdit && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 bg-emerald-700 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-500 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-xs font-bold leading-tight">
              {language === 'en' ? 'Unsaved changes' : 'മാറ്റങ്ങൾ സേവ് ചെയ്തിട്ടില്ല'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-black text-xs shadow-md hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-4 h-4 text-emerald-700" />
            <span>
              {isSaving
                ? (language === 'en' ? 'Saving...' : 'സേവിംഗ്...')
                : (language === 'en' ? 'Save Changes *' : 'സേവ് ചെയ്യുക *')}
            </span>
          </button>
        </div>
      )}

      {currentCampaign && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`${currentCampaign.name} — ${language === 'en' ? `Day ${dayNumber} Sales & Ranking Report` : `ദിവസം ${dayNumber} വിൽപ്പന & റാങ്കിംഗ് റിപ്പോർട്ട്`}`}
          endpoint={`/reports/campaigns/${currentCampaign.id}/days/${dayNumber}/print`}
          filename={`${currentCampaign.name}_Day_${dayNumber}_Report.pdf`}
        />
      )}
    </div>
  );
};
