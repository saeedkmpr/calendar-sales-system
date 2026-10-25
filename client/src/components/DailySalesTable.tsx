import React from 'react';
import { AlertCircle } from 'lucide-react';
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
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-bold text-slate-800">
              {t.common.tableAHeading}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'en'
              ? 'Enter data in original student order. Calculations update automatically.'
              : 'കുട്ടികളുടെ ക്രമത്തിൽ വിവരങ്ങൾ നൽകുക. കണക്കുകൂട്ടലുകൾ തനിയെ നടക്കും.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <span>{language === 'en' ? 'Students:' : 'ആകെ കുട്ടികൾ:'} <strong>{rows.length}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-medium">{language === 'en' ? 'Currency:' : 'തുക:'} <strong>{currency}</strong></span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[70vh] relative">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 z-20 bg-slate-800 text-white select-none">
            {isDay1 ? (
              <tr>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center w-12">#</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold min-w-[180px]">{t.day1Cols.studentName}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center">{t.day1Cols.target}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.day1Cols.taken} ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.day1Cols.sold} ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-800 text-emerald-300">{t.day1Cols.remainingCalendars}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.day1Cols.cashReceived} ({currency}) ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.day1Cols.expenses} ({currency}) ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-emerald-900 text-emerald-200 font-bold">{t.day1Cols.netCash} ({currency})</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center">{t.day1Cols.average} ({currency})</th>
              </tr>
            ) : (
              <tr>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center w-12">#</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold min-w-[180px]">{t.daysCols.studentName}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center">{t.daysCols.target}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center text-amber-300">{t.daysCols.targetRemaining}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.daysCols.taken} ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.daysCols.sold} ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center text-emerald-300">{t.daysCols.remainingCalendars}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center text-blue-300">{t.daysCols.cumulativeSold}</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.daysCols.cashReceived} ({currency}) ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-slate-700">{t.daysCols.expenses} ({currency}) ✏️</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-emerald-900 text-emerald-200 font-bold">{t.daysCols.netCash} ({currency})</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center">{t.daysCols.average} ({currency})</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center bg-emerald-950 text-emerald-300 font-bold">{t.daysCols.cumulativeNetCash} ({currency})</th>
                <th className="py-3 px-3 border-b border-slate-700 font-semibold text-center">{t.daysCols.cumulativeAverage} ({currency})</th>
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
                  {/* Row Number */}
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs">
                    {index + 1}
                  </td>

                  {/* Student Name & Code */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{row.studentName}</span>
                      <span className="text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {row.studentCode}
                      </span>
                      {row.hasWarning && (
                        <span title={row.warningMessage} className="text-red-500 cursor-help">
                          <AlertCircle className="w-4 h-4 inline" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Target */}
                  <td className="py-2 px-3 text-center font-medium text-slate-700">
                    {row.target}
                  </td>

                  {/* Days 2-7: Target Remaining */}
                  {!isDay1 && (
                    <td className="py-2 px-3 text-center font-medium text-amber-700 bg-amber-50/40">
                      {d.targetRemaining}
                    </td>
                  )}

                  {/* Calendars Taken (Editable) */}
                  <td className="py-1 px-2 text-center bg-slate-50/70">
                    <input
                      type="number"
                      min="0"
                      aria-label={`${row.studentName} taken`}
                      disabled={!isEditable}
                      value={row.calendarsTaken === 0 ? '' : row.calendarsTaken}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'calendarsTaken', e)}
                      className="w-16 sm:w-20 text-center py-1 px-1.5 border border-slate-300 rounded focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Calendars Sold (Editable) */}
                  <td className="py-1 px-2 text-center bg-slate-50/70">
                    <input
                      type="number"
                      min="0"
                      aria-label={`${row.studentName} sold`}
                      disabled={!isEditable}
                      value={row.calendarsSold === 0 ? '' : row.calendarsSold}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'calendarsSold', e)}
                      className={`w-16 sm:w-20 text-center py-1 px-1.5 border rounded focus:bg-white focus:ring-1 font-medium text-slate-800 disabled:bg-slate-100 ${
                        row.calendarsSold > row.calendarsTaken
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                  </td>

                  {/* Remaining Calendars (Today Taken - Today Sold) */}
                  <td className="py-2 px-3 text-center font-semibold text-slate-700 bg-emerald-50/30">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        row.remainingCalendars < 0
                          ? 'bg-red-100 text-red-700 font-bold'
                          : row.remainingCalendars === 0
                          ? 'text-slate-400'
                          : 'text-emerald-700'
                      }`}
                    >
                      {row.remainingCalendars}
                    </span>
                  </td>

                  {/* Days 2-7: Cumulative Sold */}
                  {!isDay1 && (
                    <td className="py-2 px-3 text-center font-bold text-blue-800 bg-blue-50/40">
                      {d.cumulativeSold}
                    </td>
                  )}

                  {/* Cash Received (Editable) */}
                  <td className="py-1 px-2 text-center bg-slate-50/70">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`${row.studentName} cash`}
                      disabled={!isEditable}
                      value={row.cashReceived === 0 ? '' : row.cashReceived}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'cashReceived', e)}
                      className="w-20 sm:w-24 text-center py-1 px-1.5 border border-slate-300 rounded focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Expenses (Editable) */}
                  <td className="py-1 px-2 text-center bg-slate-50/70">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`${row.studentName} expenses`}
                      disabled={!isEditable}
                      value={row.expenses === 0 ? '' : row.expenses}
                      placeholder="0"
                      onChange={(e) => handleInputChange(row.studentId, 'expenses', e)}
                      className="w-16 sm:w-20 text-center py-1 px-1.5 border border-slate-300 rounded focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </td>

                  {/* Net Cash */}
                  <td className="py-2 px-3 text-center font-bold text-emerald-800 bg-emerald-100/50">
                    {currency}{row.netCash}
                  </td>

                  {/* Average */}
                  <td className="py-2 px-3 text-center font-medium text-slate-600">
                    {currency}{row.average}
                  </td>

                  {/* Days 2-7: Cumulative Net Cash & Cumulative Average */}
                  {!isDay1 && (
                    <>
                      <td className="py-2 px-3 text-center font-bold text-emerald-900 bg-emerald-200/50">
                        {currency}{d.cumulativeNetCash}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-slate-600">
                        {currency}{d.cumulativeAverage}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Table A SUM Row */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-100 text-slate-900 border-t-2 border-slate-300 font-bold shadow-md">
            {isDay1 ? (
              <tr className="divide-x divide-slate-200">
                <td colSpan={2} className="py-3 px-4 text-left font-bold text-slate-800 bg-slate-200">
                  {t.common.total}
                </td>
                <td className="py-3 px-3 text-center font-bold">{totals.target}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{totals.calendarsTaken}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{totals.calendarsSold}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-100/40">{totals.remainingCalendars}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{currency}{totals.cashReceived}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{currency}{totals.expenses}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-900 bg-emerald-200/80">{currency}{totals.netCash}</td>
                <td className="py-3 px-3 text-center font-bold text-slate-700" title="Weighted: Total Net Cash / Total Calendars Sold">
                  {currency}{totals.average}
                </td>
              </tr>
            ) : (
              <tr className="divide-x divide-slate-200">
                <td colSpan={2} className="py-3 px-4 text-left font-bold text-slate-800 bg-slate-200">
                  {t.common.total}
                </td>
                <td className="py-3 px-3 text-center font-bold">{totals.target}</td>
                <td className="py-3 px-3 text-center font-bold text-amber-800 bg-amber-100/50">{totals.targetRemaining}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{totals.calendarsTaken}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{totals.calendarsSold}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-100/40">{totals.remainingCalendars}</td>
                <td className="py-3 px-3 text-center font-bold text-blue-900 bg-blue-100/50">{totals.cumulativeSold}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{currency}{totals.cashReceived}</td>
                <td className="py-3 px-3 text-center font-bold bg-slate-200/60">{currency}{totals.expenses}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-900 bg-emerald-200/80">{currency}{totals.netCash}</td>
                <td className="py-3 px-3 text-center font-bold text-slate-700" title="Weighted: Total Net Cash / Total Calendars Sold">
                  {currency}{totals.average}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-950 bg-emerald-300/80">{currency}{totals.cumulativeNetCash}</td>
                <td className="py-3 px-3 text-center font-bold text-slate-700" title="Weighted: Total Cumulative Net Cash / Total Cumulative Sold">
                  {currency}{totals.cumulativeAverage}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};
