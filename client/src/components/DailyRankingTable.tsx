import React from 'react';
import { Award, Trophy, Medal } from 'lucide-react';
import { RankingRow } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DailyRankingTableProps {
  dayNumber: number;
  rankingRows: RankingRow[];
  totals: {
    calendarsSold: number;
    cashReceived: number;
    expenses: number;
    netCash: number;
    weightedAverage: number;
    cumulativeSold?: number;
    cumulativeNetCash?: number;
  };
  currency?: string;
}

export const DailyRankingTable: React.FC<DailyRankingTableProps> = ({
  dayNumber,
  rankingRows,
  totals,
  currency = '₹',
}) => {
  const isDay1 = dayNumber === 1;
  const { t, language } = useLanguage();

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-600" />
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-400">
          <Medal className="w-3.5 h-3.5 text-amber-700" />
          #3
        </span>
      );
    }
    return (
      <span className="font-mono text-xs font-semibold text-slate-600">
        #{rank}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
      {/* Table Header Banner */}
      <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-bold text-emerald-950">
              {t.common.tableBHeading}
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              {t.common.tableBSubheading}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-md">
          {language === 'en' ? 'Ranked by Daily Net Cash' : 'അന്നത്തെ ബാക്കി കാശ് ക്രമം (Net Cash Sort)'}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[70vh] relative">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 z-20 bg-emerald-800 text-white select-none">
            {isDay1 ? (
              <tr>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center w-16">{t.rankingCols.rank}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold min-w-[170px]">{t.rankingCols.studentName}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.sold}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.cashReceived} ({currency})</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.expenses} ({currency})</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-bold text-center bg-emerald-900 text-emerald-200">{t.rankingCols.netCash} ({currency}) 🎯</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.average} ({currency})</th>
              </tr>
            ) : (
              <tr>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center w-16">{t.rankingCols.rank}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold min-w-[170px]">{t.rankingCols.studentName}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.sold}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.cashReceived} ({currency})</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.expenses} ({currency})</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-bold text-center bg-emerald-900 text-emerald-200">{t.rankingCols.netCash} ({currency}) 🎯</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center">{t.rankingCols.average} ({currency})</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-semibold text-center text-blue-200">{t.rankingCols.cumulativeSold}</th>
                <th className="py-3 px-3 border-b border-emerald-700 font-bold text-center bg-emerald-950 text-emerald-300">{t.rankingCols.cumulativeNetCash} ({currency})</th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-emerald-100">
            {rankingRows.map((row, index) => {
              return (
                <tr
                  key={row.studentId}
                  className={`hover:bg-emerald-50/40 transition-colors ${
                    row.rank === 1
                      ? 'bg-amber-50/30'
                      : index % 2 === 0
                      ? 'bg-white'
                      : 'bg-slate-50/40'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 text-center">
                    {renderRankBadge(row.rank)}
                  </td>

                  {/* Student Name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{row.studentName}</span>
                      <span className="text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {row.studentCode}
                      </span>
                    </div>
                  </td>

                  {/* Sold */}
                  <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                    {row.calendarsSold}
                  </td>

                  {/* Cash Received */}
                  <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                    {currency}{row.cashReceived}
                  </td>

                  {/* Expenses */}
                  <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                    {row.expenses > 0 ? `${currency}${row.expenses}` : '-'}
                  </td>

                  {/* Net Cash */}
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-800 bg-emerald-100/50">
                    {currency}{row.netCash}
                  </td>

                  {/* Average */}
                  <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                    {currency}{row.average}
                  </td>

                  {/* Days 2-7 Columns */}
                  {!isDay1 && (
                    <>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-800 bg-blue-50/30">
                        {row.cumulativeSold || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-950 bg-emerald-200/50">
                        {currency}{row.cumulativeNetCash || 0}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Table B SUM Row */}
          <tfoot className="sticky bottom-0 z-20 bg-emerald-100 text-emerald-950 border-t-2 border-emerald-300 font-bold shadow-md">
            {isDay1 ? (
              <tr className="divide-x divide-emerald-200">
                <td colSpan={2} className="py-3 px-4 text-left font-bold text-emerald-950 bg-emerald-200">
                  {t.common.total}
                </td>
                <td className="py-3 px-3 text-center font-bold">{totals.calendarsSold}</td>
                <td className="py-3 px-3 text-center font-bold">{currency}{totals.cashReceived}</td>
                <td className="py-3 px-3 text-center font-bold">{currency}{totals.expenses}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-950 bg-emerald-300/80">{currency}{totals.netCash}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-900" title="Weighted Average: Total Net Cash / Total Calendars Sold">
                  {currency}{totals.weightedAverage}
                </td>
              </tr>
            ) : (
              <tr className="divide-x divide-emerald-200">
                <td colSpan={2} className="py-3 px-4 text-left font-bold text-emerald-950 bg-emerald-200">
                  {t.common.total}
                </td>
                <td className="py-3 px-3 text-center font-bold">{totals.calendarsSold}</td>
                <td className="py-3 px-3 text-center font-bold">{currency}{totals.cashReceived}</td>
                <td className="py-3 px-3 text-center font-bold">{currency}{totals.expenses}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-950 bg-emerald-300/80">{currency}{totals.netCash}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-900" title="Weighted Average: Total Net Cash / Total Calendars Sold">
                  {currency}{totals.weightedAverage}
                </td>
                <td className="py-3 px-3 text-center font-bold text-blue-950 bg-blue-100/60">{totals.cumulativeSold || 0}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-950 bg-emerald-300/80">{currency}{totals.cumulativeNetCash || 0}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
};
