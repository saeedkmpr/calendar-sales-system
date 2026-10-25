import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Check,
  Ban,
  Trash2,
  RotateCcw,
  AlertTriangle,
  UserX,
  Upload,
  Edit2,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const CampaignsPage: React.FC = () => {
  const { campaigns, currentCampaign, setCurrentCampaign, refreshCampaigns } = useCampaign();
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [calendarPrice, setCalendarPrice] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('2026-11-01');
  const [endDate, setEndDate] = useState<string>('2026-11-07');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Helper functions to auto-calculate days from dates and vice-versa
  const calcDuration = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 7;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 7;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const calcEndDate = (startStr: string, days: number): string => {
    if (!startStr || isNaN(days) || days < 1) return startStr;
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return startStr;
    start.setDate(start.getDate() + days - 1);
    return start.toISOString().slice(0, 10);
  };

  // Edit Campaign state
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editInstitutionName, setEditInstitutionName] = useState<string>('');
  const [editCalendarPrice, setEditCalendarPrice] = useState<number>(100);
  const [editStartDate, setEditStartDate] = useState<string>('2026-11-01');
  const [editEndDate, setEditEndDate] = useState<string>('2026-11-07');
  const [editDurationDays, setEditDurationDays] = useState<number>(7);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleOpenEdit = (c: any) => {
    setEditingCampaign(c);
    setEditName(c.name);
    setEditInstitutionName(c.institutionName || '');
    setEditCalendarPrice(c.calendarPrice || 100);
    const sDate = c.startDate ? c.startDate.slice(0, 10) : '2026-11-01';
    const eDate = c.endDate ? c.endDate.slice(0, 10) : '2026-11-07';
    setEditStartDate(sDate);
    setEditEndDate(eDate);
    const computedDays = calcDuration(sDate, eDate);
    setEditDurationDays(c.durationDays || computedDays || 7);
    setEditDescription(c.description || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      setIsUpdating(true);
      setEditError(null);
      const updated = await api.put<any>(`/campaigns/${editingCampaign.id}`, {
        name: editName,
        institutionName: editInstitutionName,
        calendarPrice: editCalendarPrice,
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
        durationDays: editDurationDays,
        description: editDescription,
      });

      if (currentCampaign?.id === editingCampaign.id) {
        setCurrentCampaign({
          ...currentCampaign,
          ...updated,
        });
      }

      setEditingCampaign(null);
      await refreshCampaigns();
    } catch (err: any) {
      setEditError(err.message || (language === 'en' ? 'Failed to update campaign' : 'ക്യാമ്പയിൻ അപ്ഡേറ്റ് ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'delete' | 'reset-sales' | 'reset-all';
    campaign: any;
  } | null>(null);

  // Excel Workbook import modal state
  const [showWorkbookModal, setShowWorkbookModal] = useState<boolean>(false);
  const [workbookText, setWorkbookText] = useState<string>('');
  const [isImportingWorkbook, setIsImportingWorkbook] = useState<boolean>(false);
  const [workbookResult, setWorkbookResult] = useState<string | null>(null);

  const handleWorkbookImport = async () => {
    if (!currentCampaign || !workbookText.trim()) return;
    try {
      setIsImportingWorkbook(true);
      setWorkbookResult(null);
      const res = await api.post<any>(`/campaigns/${currentCampaign.id}/import-workbook`, {
        text: workbookText,
      });
      setWorkbookResult(res.message);
      await refreshCampaigns();
      setTimeout(() => {
        setShowWorkbookModal(false);
        setWorkbookText('');
        setWorkbookResult(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'ഇറക്കുമതി പരാജയപ്പെട്ടു');
    } finally {
      setIsImportingWorkbook(false);
    }
  };

  const handleWorkbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setWorkbookText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post('/campaigns', {
        name,
        institutionName,
        calendarPrice,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        durationDays,
        description,
        currency: '₹',
        status: 'ACTIVE',
      });
      setShowModal(false);
      setName('');
      setInstitutionName('');
      await refreshCampaigns();
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to create campaign' : 'ക്യാമ്പയിൻ സൃഷ്ടിക്കാൻ സാധിച്ചില്ല'));
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, campaign } = confirmAction;

    try {
      if (type === 'cancel') {
        await api.post(`/campaigns/${campaign.id}/cancel`, {});
      } else if (type === 'delete') {
        await api.delete(`/campaigns/${campaign.id}`);
      } else if (type === 'reset-sales') {
        await api.post(`/campaigns/${campaign.id}/reset-sales`, {});
      } else if (type === 'reset-all') {
        await api.post(`/campaigns/${campaign.id}/reset-all`, {});
      }

      setConfirmAction(null);
      await refreshCampaigns();
    } catch (err: any) {
      alert(err.message || 'Error executing action');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">{t.nav.campaigns}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'en'
              ? 'Manage sales campaigns across academic terms and batches'
              : 'വിവിധ സ്കൂൾ വർഷങ്ങളിലെയും ബാച്ചുകളിലെയും വിൽപ്പന ക്യാമ്പയിനുകൾ'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWorkbookModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
              title={language === 'en' ? 'Import entire Excel workbook with all sheets' : 'മുഴുവൻ എക്സൽ ഷീറ്റുകളും ഒരുമിച്ച് ഇറക്കുമതി ചെയ്യുക'}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{language === 'en' ? 'Import Excel Workbook' : 'എക്സൽ വർക്ക്ബുക്ക് ഇറക്കുമതി'}</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'New Campaign' : 'പുതിയ ക്യാമ്പയിൻ ആരംഭിക്കുക'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const isSelected = currentCampaign?.id === c.id;
          const isCancelled = c.status === 'CANCELLED';

          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                isCancelled
                  ? 'border-red-200 bg-red-50/20 opacity-80'
                  : isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isCancelled
                          ? 'bg-red-100 text-red-800'
                          : c.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCancelled
                        ? (language === 'en' ? 'Cancelled' : 'റദ്ദാക്കിയത്')
                        : c.status === 'ACTIVE'
                        ? t.common.active
                        : (language === 'en' ? 'Completed' : 'പൂർത്തിയായത്')}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <Check className="w-3.5 h-3.5" /> {language === 'en' ? 'Current' : 'നിലവിലുള്ളത്'}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                      title={language === 'en' ? 'Edit Campaign Details' : 'ക്യാമ്പയിൻ വിവരങ്ങൾ തിരുത്തുക'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{c.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{c.institutionName || 'Institution'}</p>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span>{language === 'en' ? 'Price:' : 'കലണ്ടർ വില:'}</span>
                    <strong className="text-slate-800">{c.currency}{c.calendarPrice}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{language === 'en' ? 'Duration:' : 'ദിവസങ്ങൾ:'}</span>
                    <strong className="text-slate-800">{c.durationDays} {language === 'en' ? 'Days' : 'ദിവസങ്ങൾ'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{language === 'en' ? 'Students:' : 'ആകെ കുട്ടികൾ:'}</span>
                    <strong className="text-slate-800">{c.studentCount || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setCurrentCampaign(c)}
                  disabled={isSelected}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSelected
                    ? (language === 'en' ? 'Selected' : 'തിരഞ്ഞെടുത്തിരിക്കുന്നു')
                    : (language === 'en' ? 'Switch to this campaign' : 'ഈ ക്യാമ്പയിനിലേക്ക് മാറുക')}
                </button>

                {isAdmin && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {/* Edit Details */}
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="col-span-2 p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-2xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title={language === 'en' ? 'Edit Campaign Details' : 'ക്യാമ്പയിൻ വിവരങ്ങൾ തിരുത്തുക'}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'en' ? 'Edit Details (Name, Price...)' : 'വിവരങ്ങൾ തിരുത്തുക (പേര്, വില...)'}</span>
                    </button>

                    {/* Reset Sales */}
                    <button
                      onClick={() => setConfirmAction({ type: 'reset-sales', campaign: c })}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-2xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title={language === 'en' ? 'Reset entered sales back to 0' : 'വിൽപന വിവരങ്ങൾ പൂജ്യമാക്കി മാറ്റുക'}
                    >
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      <span>{language === 'en' ? 'Reset Sales' : 'വിൽപന റീസെറ്റ്'}</span>
                    </button>

                    {/* Reset All & Clear Students */}
                    <button
                      onClick={() => setConfirmAction({ type: 'reset-all', campaign: c })}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-2xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title={language === 'en' ? 'Clear sales and students for fresh start' : 'കുട്ടികളെ ഒഴിവാക്കി ഫ്രഷായി തുടങ്ങുക'}
                    >
                      <UserX className="w-3 h-3 text-rose-600" />
                      <span>{language === 'en' ? 'Clear & Fresh' : 'ഫ്രഷ് സ്റ്റാർട്ട്'}</span>
                    </button>

                    {/* Cancel Campaign */}
                    {!isCancelled && (
                      <button
                        onClick={() => setConfirmAction({ type: 'cancel', campaign: c })}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-2xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        title={language === 'en' ? 'Mark campaign as cancelled' : 'ക്യാമ്പയിൻ റദ്ദാക്കുക'}
                      >
                        <Ban className="w-3 h-3 text-slate-500" />
                        <span>{language === 'en' ? 'Cancel' : 'റദ്ദാക്കുക'}</span>
                      </button>
                    )}

                    {/* Delete Campaign */}
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', campaign: c })}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-2xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title={language === 'en' ? 'Delete campaign completely' : 'പൂർണ്ണമായി നീക്കം ചെയ്യുക'}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>{language === 'en' ? 'Delete' : 'ഡിലീറ്റ്'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                {confirmAction.type === 'cancel'
                  ? (language === 'en' ? 'Cancel Campaign' : 'ക്യാമ്പയിൻ റദ്ദാക്കുക')
                  : confirmAction.type === 'delete'
                  ? (language === 'en' ? 'Delete Campaign' : 'ക്യാമ്പയിൻ പൂർണ്ണമായി നീക്കം ചെയ്യുക')
                  : confirmAction.type === 'reset-sales'
                  ? (language === 'en' ? 'Reset All Sales Data' : 'വിൽപന വിവരങ്ങൾ റീസെറ്റ് ചെയ്യുക')
                  : (language === 'en' ? 'Reset All & Clear Students' : 'ഡാറ്റ റീസെറ്റ് ചെയ്ത് ഫ്രഷായി തുടങ്ങുക')}
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {confirmAction.type === 'cancel'
                ? (language === 'en'
                    ? `Are you sure you want to mark "${confirmAction.campaign.name}" as cancelled?`
                    : `"${confirmAction.campaign.name}" എന്ന ക്യാമ്പയിൻ റദ്ദാക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?`)
                : confirmAction.type === 'delete'
                ? (language === 'en'
                    ? `Are you sure you want to permanently delete "${confirmAction.campaign.name}"? All 7-day sales and student targets linked to this campaign will be removed.`
                    : `"${confirmAction.campaign.name}" എന്ന ക്യാമ്പയിൻ പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യണോ? ഇതിലുള്ള 7 ദിവസത്തെ എല്ലാ വിൽപ്പന വിവരങ്ങളും നഷ്ടപ്പെടും.`)
                : confirmAction.type === 'reset-sales'
                ? (language === 'en'
                    ? `This will reset all 7 days of sales entries to 0 for "${confirmAction.campaign.name}". The student list and targets will remain intact.`
                    : `ഈ ക്യാമ്പയിനിലെ 7 ദിവസത്തെ എല്ലാ വിൽപ്പന വിവരങ്ങളും പൂജ്യമാക്കി മാറ്റപ്പെടും. കുട്ടികളുടെ പേരും ടാർഗറ്റും നിലനിൽക്കും.`)
                : (language === 'en'
                    ? `This will remove all 7 days of sales AND clear all students from "${confirmAction.campaign.name}" so you can import/add your fresh student roster.`
                    : `ഈ ക്യാമ്പയിനിലെ എല്ലാ വിൽപ്പന വിവരങ്ങളും കുട്ടികളുടെ പട്ടികയും ക്ലിയർ ചെയ്യപ്പെടും. നിങ്ങൾക്ക് പുതിയ കുട്ടികളുടെ ലിസ്റ്റ് പുതുതായി ചേർക്കാൻ സാധിക്കും.`)}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 text-white rounded-lg font-bold text-xs sm:text-sm ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {language === 'en' ? 'Yes, Proceed' : 'അതെ, സ്ഥിരീകരിക്കുക'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Create New Campaign' : 'പുതിയ ക്യാമ്പയിൻ സൃഷ്ടിക്കുക'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Campaign Name' : 'ക്യാമ്പയിൻ പേര്'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'en' ? 'Calendar Sales 2026' : 'ഉദാ: കലണ്ടർ വിൽപന 2026'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Institution Name' : 'സ്ഥാപനത്തിന്റെ പേര്'}
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder={language === 'en' ? 'Model School' : 'ഉദാ: മോഡൽ സ്കൂൾ'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Start Date' : 'ആരംഭ തീയതി'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setStartDate(newStart);
                      if (newStart && endDate) {
                        setDurationDays(calcDuration(newStart, endDate));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'End Date' : 'അവസാന തീയതി'}
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setEndDate(newEnd);
                      if (startDate && newEnd) {
                        setDurationDays(calcDuration(startDate, newEnd));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Price (₹)' : 'കലണ്ടർ വില (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={calendarPrice}
                    onChange={(e) => setCalendarPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Duration (Days)' : 'ആകെ ദിവസങ്ങൾ'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={durationDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const days = !isNaN(val) && val >= 1 ? val : 1;
                      setDurationDays(days);
                      if (startDate) {
                        setEndDate(calcEndDate(startDate, days));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-800 bg-emerald-50/40"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>
                  {language === 'en' ? 'Total Days calculated:' : 'കണക്കാക്കിയ ആകെ ദിവസങ്ങൾ:'}{' '}
                  <strong>{durationDays} {language === 'en' ? 'Days' : 'ദിവസം'}</strong>
                </span>
                <span className="text-2xs text-emerald-700 font-medium">
                  {language === 'en' ? '(Auto-generates Day tabs)' : '(അത്രയും ഡേ ടാബുകൾ വരും)'}
                </span>
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
                  {language === 'en' ? 'Create' : 'തുടങ്ങുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-600" />
              <span>{language === 'en' ? 'Edit Campaign Details' : 'ക്യാമ്പയിൻ വിവരങ്ങൾ തിരുത്തുക'}</span>
            </h3>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Campaign Name' : 'ക്യാമ്പയിൻ പേര്'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Institution / Organization' : 'സ്ഥാപനത്തിന്റെ പേര്'}
                </label>
                <input
                  type="text"
                  value={editInstitutionName}
                  onChange={(e) => setEditInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Start Date' : 'ആരംഭ തീയതി'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditStartDate(newStart);
                      if (newStart && editEndDate) {
                        setEditDurationDays(calcDuration(newStart, editEndDate));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'End Date' : 'അവസാന തീയതി'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setEditEndDate(newEnd);
                      if (editStartDate && newEnd) {
                        setEditDurationDays(calcDuration(editStartDate, newEnd));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Calendar Price (₹)' : 'കലണ്ടർ വില (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editCalendarPrice}
                    onChange={(e) => setEditCalendarPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Duration (Days)' : 'ആകെ ദിവസങ്ങൾ'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editDurationDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const days = !isNaN(val) && val >= 1 ? val : 1;
                      setEditDurationDays(days);
                      if (editStartDate) {
                        setEditEndDate(calcEndDate(editStartDate, days));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-800 bg-emerald-50/40"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>
                  {language === 'en' ? 'Total Days calculated:' : 'കണക്കാക്കിയ ആകെ ദിവസങ്ങൾ:'}{' '}
                  <strong>{editDurationDays} {language === 'en' ? 'Days' : 'ദിവസം'}</strong>
                </span>
                <span className="text-2xs text-emerald-700 font-medium">
                  {language === 'en' ? '(Auto-generates Day tabs)' : '(അത്രയും ഡേ ടാബുകൾ വരും)'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Description (Optional)' : 'വിവരണം'}
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  {isUpdating
                    ? (language === 'en' ? 'Saving...' : 'സേവ് ചെയ്യുന്നു...')
                    : (language === 'en' ? 'Save Changes' : 'സേവ് ചെയ്യുക')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Full Workbook Modal */}
      {showWorkbookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'en' ? 'Import Full Excel / CSV Workbook' : 'മുഴുവൻ എക്സൽ വർക്ക്ബുക്ക് ഇറക്കുമതി ചെയ്യുക'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {language === 'en'
                ? 'Paste the full spreadsheet text with "Student List" and "Day 1", "Day 2", "Day 3" sections, or upload a .csv/.txt file.'
                : 'നിങ്ങളുടെ Excel വർക്ക്ബുക്കിലെ കുട്ടികളുടെ പട്ടികയും 7 ദിവസങ്ങളിലെയും വിൽപ്പന കണക്കുകളും അടങ്ങിയ മുഴുവൻ വിവരങ്ങളും താഴെ പേസ്റ്റ് ചെയ്യുക അല്ലെങ്കിൽ ഫയൽ അപ്‌ലോഡ് ചെയ്യുക.'}
            </p>

            {workbookResult && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-300 font-medium">
                {workbookResult}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                {language === 'en' ? 'Upload .csv or .txt file:' : 'CSV അല്ലെങ്കിൽ TXT ഫയൽ അപ്‌ലോഡ് ചെയ്യാം:'}
              </label>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleWorkbookFileChange}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <textarea
              rows={12}
              value={workbookText}
              onChange={(e) => setWorkbookText(e.target.value)}
              placeholder={`കുട്ടികളുടെ പട്ടിക\nക്രമം,കുട്ടിയുടെ പേര്,ടാർഗറ്റ്\n1,നുഅ്മാൻ പടപ്പറമ്പ്,250\n\nദിവസം 1 — കലണ്ടർ വിൽപ്പന\nകുട്ടിയുടെ പേര്,ടാർഗറ്റ്,കൊണ്ടുപോയ കലണ്ടർ,വിറ്റ കലണ്ടർ,ബാക്കി കലണ്ടർ,ലഭിച്ച കാശ്,ചെലവ്\nനാജി പൂന്താനം,250,60,40,20,3346,226`}
              className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isImportingWorkbook}
                onClick={() => setShowWorkbookModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                disabled={isImportingWorkbook || !workbookText.trim()}
                onClick={handleWorkbookImport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs sm:text-sm"
              >
                {isImportingWorkbook
                  ? (language === 'en' ? 'Importing Workbook...' : 'ഇറക്കുമതി ചെയ്യുന്നു...')
                  : (language === 'en' ? 'Confirm Full Import' : 'മുഴുവൻ ഡാറ്റയും ഇറക്കുമതി ചെയ്യുക')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
