import React, { useState, useEffect } from 'react';
import {
  Tent,
  Plus,
  Users,
  Search,
  FileDown,
  Printer,
  Trash2,
  Edit3,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  MapPin,
  UserCheck,
  Building,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface CampTotals {
  totalTarget: number;
  totalTargetRemaining: number;
  totalTaken: number;
  totalSold: number;
  totalRemainingStock: number;
  totalCashReceived: number;
  totalExpenses: number;
  totalNetCash: number;
  weightedAverage: number;
  progressPercentage: number;
}

interface CampStudent {
  rank: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  target: number;
  targetRemaining: number;
  calendarsTaken: number;
  calendarsSold: number;
  remainingStock: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  average: number;
  progressPercentage: number;
  isTargetCompleted: boolean;
}

interface CampData {
  id: string;
  campaignId: string;
  name: string;
  location?: string | null;
  leaderName?: string | null;
  notes?: string | null;
  studentCount: number;
  totals: CampTotals;
  students: CampStudent[];
}

export const CampsPage: React.FC = () => {
  const { currentCampaign } = useCampaign();
  const { isAdmin, isOperator } = useAuth();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [camps, setCamps] = useState<CampData[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<CampStudent[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview'); // 'overview' | campId
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showNewStudentModal, setShowNewStudentModal] = useState<boolean>(false);
  const [deletingCamp, setDeletingCamp] = useState<CampData | null>(null);

  // Form states
  const [campName, setCampName] = useState<string>('');
  const [campLocation, setCampLocation] = useState<string>('');
  const [campLeader, setCampLeader] = useState<string>('');
  const [campNotes, setCampNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Add existing student state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>('');

  // Register new student state
  const [newStudentCode, setNewStudentCode] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentTarget, setNewStudentTarget] = useState<number>(50);

  const fetchCamps = async () => {
    if (!currentCampaign) return;
    try {
      setIsLoading(true);
      const res = await api.get<any>(`/campaigns/${currentCampaign.id}/camps`);
      const campList = res.camps || [];
      setCamps(campList);
      setUnassignedStudents(res.unassignedStudents || []);

      // If activeTab is an ID that no longer exists, default to 'overview'
      if (activeTab !== 'overview' && !campList.some((c: CampData) => c.id === activeTab)) {
        setActiveTab('overview');
      }
    } catch (err: any) {
      console.error('Failed to load camps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [currentCampaign?.id]);

  const activeCamp = camps.find((c) => c.id === activeTab);

  // Grand summary across all camps
  const allCampsSummary = camps.reduce(
    (acc, camp) => {
      acc.totalStudents += camp.studentCount;
      acc.totalTarget += camp.totals.totalTarget;
      acc.totalTargetRemaining += camp.totals.totalTargetRemaining;
      acc.totalTaken += camp.totals.totalTaken;
      acc.totalSold += camp.totals.totalSold;
      acc.totalStock += camp.totals.totalRemainingStock;
      acc.totalCash += camp.totals.totalCashReceived;
      acc.totalExpenses += camp.totals.totalExpenses;
      acc.totalNetCash += camp.totals.totalNetCash;
      return acc;
    },
    {
      totalStudents: 0,
      totalTarget: 0,
      totalTargetRemaining: 0,
      totalTaken: 0,
      totalSold: 0,
      totalStock: 0,
      totalCash: 0,
      totalExpenses: 0,
      totalNetCash: 0,
    }
  );

  const grandProgress =
    allCampsSummary.totalTarget > 0
      ? Math.min(
          100,
          Math.round((allCampsSummary.totalSold / allCampsSummary.totalTarget) * 100)
        )
      : 0;

  // Handlers for Camp CRUD
  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampaign) return;
    if (!campName.trim()) {
      setFormError('ക്യാമ്പിന്റെ പേര് ആവശ്യമാണ്');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await api.post<CampData>(`/campaigns/${currentCampaign.id}/camps`, {
        name: campName.trim(),
        location: campLocation.trim(),
        leaderName: campLeader.trim(),
        notes: campNotes.trim(),
      });
      setShowCreateModal(false);
      setCampName('');
      setCampLocation('');
      setCampLeader('');
      setCampNotes('');
      await fetchCamps();
      setActiveTab(res.id);
    } catch (err: any) {
      setFormError(err.message || 'ക്യാമ്പ് ഉണ്ടാക്കുന്നതിൽ പരാജയപ്പെട്ടു');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditCamp = () => {
    if (!activeCamp) return;
    setCampName(activeCamp.name);
    setCampLocation(activeCamp.location || '');
    setCampLeader(activeCamp.leaderName || '');
    setCampNotes(activeCamp.notes || '');
    setFormError(null);
    setShowEditModal(true);
  };

  const handleUpdateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp) return;
    if (!campName.trim()) {
      setFormError('ക്യാമ്പിന്റെ പേര് ആവശ്യമാണ്');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.put(`/camps/${activeCamp.id}`, {
        name: campName.trim(),
        location: campLocation.trim(),
        leaderName: campLeader.trim(),
        notes: campNotes.trim(),
      });
      setShowEditModal(false);
      await fetchCamps();
    } catch (err: any) {
      setFormError(err.message || 'ക്യാമ്പ് വിവരങ്ങൾ മാറ്റാൻ കഴിഞ്ഞില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCamp = async () => {
    if (!deletingCamp) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/camps/${deletingCamp.id}`);
      setDeletingCamp(null);
      if (activeTab === deletingCamp.id) {
        setActiveTab('overview');
      }
      await fetchCamps();
    } catch (err: any) {
      alert(err.message || 'ക്യാമ്പ് ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add existing student
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp || !selectedStudentId) {
      setFormError('വിദ്യാർത്ഥിയെ തിരഞ്ഞെടുക്കുക');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.post(`/camps/${activeCamp.id}/students`, {
        studentId: selectedStudentId,
      });
      setShowAddStudentModal(false);
      setSelectedStudentId('');
      setStudentSearchFilter('');
      await fetchCamps();
    } catch (err: any) {
      setFormError(err.message || 'വിദ്യാർത്ഥിയെ ക്യാമ്പിലേക്ക് ചേർക്കാൻ കഴിഞ്ഞില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register brand new student to camp
  const handleRegisterNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp) return;
    if (!newStudentCode.trim() || !newStudentName.trim()) {
      setFormError('കോഡും പേരും ആവശ്യമാണ്');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.post(`/camps/${activeCamp.id}/new-student`, {
        studentCode: newStudentCode.trim(),
        name: newStudentName.trim(),
        targetCalendars: newStudentTarget || 50,
      });
      setShowNewStudentModal(false);
      setNewStudentCode('');
      setNewStudentName('');
      setNewStudentTarget(50);
      await fetchCamps();
    } catch (err: any) {
      setFormError(err.message || 'പുതിയ കുട്ടിയെ ചേർക്കാൻ കഴിഞ്ഞില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove student from camp
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!activeCamp) return;
    const confirm = window.confirm(
      `"${studentName}" എന്ന വിദ്യാർത്ഥിയെ ${activeCamp.name} ക്യാമ്പിൽ നിന്ന് ഒഴിവാക്കണോ? വിദ്യാർത്ഥിയുടെ വിവരങ്ങൾ പൂർണ്ണമായി ഇല്ലാതാകില്ല.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/camps/${activeCamp.id}/students/${studentId}`);
      await fetchCamps();
    } catch (err: any) {
      alert(err.message || 'വിദ്യാർത്ഥിയെ ക്യാമ്പിൽ നിന്ന് ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല');
    }
  };

  // Export handlers
  const handleExcelExport = async (campId: string, campNameStr: string) => {
    try {
      await api.downloadFile(
        `/camps/${campId}/export/excel`,
        `${currentCampaign?.name || 'Campaign'}_${campNameStr}_Report.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Filter students in active camp
  const filteredStudents = (activeCamp?.students || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q);
  });

  // Filter unassigned students for dropdown
  const filteredUnassigned = unassignedStudents.filter((s) => {
    if (!studentSearchFilter.trim()) return true;
    const q = studentSearchFilter.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q);
  });

  const currency = currentCampaign?.currency || '₹';

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center text-slate-500">
        ദയവായി ഒരു ക്യാമ്പയിൻ തിരഞ്ഞെടുക്കുക.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Tent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>ടീം ക്യാമ്പുകൾ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {camps.length} ക്യാമ്പുകൾ
                </span>
              </h1>
              <p className="text-sm text-slate-500">
                ക്യാമ്പ് തിരിച്ചുള്ള കലണ്ടർ വിൽപന, കുട്ടികളുടെ മാനേജ്‌മെന്റ് & താരതമ്യം
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || isOperator) && (
            <button
              onClick={() => {
                setCampName('');
                setCampLocation('');
                setCampLeader('');
                setCampNotes('');
                setFormError(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>പുതിയ ക്യാമ്പ് ചേർക്കുക</span>
            </button>
          )}

          <button
            onClick={handleNativePrint}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            title="A4 ലാൻഡ്‌സ്‌കേപ്പ് പ്രിന്റ് / PDF ആയി സേവ് ചെയ്യുക"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>പ്രിന്റ് / PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 print:hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>എല്ലാ ക്യാമ്പുകളും (സംഗ്രഹം)</span>
          <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
            {camps.length}
          </span>
        </button>

        {camps.map((camp) => (
          <button
            key={camp.id}
            onClick={() => setActiveTab(camp.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === camp.id
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Tent className="w-4 h-4" />
            <span>{camp.name}</span>
            <span
              className={`ml-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                activeTab === camp.id
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {camp.studentCount} കുട്ടികൾ
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          വിവരങ്ങൾ ശേഖരിക്കുന്നു... ദയവായി കാത്തിരിക്കുക.
        </div>
      ) : activeTab === 'overview' ? (
        /* ================= OVERVIEW TAB: COMPARISON & SUMMARY ================= */
        <div className="space-y-6">
          {/* Top KPI Cards for All Camps */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">ക്യാമ്പ് കുട്ടികൾ</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {allCampsSummary.totalStudents}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                ഒഴിവുള്ളവർ: {unassignedStudents.length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">ആകെ ലക്ഷ്യം</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {allCampsSummary.totalTarget}
              </div>
              <div className="text-xs text-indigo-500 mt-0.5">
                ബാക്കി: {allCampsSummary.totalTargetRemaining}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">കൊണ്ടുപോയത്</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {allCampsSummary.totalTaken}
              </div>
              <div className="text-xs text-blue-500 mt-0.5">കലണ്ടറുകൾ</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">വിറ്റത്</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {allCampsSummary.totalSold}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                {grandProgress}% പൂർത്തിയായി
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">ബാക്കി സ്റ്റോക്ക്</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {allCampsSummary.totalStock}
              </div>
              <div className="text-xs text-amber-500 mt-0.5">കലണ്ടറുകൾ</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              <div className="text-xs font-semibold text-emerald-800 uppercase">ആകെ ബാക്കി തുക</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {currency} {allCampsSummary.totalNetCash.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                ലഭിച്ചത്: {currency} {allCampsSummary.totalCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Camp Cards Comparison */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>ക്യാമ്പുകളുടെ താരതമ്യം</span>
                <span className="text-xs font-normal text-slate-500">
                  (ഓരോ ക്യാമ്പിന്റെയും പ്രകടനം താഴെ കാണാം)
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {camps.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{camp.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {camp.studentCount} കുട്ടികൾ
                          </span>
                        </div>
                        {camp.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{camp.location}</span>
                          </div>
                        )}
                        {camp.leaderName && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>ഇൻചാർജ്: {camp.leaderName}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveTab(camp.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span>കണക്കുകൾ കാണുക</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Inside Camp Card */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>ലക്ഷ്യം: {camp.totals.totalTarget}</span>
                        <span className="font-bold text-emerald-700">
                          {camp.totals.totalSold} വിറ്റു ({camp.totals.progressPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${camp.totals.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">കൊണ്ടുപോയത്</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">
                          {camp.totals.totalTaken}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">വിറ്റത്</div>
                        <div className="text-base font-bold text-emerald-700 mt-0.5">
                          {camp.totals.totalSold}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">ബാക്കി സ്റ്റോക്ക്</div>
                        <div className="text-base font-bold text-amber-600 mt-0.5">
                          {camp.totals.totalRemainingStock}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">ലഭിച്ച തുക</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {currency} {camp.totals.totalCashReceived.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">ചിലവ്</div>
                        <div className="text-sm font-bold text-rose-600 mt-0.5">
                          {currency} {camp.totals.totalExpenses.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <div className="text-[11px] font-semibold text-emerald-800 uppercase">ആകെ തുക</div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">
                          {currency} {camp.totals.totalNetCash.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>ശരാശരി: {currency} {camp.totals.weightedAverage} / കലണ്ടർ</span>
                    <button
                      onClick={() => handleExcelExport(camp.id, camp.name)}
                      className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Excel ഡൗൺലോഡ്</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeCamp ? (
        /* ================= INDIVIDUAL CAMP VIEW ================= */
        <div className="space-y-6">
          {/* Camp Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <Tent className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{activeCamp.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                      {activeCamp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeCamp.location}</span>
                        </span>
                      )}
                      {activeCamp.leaderName && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>ഇൻചാർജ്: {activeCamp.leaderName}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {activeCamp.studentCount} കുട്ടികൾ
                      </span>
                    </div>
                  </div>
                </div>
                {activeCamp.notes && (
                  <p className="text-xs text-slate-500 mt-2 italic pl-11">{activeCamp.notes}</p>
                )}
              </div>

              {/* Action buttons for camp */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {(isAdmin || isOperator) && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedStudentId('');
                        setStudentSearchFilter('');
                        setFormError(null);
                        setShowAddStudentModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>+ നിലവിലുള്ള കുട്ടിയെ ചേർക്കുക</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewStudentCode('');
                        setNewStudentName('');
                        setNewStudentTarget(50);
                        setFormError(null);
                        setShowNewStudentModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ പുതിയ കുട്ടിയെ രജിസ്റ്റർ ചെയ്യുക</span>
                    </button>

                    <button
                      onClick={handleOpenEditCamp}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      title="ക്യാമ്പ് എഡിറ്റ് ചെയ്യുക"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>എഡിറ്റ്</span>
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setDeletingCamp(activeCamp)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    title="ക്യാമ്പ് റദ്ദാക്കുക"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ഡിലീറ്റ്</span>
                  </button>
                )}

                <button
                  onClick={() => handleExcelExport(activeCamp.id, activeCamp.name)}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="Excel ഡൗൺലോഡ്"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Camp KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">ആകെ ലക്ഷ്യം</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                {activeCamp.totals.totalTarget}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                ബാക്കി: {activeCamp.totals.totalTargetRemaining}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">കൊണ്ടുപോയത്</div>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {activeCamp.totals.totalTaken}
              </div>
              <div className="text-[11px] text-blue-400 mt-0.5">കലണ്ടറുകൾ</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">വിറ്റത്</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {activeCamp.totals.totalSold}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {activeCamp.totals.progressPercentage}% പൂർത്തിയായി
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">ബാക്കി സ്റ്റോക്ക്</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {activeCamp.totals.totalRemainingStock}
              </div>
              <div className="text-[11px] text-amber-500 mt-0.5">കലണ്ടറുകൾ</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">ലഭിച്ച കാശ്</div>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {currency} {activeCamp.totals.totalCashReceived.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">ആകെ പിരിവ്</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">ചിലവ്</div>
              <div className="text-xl font-bold text-rose-600 mt-1">
                {currency} {activeCamp.totals.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-rose-400 mt-0.5">ആകെ ചിലവ്</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-sm text-center col-span-2 md:col-span-1">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase">ആകെ തുക</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {currency} {activeCamp.totals.totalNetCash.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                ശരാശരി: {currency} {activeCamp.totals.weightedAverage}
              </div>
            </div>
          </div>

          {/* Student Leaderboard Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filter bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeCamp.name} - കുട്ടികളുടെ പട്ടിക & റാങ്കിംഗ്
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {filteredStudents.length} കുട്ടികൾ
                </span>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="പേരോ കോഡോ നൽകി തിരയുക..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-12">റാങ്ക്</th>
                    <th className="py-3 px-3 w-20">കോഡ്</th>
                    <th className="py-3 px-4">വിദ്യാർത്ഥിയുടെ പേര്</th>
                    <th className="py-3 px-3 text-right">ലക്ഷ്യം</th>
                    <th className="py-3 px-3 text-right">ബാക്കി ലക്ഷ്യം</th>
                    <th className="py-3 px-3 text-right">കൊണ്ടുപോയത്</th>
                    <th className="py-3 px-3 text-right">വിറ്റത്</th>
                    <th className="py-3 px-3 text-right">ബാക്കി സ്റ്റോക്ക്</th>
                    <th className="py-3 px-3 text-right">ലഭിച്ച തുക</th>
                    <th className="py-3 px-3 text-right">ചിലവ്</th>
                    <th className="py-3 px-3 text-right font-black text-emerald-800">ആകെ തുക</th>
                    <th className="py-3 px-3 text-right">ശരാശരി</th>
                    <th className="py-3 px-3 text-center">പുരോഗതി</th>
                    <th className="py-3 px-3 text-center print:hidden w-16">നടപടി</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-10 text-center text-slate-400">
                        {searchQuery
                          ? 'തിരഞ്ഞ പേരിൽ കുട്ടികളെ കണ്ടെത്തിയില്ല.'
                          : 'ഈ ക്യാമ്പിൽ ഇതുവരെ കുട്ടികളെ ചേർത്തിട്ടില്ല. മുകളിലെ ബട്ടൺ ഉപയോഗിച്ച് ചേർക്കാവുന്നതാണ്.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isTop3 = student.rank <= 3;
                      return (
                        <tr
                          key={student.studentId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            student.rank === 1
                              ? 'bg-amber-50/40'
                              : student.rank === 2
                              ? 'bg-slate-50/60'
                              : student.rank === 3
                              ? 'bg-orange-50/30'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-bold">
                            {student.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-sm">
                                1
                              </span>
                            ) : student.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black shadow-sm">
                                2
                              </span>
                            ) : student.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black shadow-sm">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 font-semibold">{student.rank}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                            {student.studentCode}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {student.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {student.target}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                            {student.targetRemaining}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {student.calendarsTaken}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {student.calendarsSold}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            {student.remainingStock}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {currency} {student.cashReceived.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600">
                            {currency} {student.expenses.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                            {currency} {student.netCash.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {currency} {student.average}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                student.progressPercentage >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.progressPercentage >= 50
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                            }`}
                            >
                              {student.progressPercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            {(isAdmin || isOperator) && (
                              <button
                                onClick={() =>
                                  handleRemoveStudent(student.studentId, student.studentName)
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="ക്യാമ്പിൽ നിന്ന് ഒഴിവാക്കുക"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer / Grand Total Row */}
                {filteredStudents.length > 0 && (
                  <tfoot>
                    <tr className="bg-emerald-950 text-white font-bold border-t-2 border-emerald-900 text-[11px]">
                      <td colSpan={3} className="py-3 px-4 uppercase tracking-wider text-right">
                        ആകെ തുക (TOTAL):
                      </td>
                      <td className="py-3 px-3 text-right">{activeCamp.totals.totalTarget}</td>
                      <td className="py-3 px-3 text-right text-amber-300">
                        {activeCamp.totals.totalTargetRemaining}
                      </td>
                      <td className="py-3 px-3 text-right">{activeCamp.totals.totalTaken}</td>
                      <td className="py-3 px-3 text-right text-emerald-300">
                        {activeCamp.totals.totalSold}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {activeCamp.totals.totalRemainingStock}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {currency} {activeCamp.totals.totalCashReceived.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-300">
                        {currency} {activeCamp.totals.totalExpenses.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-200 text-sm">
                        {currency} {activeCamp.totals.totalNetCash.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {currency} {activeCamp.totals.weightedAverage}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-300">
                        {activeCamp.totals.progressPercentage}%
                      </td>
                      <td className="py-3 px-3 print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* ================= MODAL: CREATE CAMP ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tent className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">പുതിയ ക്യാമ്പ് ചേർക്കുക</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ക്യാമ്പിന്റെ പേര് <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="ഉദാ: കൊല്ലം, തൃശൂർ, ആലപ്പുഴ"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  സ്ഥലം / ജില്ല
                </label>
                <input
                  type="text"
                  value={campLocation}
                  onChange={(e) => setCampLocation(e.target.value)}
                  placeholder="ഉദാ: ആലപ്പുഴ ജില്ല"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ക്യാമ്പ് ലീഡർ / ഇൻചാർജ് പേര്
                </label>
                <input
                  type="text"
                  value={campLeader}
                  onChange={(e) => setCampLeader(e.target.value)}
                  placeholder="ഉദാ: അൻവർ സാഹിബ്"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  കുറിപ്പുകൾ
                </label>
                <textarea
                  value={campNotes}
                  onChange={(e) => setCampNotes(e.target.value)}
                  placeholder="ക്യാമ്പിനെക്കുറിച്ചുള്ള കൂടുതൽ വിവരങ്ങൾ..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'സേവ് ചെയ്യുന്നു...' : 'ക്യാമ്പ് ഉണ്ടാക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CAMP ================= */}
      {showEditModal && activeCamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">ക്യാമ്പ് എഡിറ്റ് ചെയ്യുക</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCamp} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ക്യാമ്പിന്റെ പേര് <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  സ്ഥലം / ജില്ല
                </label>
                <input
                  type="text"
                  value={campLocation}
                  onChange={(e) => setCampLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ക്യാമ്പ് ലീഡർ / ഇൻചാർജ് പേര്
                </label>
                <input
                  type="text"
                  value={campLeader}
                  onChange={(e) => setCampLeader(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  കുറിപ്പുകൾ
                </label>
                <textarea
                  value={campNotes}
                  onChange={(e) => setCampNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'അപ്ഡേറ്റ് ചെയ്യുന്നു...' : 'മാറ്റങ്ങൾ സൂക്ഷിക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EXISTING STUDENT FROM DROPDOWN ================= */}
      {showAddStudentModal && activeCamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {activeCamp.name} - നിലവിലുള്ള കുട്ടിയെ ചേർക്കുക
                </h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {formError}
                </div>
              )}

              <p className="text-xs text-slate-500">
                താഴെ കൊടുത്തിരിക്കുന്ന ലിസ്റ്റിൽ നിന്ന് ക്യാമ്പിലേക്ക് ആവശ്യമുള്ള കുട്ടിയെ
                തിരഞ്ഞെടുക്കുക. കുട്ടിയെ ചേർത്ത ഉടൻ അവരുടെ മുൻപുള്ള എല്ലാ ദിവസങ്ങളിലെയും കണക്കുകൾ ഈ
                ക്യാമ്പിലേക്ക് ഓട്ടോമാറ്റിക്കായി ആഡ് ആവുന്നതാണ്.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  കുട്ടിയെ തിരയുക / തിരഞ്ഞെടുക്കുക
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchFilter}
                    onChange={(e) => setStudentSearchFilter(e.target.value)}
                    placeholder="പേരോ കോഡോ ടൈപ്പ് ചെയ്യുക..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredUnassigned.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      മറ്റ് ക്യാമ്പുകളിൽ പെടാത്ത പുതിയ കുട്ടികളൊന്നും അവശേഷിക്കുന്നില്ല.
                    </div>
                  ) : (
                    filteredUnassigned.map((st) => (
                      <label
                        key={st.studentId}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedStudentId === st.studentId ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="assignedStudent"
                            value={st.studentId}
                            checked={selectedStudentId === st.studentId}
                            onChange={() => setSelectedStudentId(st.studentId)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {st.studentName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              കോഡ്: {st.studentCode}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px]">
                          <div className="font-semibold text-emerald-700">
                            വിറ്റത്: {st.calendarsSold}
                          </div>
                          <div className="text-slate-500">
                            തുക: {currency} {st.netCash}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId || isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'ചേർക്കുന്നു...' : 'ക്യാമ്പിലേക്ക് ചേർക്കുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER BRAND NEW STUDENT TO CAMP ================= */}
      {showNewStudentModal && activeCamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {activeCamp.name} - പുതിയ കുട്ടിയെ ചേർക്കുക
                </h3>
              </div>
              <button
                onClick={() => setShowNewStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewStudent} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {formError}
                </div>
              )}

              <p className="text-xs text-slate-500">
                പുതിയ കുട്ടിയെ രജിസ്റ്റർ ചെയ്യുമ്പോൾ ഈ ക്യാമ്പിലും പ്രധാന ക്യാമ്പയിൻ ലിസ്റ്റിലും
                ഒരേസമയം ലഭ്യമാകും.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  വിദ്യാർത്ഥിയുടെ കോഡ് <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  placeholder="ഉദാ: STU-101"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  വിദ്യാർത്ഥിയുടെ പേര് <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="പൂർണ്ണ നാമം"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  കലണ്ടർ ലക്ഷ്യം (Target)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newStudentTarget}
                  onChange={(e) => setNewStudentTarget(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'രജിസ്റ്റർ ചെയ്യുന്നു...' : 'രജിസ്റ്റർ ചെയ്യുക'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CAMP CONFIRMATION ================= */}
      {deletingCamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-center text-lg font-bold text-slate-900 mb-2">
              ക്യാമ്പ് റദ്ദാക്കണോ?
            </h3>
            <p className="text-center text-xs text-slate-600 mb-6 leading-relaxed">
              <strong className="text-slate-900">"{deletingCamp.name}"</strong> എന്ന ക്യാമ്പ്
              ഒഴിവാക്കിയാൽ ഇതിലുള്ള കുട്ടികൾ ക്യാമ്പിൽ നിന്നും ഒഴിവാകും. എന്നാൽ{' '}
              <strong className="text-emerald-700">
                അവരുടെ വിൽപന വിവരങ്ങളോ രജിസ്ട്രേഷനോ ഇല്ലാതാകില്ല
              </strong>
              , അവർ പൊതു പട്ടികയിൽ തുടരുന്നതാണ്.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCamp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                വേണ്ട, നിലനിർത്തുക
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCamp}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'ഒഴിവാക്കുന്നു...' : 'അതെ, ഒഴിവാക്കുക'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CampsPage;
