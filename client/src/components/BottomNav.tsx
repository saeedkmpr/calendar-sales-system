import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Tent,
  FileSpreadsheet,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const { language } = useLanguage();

  const navItems = [
    {
      to: '/dashboard',
      label: language === 'en' ? 'Dashboard' : 'ഡാഷ്‌ബോർഡ്',
      icon: LayoutDashboard,
    },
    {
      to: '/days/1',
      label: language === 'en' ? 'Daily' : 'ദിവസങ്ങൾ',
      icon: CalendarDays,
    },
    {
      to: '/leaderboard',
      label: language === 'en' ? 'Totals' : 'ആകെ കണക്ക്',
      icon: Trophy,
    },
    {
      to: '/camps',
      label: language === 'en' ? 'Camps' : 'ക്യാമ്പുകൾ',
      icon: Tent,
    },
    {
      to: '/summary',
      label: language === 'en' ? 'Summary' : 'സംഗ്രഹം',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 py-1.5 flex items-center justify-around safe-area-bottom print:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
                isActive
                  ? 'text-emerald-700 font-bold bg-emerald-50/80'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 leading-none tracking-tight">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
export default BottomNav;
