import React, { useState } from 'react';
import { Calendar, Lock, User, ArrowRight, ShieldCheck, UserCheck, Eye, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post<any>('/auth/login', { username, password });
      login(res.token, res.user);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Invalid credentials' : 'ലോഗിൻ ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      {/* Top Language Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:border-emerald-500 text-xs font-bold transition-all"
        >
          <Languages className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ml' ? 'English' : 'മലയാളം'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t.appTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t.appSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {language === 'en' ? 'Username / Email' : 'യൂസർനെയിം (Username)'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {language === 'en' ? 'Password' : 'പാസ്‌വേഡ് (Password)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>
                {isLoading
                  ? (language === 'en' ? 'Verifying...' : 'പരിശോധിക്കുന്നു...')
                  : (language === 'en' ? 'Log In' : 'പ്രവേശിക്കുക (Login)')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              {language === 'en' ? 'Test Demo Accounts' : 'ടെസ്റ്റിംഗ് അക്കൗണ്ടുകൾ (Demo Logins)'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-2 px-1 text-center bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-2xs font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                {t.roles.ADMIN.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('operator', 'operator123')}
                className="py-2 px-1 text-center bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-2xs font-semibold text-slate-700 hover:text-blue-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
                {t.roles.OPERATOR.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer', 'viewer123')}
                className="py-2 px-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-2xs font-semibold text-slate-700 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                {t.roles.VIEWER.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
