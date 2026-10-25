import React from 'react';
import { Calendar, UserCheck, LogOut, ChevronDown, ShieldCheck, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { campaigns, currentCampaign, setCurrentCampaign } = useCampaign();
  const { language, toggleLanguage, t } = useLanguage();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3" />
            {t.roles.ADMIN.split(' ')[0]}
          </span>
        );
      case 'OPERATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <UserCheck className="w-3 h-3" />
            {t.roles.OPERATOR.split(' ')[0]}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {t.roles.VIEWER.split(' ')[0]}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {t.appTitle}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {currentCampaign?.institutionName || t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Language Toggle + Campaign Selector + User Info + Logout */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            title={language === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറ്റുക'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all shadow-2xs"
          >
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ml' ? 'English' : 'മലയാളം'}</span>
          </button>

          {/* Campaign Selector */}
          {campaigns.length > 0 && (
            <div className="relative">
              <select
                aria-label="Select campaign"
                value={currentCampaign?.id || ''}
                onChange={(e) => {
                  const selected = campaigns.find((c) => c.id === e.target.value);
                  if (selected) setCurrentCampaign(selected);
                }}
                className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-lg py-1.5 pl-3 pr-8 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (₹{c.calendarPrice})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* User Info & Badge */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                {getRoleBadge(user.role)}
              </div>
              <button
                onClick={logout}
                title={t.nav.logout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
