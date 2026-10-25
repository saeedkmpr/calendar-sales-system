import React from 'react';
import { CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { DayTotals } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExpectedCashReconciliationProps {
  totals: DayTotals;
  calendarPrice: number;
  currency?: string;
}

export const ExpectedCashReconciliation: React.FC<ExpectedCashReconciliationProps> = ({
  totals,
  calendarPrice,
  currency = '₹',
}) => {
  const { t, language } = useLanguage();
  const isExact = totals.cashDiff === 0;
  const isDeficit = totals.cashDiff < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
        <Scale className="w-5 h-5 text-emerald-600" />
        <h4 className="text-sm font-bold text-slate-800">
          {language === 'en'
            ? 'Cash Reconciliation & Integrity Check'
            : 'കാഷ് റീകൺസിലിയേഷൻ & പരിശോധന (Cash Reconciliation)'}
        </h4>
        <span className="text-xs text-slate-500">
          ({language === 'en' ? 'Price per calendar:' : 'കലണ്ടർ വില:'} {currency}{calendarPrice})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Expected Cash */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">
            {t.common.expectedCash} ({totals.calendarsSold} × {currency}{calendarPrice})
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800">
            {currency}{totals.expectedCash}
          </div>
        </div>

        {/* Actual Gross Cash Received */}
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 mb-1">
            {language === 'en' ? 'Gross Cash Received' : 'ലഭിച്ച മൊത്തം കാശ് (Gross Cash)'}
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-900">
            {currency}{totals.cashReceived}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200">
          <div className="text-xs text-amber-700 mb-1">
            {language === 'en' ? 'Daily Expenses' : 'അന്നത്തെ ചെലവ് (Expenses)'}
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-900">
            {currency}{totals.expenses}
          </div>
        </div>

        {/* Difference / Status */}
        <div
          className={`p-3 rounded-lg border ${
            isExact
              ? 'bg-emerald-50 border-emerald-300'
              : isDeficit
              ? 'bg-rose-50 border-rose-300'
              : 'bg-indigo-50 border-indigo-300'
          }`}
        >
          <div className="text-xs text-slate-600 mb-1 flex items-center justify-between">
            <span>{t.common.difference}</span>
            {isExact ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div
            className={`text-base sm:text-lg font-bold ${
              isExact
                ? 'text-emerald-700'
                : isDeficit
                ? 'text-rose-700'
                : 'text-indigo-700'
            }`}
          >
            {totals.cashDiff > 0 ? `+${currency}${totals.cashDiff}` : `${currency}${totals.cashDiff}`}
          </div>
          <div className="text-2xs mt-0.5 text-slate-500">
            {isExact
              ? (language === 'en' ? 'Exact amount received' : 'കൃത്യമായ തുക ലഭിച്ചു')
              : isDeficit
              ? (language === 'en' ? 'Less than expected' : 'പ്രതീക്ഷിച്ചതിൽ കുറവ് ലഭിച്ചു')
              : (language === 'en' ? 'Surplus amount received' : 'കൂടുതൽ തുക ലഭിച്ചു')}
          </div>
        </div>
      </div>
    </div>
  );
};
