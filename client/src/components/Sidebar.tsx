import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Users,
  Trophy,
  Tent,
  FolderKanban,
  UserCog,
  History,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCampaign } from '../context/CampaignContext';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { currentCampaign } = useCampaign();

  const totalDays = currentCampaign?.durationDays && currentCampaign.durationDays > 0 ? currentCampaign.durationDays : 7;

  const dayLinks = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    let label = language === 'en' ? `Day ${day}` : `ദിവസം ${day}`;
    const navKey = `day${day}` as keyof typeof t.nav;
    if (t.nav[navKey]) {
      label = t.nav[navKey];
    }
    return {
      to: `/days/${day}`,
      label,
      day,
    };
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Mobile Top Header with Close Button */}
      <div className="md:hidden p-4 pb-0 flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="font-bold text-sm text-emerald-400">
          {language === 'en' ? 'Navigation Menu' : 'മെനു ലിങ്ക്സ്'}
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {language === 'en' ? 'Main Menu' : 'പ്രധാന മെനു'}
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span>{t.nav.dashboard}</span>
            </NavLink>

            <NavLink
              to="/summary"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
              <span>{t.nav.summary}</span>
            </NavLink>

            <NavLink
              to="/leaderboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Trophy className="w-5 h-5 shrink-0 text-amber-400" />
              <span>{language === 'en' ? 'Student Leaderboard' : 'കുട്ടികളുടെ ആകെ കണക്ക്'}</span>
            </NavLink>

            <NavLink
              to="/camps"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Tent className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{t.nav.camps || (language === 'en' ? 'Team Camps' : 'ടീം ക്യാമ്പുകൾ')}</span>
            </NavLink>

            <NavLink
              to="/students"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>{t.nav.students}</span>
            </NavLink>

            <NavLink
              to="/campaigns"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <FolderKanban className="w-5 h-5 shrink-0" />
              <span>{t.nav.campaigns}</span>
            </NavLink>
          </nav>
        </div>

        {/* Daily Sales Pages Section (Dynamic based on campaign duration) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>{language === 'en' ? `${totalDays} Days` : `${totalDays} ദിവസങ്ങൾ`}</span>
            <CalendarDays className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-1 max-h-56 overflow-y-auto pr-1">
            {dayLinks.map((item) => (
              <NavLink
                key={item.day}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-center py-2 px-2.5 rounded-md text-xs font-semibold text-center transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Administration Section (Admin only) */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {language === 'en' ? 'Administration' : 'അഡ്മിനിസ്ട്രേഷൻ'}
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <UserCog className="w-5 h-5 shrink-0" />
                <span>{t.nav.users}</span>
              </NavLink>

              <NavLink
                to="/audit-logs"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <History className="w-5 h-5 shrink-0" />
                <span>{t.nav.auditLogs}</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 text-center">
        Calendar Sales System v1.0
      </div>
    </aside>
  );
};
