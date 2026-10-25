import React, { useState, useEffect } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const UsersPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<any[]>('/users');
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post('/users', {
        name,
        username,
        password,
        role,
      });
      setShowModal(false);
      setName('');
      setUsername('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to add user' : 'ഉപയോക്താവിനെ ചേർക്കാൻ സാധിച്ചില്ല'));
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await api.put(`/users/${user.id}`, {
        isActive: !user.isActive,
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">{t.nav.users}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en' ? 'Manage application users and security roles' : 'സിസ്റ്റം ഉപയോക്താക്കളെയും അവരുടെ റോളുകളെയും നിയന്ത്രിക്കുക'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'en' ? 'New User' : 'പുതിയ ഉപയോക്താവ്'}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Name' : 'പേര്'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Username' : 'യൂസർനെയിം'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Role' : 'റോൾ (Role)'}</th>
                <th className="py-3 px-4 font-semibold text-center">{language === 'en' ? 'Status' : 'നില'}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.username}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === 'OPERATOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role === 'ADMIN'
                        ? t.roles.ADMIN
                        : u.role === 'OPERATOR'
                        ? t.roles.OPERATOR
                        : t.roles.VIEWER}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className="text-xs font-medium text-slate-600 hover:text-emerald-700 hover:underline"
                    >
                      {u.isActive
                        ? (language === 'en' ? 'Deactivate' : 'നിഷ്ക്രിയമാക്കുക')
                        : (language === 'en' ? 'Activate' : 'സജീവമാക്കുക')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Add New User' : 'പുതിയ ഉപയോക്താവിനെ ചേർക്കുക'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Full Name' : 'പൂർണ്ണ നാമം'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Username' : 'യൂസർനെയിം'}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Password' : 'പാസ്‌വേഡ്'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Role' : 'റോൾ (Role)'}
                </label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="OPERATOR">{t.roles.OPERATOR}</option>
                  <option value="ADMIN">{t.roles.ADMIN}</option>
                  <option value="VIEWER">{t.roles.VIEWER}</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  {language === 'en' ? 'Add' : 'ചേർക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
