import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  FileDown,
  Upload,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const StudentsPage: React.FC = () => {
  const { currentCampaign, refreshCampaigns } = useCampaign();
  const { isAdmin, token } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<any | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Form states
  const [studentCode, setStudentCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [targetCalendars, setTargetCalendars] = useState<number>(50);
  const [formError, setFormError] = useState<string | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importResult, setImportResult] = useState<any | null>(null);

  const fetchStudents = async () => {
    if (!currentCampaign) return;
    try {
      setIsLoading(true);
      const data = await api.get<any[]>(
        `/campaigns/${currentCampaign.id}/students${
          searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''
        }`
      );
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentCampaign?.id, searchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampaign) return;
    try {
      setFormError(null);
      await api.post(`/campaigns/${currentCampaign.id}/students`, {
        studentCode,
        name,
        targetCalendars,
      });
      setShowAddModal(false);
      setStudentCode('');
      setName('');
      setTargetCalendars(50);
      fetchStudents();
      refreshCampaigns();
    } catch (err: any) {
      setFormError(err.message || (language === 'en' ? 'Failed to add student' : 'കുട്ടിയെ ചേർക്കാൻ സാധിച്ചില്ല'));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampaign || !editingStudent) return;
    try {
      setFormError(null);
      await api.put(`/campaigns/${currentCampaign.id}/students/${editingStudent.studentId}`, {
        name,
        targetCalendars,
      });
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || (language === 'en' ? 'Failed to update student' : 'അപ്ഡേറ്റ് ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു'));
    }
  };

  const handleDeleteStudent = async () => {
    if (!currentCampaign || !deletingStudent) return;
    try {
      await api.delete(`/campaigns/${currentCampaign.id}/students/${deletingStudent.studentId}`);
      setDeletingStudent(null);
      fetchStudents();
      refreshCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleResetAll = async () => {
    if (!currentCampaign) return;
    try {
      setIsResetting(true);
      await api.post(`/campaigns/${currentCampaign.id}/reset-all`, {});
      setShowResetAllModal(false);
      await fetchStudents();
      await refreshCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to reset campaign');
    } finally {
      setIsResetting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!currentCampaign || !importText.trim()) return;
    try {
      setFormError(null);
      const lines = importText.trim().split('\n');
      const parsedStudents = lines.map((line) => {
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        return {
          studentCode: parts[0]?.trim(),
          name: parts[1]?.trim(),
          targetCalendars: parts[2] ? parseInt(parts[2].trim(), 10) : 50,
        };
      }).filter((s) => s.studentCode && s.name);

      const res = await api.post<any>(`/campaigns/${currentCampaign.id}/students/import`, {
        students: parsedStudents,
      });

      setImportResult(res);
      fetchStudents();
      refreshCampaigns();
      setTimeout(() => {
        setShowImportModal(false);
        setImportText('');
        setImportResult(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || (language === 'en' ? 'Import error' : 'ഇറക്കുമതി ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു'));
    }
  };

  const handleExcelExport = async () => {
    if (!currentCampaign) return;
    try {
      await api.downloadFile(
        `/reports/campaigns/${currentCampaign.id}/students/excel`,
        `Students_List.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">{t.nav.students}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en'
              ? 'Manage student participants and individual sales targets'
              : 'ക്യാമ്പയിനിൽ പങ്കാളികളായ വിദ്യാർത്ഥികളുടെ വിവരങ്ങളും നിശ്ചിത ടാർഗറ്റും'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setStudentCode(`S${String(students.length + 1).padStart(2, '0')}`);
                  setName('');
                  setTargetCalendars(50);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'en' ? 'Add Student' : 'കുട്ടിയെ ചേർക്കുക'}</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{t.common.importExcel}</span>
              </button>

              <button
                onClick={() => setShowResetAllModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                title={language === 'en' ? 'Reset and clear all students & sales' : 'എല്ലാ കുട്ടികളെയും വിൽപന വിവരങ്ങളും നീക്കം ചെയ്ത് ഫ്രഷായി തുടങ്ങുക'}
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>{language === 'en' ? 'Reset All (Fresh Start)' : 'പട്ടിക റീസെറ്റ് ചെയ്യുക'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Export List (Excel)' : 'ലിസ്റ്റ് ഡൗൺലോഡ് (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search by name or code...' : 'കുട്ടിയുടെ പേര് അല്ലെങ്കിൽ റോൾ നമ്പർ നൽകി തിരയുക...'}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {language === 'en' ? 'Total Students:' : 'ആകെ വിദ്യാർത്ഥികൾ:'} <strong>{students.length}</strong>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white select-none">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-16">#</th>
                <th className="py-3 px-4 font-semibold w-24">{t.common.studentCode}</th>
                <th className="py-3 px-4 font-semibold">{t.day1Cols.studentName}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.day1Cols.target}</th>
                <th className="py-3 px-4 font-semibold text-center">{language === 'en' ? 'Status' : 'നില'}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {language === 'en' ? 'Loading...' : 'ലോഡ് ചെയ്യുന്നു...'}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto text-center space-y-3">
                      <UserX className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-base font-semibold text-slate-700">
                        {language === 'en' ? 'No students registered in this campaign.' : 'ഈ ക്യാമ്പയിനിൽ വിദ്യാർത്ഥികളെ ചേർത്തിട്ടില്ല.'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {language === 'en'
                          ? 'Click "Add Student" to create individual records, or use "Import from Excel / CSV" to batch upload your student list.'
                          : 'പുതിയ വിദ്യാർത്ഥികളെ ചേർക്കാൻ മുകളിലെ "കുട്ടിയെ ചേർക്കുക" അല്ലെങ്കിൽ "Excel-ൽ നിന്ന് ഇറക്കുമതി ചെയ്യുക" ബട്ടൺ ഉപയോഗിക്കുക.'}
                      </p>
                      {isAdmin && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setStudentCode('S01');
                              setName('');
                              setTargetCalendars(50);
                              setShowAddModal(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                          >
                            + {language === 'en' ? 'Add First Student' : 'ആദ്യ വിദ്യാർത്ഥിയെ ചേർക്കുക'}
                          </button>
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300"
                          >
                            {language === 'en' ? 'Bulk Import Excel' : 'Excel വഴി ഒരുമിച്ച് ചേർക്കുക'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {student.studentCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50/40">
                      {student.targetCalendars}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                        {student.isActive ? t.common.active : t.common.inactive}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/students/${student.studentId}/history`)
                          }
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title={language === 'en' ? 'View 7-day sales log' : '7 ദിവസത്തെ വിൽപ്പന ചരിത്രം കാണുക'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setName(student.name);
                                setTargetCalendars(student.targetCalendars);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title={t.common.edit}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingStudent(student)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Add New Student' : 'പുതിയ കുട്ടിയെ ചേർക്കുക'}
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.common.studentCode}</label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="e.g. S41"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.day1Cols.studentName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'en' ? 'Student name' : 'ഉദാ: രാഹുൽ കൃഷ്ണ'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.day1Cols.target}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetCalendars}
                  onChange={(e) => setTargetCalendars(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {language === 'en' ? `Edit Student (${editingStudent.studentCode})` : `കുട്ടിയുടെ വിവരങ്ങൾ തിരുത്തുക (${editingStudent.studentCode})`}
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.day1Cols.studentName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.day1Cols.target}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetCalendars}
                  onChange={(e) => setTargetCalendars(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  {language === 'en' ? 'Update' : 'അപ്ഡേറ്റ് ചെയ്യുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              {language === 'en' ? 'Delete Student?' : 'കുട്ടിയെ നീക്കം ചെയ്യണമോ?'}
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4">
              <strong>{deletingStudent.studentCode} - {deletingStudent.name}</strong>
              <br />
              {language === 'en'
                ? 'This will remove the student from this campaign and delete their daily sales entries.'
                : 'ഈ കുട്ടിയെ ഈ ക്യാമ്പയിനിൽ നിന്നും അവരുടെ എല്ലാ ദിവസങ്ങളിലെയും വിൽപ്പന വിവരങ്ങളും പൂർണ്ണമായി നീക്കം ചെയ്യും.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {language === 'en' ? 'Yes, Delete' : 'അതെ, നീക്കം ചെയ്യുക'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Modal (Clear demo students & sales for fresh start) */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {language === 'en' ? 'Clear All Students & Data?' : 'പട്ടിക പൂർണ്ണമായി റീസെറ്റ് ചെയ്യണോ?'}
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4 leading-relaxed">
              {language === 'en'
                ? 'This will delete ALL existing students and sales entries from this campaign so you can start completely fresh with your own real student roster and targets.'
                : 'നിലവിലെ ഡെമോ വിദ്യാർത്ഥികളുടെ പേരുകളും 7 ദിവസത്തെ എല്ലാ വിൽപ്പന വിവരങ്ങളും ഈ ക്യാമ്പയിനിൽ നിന്ന് പൂർണ്ണമായി മായ്ക്കപ്പെടും. അതിനുശേഷം നിങ്ങളുടെ യഥാർത്ഥ വിദ്യാർത്ഥികളുടെ പേരുകളും ടാർഗറ്റും പുതിയതായി ചേർക്കാം.'}
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-2xs text-amber-900 mb-5">
              ⚠️ {language === 'en' ? 'This action cannot be undone.' : 'ശ്രദ്ധിക്കുക: ഈ മാറ്റം പിന്നീട് തിരിച്ചെടുക്കാൻ സാധിക്കില്ല.'}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isResetting}
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={isResetting}
                onClick={handleResetAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {isResetting
                  ? (language === 'en' ? 'Clearing...' : 'റീസെറ്റ് ചെയ്യുന്നു...')
                  : (language === 'en' ? 'Confirm Reset (Start Fresh)' : 'അതെ, ഫ്രഷായി തുടങ്ങുക')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t.common.importExcel}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'en'
                ? 'Copy and paste from Excel or CSV. Format: Roll No, Name, Target (one per line)'
                : 'Excel-ൽ നിന്നോ CSV ഫയലിൽ നിന്നോ നേരിട്ട് കോപ്പി ചെയ്തു ഇവിടെ പേസ്റ്റ് ചെയ്യുക. ഫോർമാറ്റ്: റോൾ നമ്പർ, പേര്, ടാർഗറ്റ്'}
            </p>

            {importResult && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-300 font-medium">
                {importResult.message}! ({importResult.importedCount} {language === 'en' ? 'added' : 'പേരെ ചേർത്തു'}, {importResult.updatedCount} {language === 'en' ? 'updated' : 'പേരെ അപ്ഡേറ്റ് ചെയ്തു'})
              </div>
            )}

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`S01, അനീഷ് കുമാർ, 50\nS02, ലക്ഷ്മി പ്രിയ, 60\nS03, മനു കൃഷ്ണൻ, 45`}
              className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {language === 'en' ? 'Confirm Import' : 'ഇറക്കുമതി സ്ഥിരീകരിക്കുക'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
