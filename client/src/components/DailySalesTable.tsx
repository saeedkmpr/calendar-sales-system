import React, { useState } from 'react';
import { AlertCircle, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Day1Row, DailySalesRow, DayTotals } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DailySalesTableProps {
  dayNumber: number;
  rows: (Day1Row | DailySalesRow)[];
  totals: DayTotals;
  isEditable: boolean;
  onCellChange: (studentId: string, field: 'calendarsTaken' | 'calendarsSold' | 'cashReceived' | 'expenses', value: number) => void;
  currency?: string;
}

export const DailySalesTable: React.FC<DailySalesTableProps> = ({
  dayNumber,
  rows,
  totals,
  isEditable,
  onCellChange,
  currency = '₹',
}) => {
  const isDay1 = dayNumber === 1;
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const handleInputChange = (
    studentId: string,
    field: 'calendarsTaken' | 'calendarsSold' | 'cashReceived' | 'expenses',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (!isNaN(val)) {
      onCellChange(studentId, field, Math.max(0, val));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header banner */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {t.common.tableAHeading}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'en'
              ? 'Enter data in original student order. Calculations update automatically.'
              : 'കുട്ടികളുടെ ക്രമത്തിൽ വിവരങ്ങൾ നൽകുക. കണക്കുകൂട്ടലുകൾ തനിയെ നടക്കും.'}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile View Toggle: Cards vs Table */}
          <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-lg border border-slate-300">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={language === 'en' ? 'View as Table' : 'ടേബിൾ രൂപത്തിൽ കാണുക'}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Table' : 'ടേബിൾ'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={language === 'en' ? 'View as Mobile Cards' : 'മൊബൈൽ കാർഡ് രൂപത്തിൽ കാണുക'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Cards' : 'കാർഡുകൾ'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span>{language === 'en' ? 'Students:' : 'കുട്ടികൾ:'} <strong>{rows.length}</strong></span>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: MOBILE CARDS VIEW ================= */}
      {viewMode === 'cards' ? (
        <div className="p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {rows.map((row, index) => {
            const d = row as DailySalesRow;
            return (
              <div
                key={row.studentId}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all overflow-hidden p-3.5 space-y-3"
              >
                {/* Student Info Top Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{row.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {language === 'en' ? 'Code:' : 'കോഡ്:'} {row.studentCode}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {language === 'en' ? 'Target:' : 'ലക്ഷ്യം:'} {row.target}
                    </span>
                    {!isDay1 && (
                      <div className="text-[11px] font-medium text-amber-700 mt-0.5">
                        {language === 'en' ? 'Rem:' : 'ബാക്കി:'} {d.targetRemaining}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Large Touch-Friendly Inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Calendars Taken */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'en' ? '📥 Taken' : '📥 കൊണ്ടുപോയത് (Taken)'}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      disabled={!isEditable}
                      value={row.calendarsTaken === 0 ? '' : row.calendarsTaken}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'calendarsTaken', e)}
                      className="w-full text-center py-2 text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Calendars Sold */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'en' ? '🏷️ Sold' : '🏷️ വിറ്റത് (Sold)'}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      disabled={!isEditable}
                      value={row.calendarsSold === 0 ? '' : row.calendarsSold}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'calendarsSold', e)}
                      className={`w-full text-center py-2 text-base font-bold text-slate-800 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                        row.calendarsSold > row.calendarsTaken
                          ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Cash Received */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'en' ? `💵 Cash (${currency})` : `💵 ലഭിച്ച തുക (${currency})`}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      disabled={!isEditable}
                      value={row.cashReceived === 0 ? '' : row.cashReceived}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'cashReceived', e)}
                      className="w-full text-center py-2 text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Expenses */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'en' ? `🧾 Expenses (${currency})` : `🧾 ചിലവ് (${currency})`}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      disabled={!isEditable}
                      value={row.expenses === 0 ? '' : row.expenses}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'expenses', e)}
                      className="w-full text-center py-2 text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Card Calculated Results Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-emerald-50/50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'en' ? 'Stock' : 'ബാക്കി സ്റ്റോക്ക്'}
                    </span>
                    <span className="font-bold text-slate-800">{row.remainingCalendars} {language === 'en' ? 'Cal.' : 'കലണ്ടർ'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'en' ? 'Average' : 'ശരാശരി'}
                    </span>
                    <span className="font-medium text-slate-700">{currency} {row.average}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-emerald-800 font-bold block">
                      {language === 'en' ? 'Net Cash' : 'അന്നത്തെ ബാക്കി കാശ്'}
                    </span>
                    <span className="font-black text-sm text-emerald-700">
                      {currency} {row.netCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VIEW 2: TRADITIONAL TABLE VIEW WITH STICKY NAMES ================= */
        <div className="overflow-x-auto max-h-[75vh] relative scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-20 bg-slate-900 text-white select-none">
              {isDay1 ? (
                <tr>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center w-10">#</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold min-w-[170px] sticky left-0 bg-slate-900 z-30 shadow-xs border-r border-slate-800">
                    {t.day1Cols.studentName}
                  </th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center">{t.day1Cols.target}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.day1Cols.taken} ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.day1Cols.sold} ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center text-emerald-300">{t.day1Cols.remainingCalendars}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.day1Cols.cashReceived} ({currency}) ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.day1Cols.expenses} ({currency}) ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-bold text-center bg-emerald-950 text-emerald-300">{t.day1Cols.netCash} ({currency})</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center">{t.day1Cols.average} ({currency})</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center w-10">#</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold min-w-[170px] sticky left-0 bg-slate-900 z-30 shadow-xs border-r border-slate-800">
                    {t.daysCols.studentName}
                  </th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center">{t.daysCols.target}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center text-amber-300">{t.daysCols.targetRemaining}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.daysCols.taken} ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.daysCols.sold} ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center text-emerald-300">{t.daysCols.remainingCalendars}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center text-blue-300">{t.daysCols.cumulativeSold}</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.daysCols.cashReceived} ({currency}) ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center bg-slate-800">{t.daysCols.expenses} ({currency}) ✏️</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-bold text-center bg-emerald-950 text-emerald-300">{t.daysCols.netCash} ({currency})</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center">{t.daysCols.average} ({currency})</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-bold text-center bg-emerald-900 text-emerald-200">{t.daysCols.cumulativeNetCash} ({currency})</th>
                  <th className="py-3 px-3 border-b border-slate-800 font-semibold text-center">{t.daysCols.cumulativeAverage} ({currency})</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => {
                const d = row as DailySalesRow;
                return (
                  <tr
                    key={row.studentId}
                    className={`hover:bg-slate-50 transition-colors ${
                      row.hasWarning ? 'bg-red-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                      {index + 1}
                    </td>

                    {/* Student Name Sticky Left */}
                    <td className="py-2.5 px-3 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{row.studentName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          {row.studentCode}
                        </span>
                        {row.hasWarning && (
                          <span title={row.warningMessage} className="text-red-500">
                            <AlertCircle className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center font-medium text-slate-700">{row.target}</td>

                    {!isDay1 && (
                      <td className="py-2 px-3 text-center font-medium text-amber-700 bg-amber-50/40">
                        {d.targetRemaining}
                      </td>
                    )}

                    <td className="py-1 px-2 text-center bg-slate-50/70">
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditable}
                        value={row.calendarsTaken === 0 ? '' : row.calendarsTaken}
                        placeholder="0"
                        onChange={(e) => handleInputChange(row.studentId, 'calendarsTaken', e)}
                        className="w-16 sm:w-20 text-center py-1.5 px-1.5 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 disabled:bg-slate-100"
                      />
                    </td>

                    <td className="py-1 px-2 text-center bg-slate-50/70">
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditable}
                        value={row.calendarsSold === 0 ? '' : row.calendarsSold}
                        placeholder="0"
                        onChange={(e) => handleInputChange(row.studentId, 'calendarsSold', e)}
                        className={`w-16 sm:w-20 text-center py-1.5 px-1.5 border rounded-lg focus:bg-white focus:ring-2 font-bold text-slate-800 disabled:bg-slate-100 ${
                          row.calendarsSold > row.calendarsTaken
                            ? 'border-red-400 bg-red-50 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-emerald-500'
                        }`}
                      />
                    </td>

                    <td className="py-2 px-3 text-center font-semibold text-slate-700 bg-emerald-50/30">
                      <span className={row.remainingCalendars < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                        {row.remainingCalendars}
                      </span>
                    </td>

                    {!isDay1 && (
                      <td className="py-2 px-3 text-center font-bold text-blue-800 bg-blue-50/40">
                        {d.cumulativeSold}
                      </td>
                    )}

                    <td className="py-1 px-2 text-center bg-slate-50/70">
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditable}
                        value={row.cashReceived === 0 ? '' : row.cashReceived}
                        placeholder="0"
                        onChange={(e) => handleInputChange(row.studentId, 'cashReceived', e)}
                        className="w-20 sm:w-24 text-center py-1.5 px-1.5 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 disabled:bg-slate-100"
                      />
                    </td>

                    <td className="py-1 px-2 text-center bg-slate-50/70">
                      <input
                        type="number"
                        min="0"
                        disabled={!isEditable}
                        value={row.expenses === 0 ? '' : row.expenses}
                        placeholder="0"
                        onChange={(e) => handleInputChange(row.studentId, 'expenses', e)}
                        className="w-16 sm:w-20 text-center py-1.5 px-1.5 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 disabled:bg-slate-100"
                      />
                    </td>

                    <td className="py-2 px-3 text-center font-bold text-emerald-800 bg-emerald-50/60">
                      {currency} {row.netCash.toLocaleString('en-IN')}
                    </td>

                    <td className="py-2 px-3 text-center text-slate-600">
                      {currency} {row.average}
                    </td>

                    {!isDay1 && (
                      <>
                        <td className="py-2 px-3 text-center font-bold text-emerald-800 bg-emerald-50/80">
                          {currency} {d.cumulativeNetCash.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">
                          {currency} {d.cumulativeAverage}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grand Totals Bar */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 border-t-2 border-emerald-600 flex items-center justify-between flex-wrap gap-3">
        <div className="font-bold text-xs sm:text-sm uppercase tracking-wider text-emerald-400">
          {language === 'en' ? 'TOTAL:' : 'ആകെ തുക (TOTAL):'}
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold flex-wrap">
          <div>
            {language === 'en' ? 'Sold:' : 'വിറ്റത്:'} <span className="text-emerald-300 font-black">{totals.calendarsSold}</span>
          </div>
          <div>
            {language === 'en' ? 'Received:' : 'ലഭിച്ചത്:'} <span className="text-white font-black">{currency} {totals.cashReceived.toLocaleString('en-IN')}</span>
          </div>
          <div>
            {language === 'en' ? 'Expenses:' : 'ചിലവ്:'} <span className="text-rose-300 font-black">{currency} {totals.expenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-emerald-600 px-3 py-1 rounded-lg text-white font-black text-sm">
            {language === 'en' ? 'Net Cash:' : 'ആകെ ബാക്കി:'} {currency} {totals.netCash.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DailySalesTable;
