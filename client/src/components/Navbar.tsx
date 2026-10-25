import React, { useState } from 'react';
import {
  Calendar,
  UserCheck,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Languages,
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { campaigns, currentCampaign, setCurrentCampaign } = useCampaign();
  const { language, toggleLanguage, t } = useLanguage();

  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('പുതിയ പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('നൽകിയ രണ്ട് പുതിയ പാസ്‌വേഡുകളും ഒരേപോലെയല്ല');
      return;
    }

    try {
      setIsSubmitting(true);
      setPasswordError(null);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('പാസ്‌വേഡ് വിജയകരമായി മാറ്റി!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'പാസ്‌വേഡ് മാറ്റാൻ കഴിഞ്ഞില്ല');
    } finally {
      setIsSubmitting(false);
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

          {/* User Info & Badge & Password Change */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                {getRoleBadge(user.role)}
              </div>

              {/* Change My Password Button */}
              <button
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setShowPasswordModal(true);
                }}
                title="എന്റെ പാസ്‌വേഡ് മാറ്റുക (Change Password)"
                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Logout Button */}
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

      {/* ================= MODAL: SELF CHANGE PASSWORD ================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">എന്റെ പാസ്‌വേഡ് മാറ്റുക</h3>
                  <p className="text-xs text-slate-500">{user?.name} ({user?.username})</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  നിലവിലെ പാസ്‌വേഡ് <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="നിങ്ങളുടെ നിലവിലെ പാസ്‌വേഡ്"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പുതിയ പാസ്‌വേഡ് <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ"
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പുതിയ പാസ്‌വേഡ് ആവർത്തിക്കുക <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="മുകളിൽ നൽകിയ അതേ പുതിയ പാസ്‌വേഡ്"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'മാറ്റുന്നു...' : 'പാസ്‌വേഡ് മാറ്റുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
