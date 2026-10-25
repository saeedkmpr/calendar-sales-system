import React, { useState, useEffect } from 'react';
import {
  UserCog,
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  X,
  Lock,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Change Password Modal
  const [passwordUser, setPasswordUser] = useState<any | null>(null);
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Handle Add User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddError(null);
      setIsSubmitting(true);
      await api.post('/users', {
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setShowAddModal(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('OPERATOR');
      setSuccessMessage('പുതിയ ഉപയോക്താവിനെ വിജയകരമായി ചേർത്തു!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message || 'ഉപയോക്താവിനെ ചേർക്കാൻ സാധിച്ചില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError(null);
  };

  // Handle Update User Details
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditError(null);
      setIsSubmitting(true);
      await api.put(`/users/${editingUser.id}`, {
        name: editName.trim(),
        role: editRole,
        isActive: editIsActive,
      });
      setEditingUser(null);
      setSuccessMessage('ഉപയോക്താവിന്റെ വിവരങ്ങൾ വിജയകരമായി മാറ്റി!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || 'അപ്ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Change Password Modal
  const handleOpenChangePassword = (user: any) => {
    setPasswordUser(user);
    setPasswordValue('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError(null);
  };

  // Handle Admin Password Change Submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (passwordValue.length < 6) {
      setPasswordError('പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം');
      return;
    }

    if (passwordValue !== confirmPassword) {
      setPasswordError('നൽകിയ രണ്ട് പാസ്‌വേഡുകളും ഒരേപോലെയല്ല');
      return;
    }

    try {
      setIsSubmitting(true);
      setPasswordError(null);
      const res = await api.put<any>(`/users/${passwordUser.id}/password`, {
        newPassword: passwordValue,
      });
      setPasswordUser(null);
      setSuccessMessage(res.message || 'പാസ്‌വേഡ് വിജയകരമായി മാറ്റി!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'പാസ്‌വേഡ് മാറ്റാൻ സാധിച്ചില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle active status
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
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">{t.nav.users}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en'
              ? 'Manage application users, security roles, and reset passwords'
              : 'ഉപയോക്താക്കളെ നിയന്ത്രിക്കുക, പുതിയ റോൾ നൽകുക & പാസ്‌വേഡ് മാറ്റുക'}
          </p>
        </div>

        <button
          onClick={() => {
            setNewName('');
            setNewUsername('');
            setNewPassword('');
            setNewRole('OPERATOR');
            setAddError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'en' ? 'New User' : 'പുതിയ ഉപയോക്താവ്'}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Name' : 'പേര്'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Username' : 'യൂസർനെയിം'}</th>
                <th className="py-3 px-4 font-semibold">{language === 'en' ? 'Role' : 'റോൾ (Role)'}</th>
                <th className="py-3 px-4 font-semibold text-center">{language === 'en' ? 'Status' : 'നില'}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    ലോഡ് ചെയ്യുന്നു...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    ഉപയോക്താക്കളൊന്നും കണ്ടെത്തിയില്ല.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              (നിങ്ങൾ)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'OPERATOR'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role === 'ADMIN'
                            ? t.roles.ADMIN
                            : u.role === 'OPERATOR'
                            ? t.roles.OPERATOR
                            : t.roles.VIEWER}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* Change Password Button */}
                          <button
                            onClick={() => handleOpenChangePassword(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors shadow-2xs"
                            title="പാസ്‌വേഡ് മാറ്റുക"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>പാസ്‌വേഡ് മാറ്റുക</span>
                          </button>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
                            title="വിവരങ്ങൾ തിരുത്തുക"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>എഡിറ്റ്</span>
                          </button>

                          {/* Status toggle */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`text-xs font-medium px-2 py-1 rounded hover:underline ${
                                u.isActive
                                  ? 'text-rose-600 hover:text-rose-800'
                                  : 'text-emerald-600 hover:text-emerald-800'
                              }`}
                            >
                              {u.isActive ? 'നിഷ്ക്രിയമാക്കുക' : 'സജീവമാക്കുക'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADMIN CHANGE PASSWORD ================= */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">പാസ്‌വേഡ് മാറ്റുക</h3>
                  <p className="text-xs text-slate-500">
                    {passwordUser.name} ({passwordUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPasswordUser(null)}
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

              <p className="text-xs text-slate-500">
                അഡ്മിൻ എന്ന നിലയിൽ നിങ്ങൾക്ക് ഈ ഉപയോക്താവിന് പഴയ പാസ്‌വേഡ് അറിയാതെ തന്നെ പുതിയ
                പാസ്‌വേഡ് നേരിട്ട് നൽകാവുന്നതാണ്.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പുതിയ പാസ്‌വേഡ് <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ"
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പാസ്‌വേഡ് ആവർത്തിക്കുക <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="മുകളിൽ നൽകിയ അതേ പാസ്‌വേഡ്"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'മാറ്റുന്നു...' : 'പാസ്‌വേഡ് സേവ് ചെയ്യുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER DETAILS ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">ഉപയോക്താവിനെ എഡിറ്റ് ചെയ്യുക</h3>
                  <p className="text-xs font-mono text-slate-500">{editingUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പൂർണ്ണ നാമം <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  റോൾ (Security Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="OPERATOR">{t.roles.OPERATOR}</option>
                  <option value="ADMIN">{t.roles.ADMIN}</option>
                  <option value="VIEWER">{t.roles.VIEWER}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  അക്കൗണ്ട് സ്റ്റാറ്റസ്
                </label>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="active">സജീവം (Active)</option>
                  <option value="inactive">നിഷ്ക്രിയം (Inactive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'സേവ് ചെയ്യുന്നു...' : 'മാറ്റങ്ങൾ സൂക്ഷിക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW USER ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">പുതിയ ഉപയോക്താവിനെ ചേർക്കുക</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പൂർണ്ണ നാമം <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ഉദാ: രാഹുൽ കെ"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  യൂസർനെയിം <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ഉദാ: rahul2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  പാസ്‌വേഡ് <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  റോൾ (Security Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="OPERATOR">{t.roles.OPERATOR}</option>
                  <option value="ADMIN">{t.roles.ADMIN}</option>
                  <option value="VIEWER">{t.roles.VIEWER}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'ചേർക്കുന്നു...' : 'ചേർക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersPage;
