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
  UserMinus,
  Calendar,
  BarChart3,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { downloadPdfFromHtml } from '../services/pdfExporter';
import { ReportModal } from '../components/ReportModal';

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
  const { language, t } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [camps, setCamps] = useState<CampData[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<CampStudent[]>([]);
  const [unassignedTotals, setUnassignedTotals] = useState<CampTotals | null>(null);
  const [unassignedDailySummary, setUnassignedDailySummary] = useState<any[]>([]);
  const [unassignedDaySales, setUnassignedDaySales] = useState<{ [day: number]: { dayNumber: number; rows: any[]; totals: any } }>({});
  const [durationDays, setDurationDays] = useState<number>(7);
  const [unassignedSubTab, setUnassignedSubTab] = useState<'summary' | number>('summary');
  const [unassignedMobileView, setUnassignedMobileView] = useState<'table' | 'cards'>('table');
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview'); // 'overview' | 'unassigned' | campId
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showNewStudentModal, setShowNewStudentModal] = useState<boolean>(false);
  const [deletingCamp, setDeletingCamp] = useState<CampData | null>(null);
  const [assigningStudent, setAssigningStudent] = useState<CampStudent | null>(null);
  const [targetCampId, setTargetCampId] = useState<string>('');
  const [activeReportModal, setActiveReportModal] = useState<{
    isOpen: boolean;
    title: string;
    endpoint: string;
    filename: string;
  } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

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
      setUnassignedTotals(res.unassignedTotals || null);
      setUnassignedDailySummary(res.unassignedDailySummary || []);
      setUnassignedDaySales(res.unassignedDaySales || {});
      setDurationDays(res.durationDays || 7);

      // If activeTab is an ID that no longer exists, default to 'overview'
      if (
        activeTab !== 'overview' &&
        activeTab !== 'unassigned' &&
        !campList.some((c: CampData) => c.id === activeTab)
      ) {
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
      setFormError(t.camps.campRequired);
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
      setFormError(err.message || (language === 'en' ? 'Failed to create camp' : 'ക്യാമ്പ് ഉണ്ടാക്കുന്നതിൽ പരാജയപ്പെട്ടു'));
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
      setFormError(t.camps.campRequired);
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
      setFormError(err.message || (language === 'en' ? 'Failed to update camp' : 'ക്യാമ്പ് വിവരങ്ങൾ മാറ്റാൻ കഴിഞ്ഞില്ല'));
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
      alert(err.message || (language === 'en' ? 'Failed to delete camp' : 'ക്യാമ്പ് ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add existing student
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp || !selectedStudentId) {
      setFormError(t.camps.selectStudentRequired);
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
      setFormError(err.message || (language === 'en' ? 'Failed to add student to camp' : 'വിദ്യാർത്ഥിയെ ക്യാമ്പിലേക്ക് ചേർക്കാൻ കഴിഞ്ഞില്ല'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register brand new student to camp
  const handleRegisterNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp) return;
    if (!newStudentCode.trim() || !newStudentName.trim()) {
      setFormError(t.camps.codeAndNameRequired);
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
      setFormError(err.message || (language === 'en' ? 'Failed to register new student' : 'പുതിയ കുട്ടിയെ ചേർക്കാൻ കഴിഞ്ഞില്ല'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove student from camp
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!activeCamp) return;
    const confirm = window.confirm(
      t.camps.removeConfirm
        .replace('{studentName}', studentName)
        .replace('{campName}', activeCamp.name)
    );
    if (!confirm) return;

    try {
      await api.delete(`/camps/${activeCamp.id}/students/${studentId}`);
      await fetchCamps();
    } catch (err: any) {
      alert(err.message || (language === 'en' ? 'Failed to remove student from camp' : 'വിദ്യാർത്ഥിയെ ക്യാമ്പിൽ നിന്ന് ഒഴിവാക്കാൻ കഴിഞ്ഞില്ല'));
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

  const handleUnassignedExcelExport = async () => {
    if (!currentCampaign) return;
    try {
      await api.downloadFile(
        `/campaigns/${currentCampaign.id}/camps/unassigned/export/excel`,
        `${currentCampaign.name}_Non_Camp_Students.xlsx`
      );
    } catch (err: any) {
      alert(err.message || 'Excel export failed');
    }
  };

  const handleAssignToCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent || !targetCampId) return;
    try {
      setIsSubmitting(true);
      await api.post(`/camps/${targetCampId}/students`, {
        studentId: assigningStudent.studentId,
      });
      setAssigningStudent(null);
      setTargetCampId('');
      await fetchCamps();
    } catch (err: any) {
      alert(err.message || (language === 'en' ? 'Failed to assign student to camp' : 'വിദ്യാർത്ഥിയെ ക്യാമ്പിലേക്ക് മാറ്റാൻ കഴിഞ്ഞില്ല'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleCampPdfDownload = async (campId: string, campNameStr: string) => {
    if (!currentCampaign) return;
    try {
      setIsExportingPdf(true);
      const html = await api.getText(`/reports/campaigns/${currentCampaign.id}/camps/${campId}/print`);
      await downloadPdfFromHtml(html, `${currentCampaign.name}_${campNameStr}_Camp_Report.pdf`);
    } catch (err: any) {
      alert(err.message || 'PDF ഡൗൺലോഡ് പരാജയപ്പെട്ടു');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCampReportView = (campId: string, campNameStr: string) => {
    if (!currentCampaign) return;
    setActiveReportModal({
      isOpen: true,
      title: `${currentCampaign.name} — ${campNameStr} ക്യാമ്പ് റിപ്പോർട്ട്`,
      endpoint: `/reports/campaigns/${currentCampaign.id}/camps/${campId}/print`,
      filename: `${currentCampaign.name}_${campNameStr}_Camp_Report.pdf`,
    });
  };

  const handleUnassignedPdfDownload = async () => {
    if (!currentCampaign) return;
    try {
      setIsExportingPdf(true);
      const html = await api.getText(`/reports/campaigns/${currentCampaign.id}/camps/unassigned/print`);
      await downloadPdfFromHtml(html, `${currentCampaign.name}_Non_Camp_Students_Report.pdf`);
    } catch (err: any) {
      alert(err.message || 'PDF ഡൗൺലോഡ് പരാജയപ്പെട്ടു');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleUnassignedReportView = () => {
    if (!currentCampaign) return;
    setActiveReportModal({
      isOpen: true,
      title: `${currentCampaign.name} — ക്യാമ്പിൽ ഇല്ലാത്ത കുട്ടികളുടെ റിപ്പോർട്ട്`,
      endpoint: `/reports/campaigns/${currentCampaign.id}/camps/unassigned/print`,
      filename: `${currentCampaign.name}_Non_Camp_Students_Report.pdf`,
    });
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
        {language === 'en' ? 'Please select a campaign.' : 'ദയവായി ഒരു ക്യാമ്പയിൻ തിരഞ്ഞെടുക്കുക.'}
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
                <span>{t.camps.title}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {camps.length} {t.camps.campCount}
                </span>
              </h1>
              <p className="text-sm text-slate-500">
                {t.camps.subtitle}
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
              <span>{t.camps.addCampBtn}</span>
            </button>
          )}

          <button
            onClick={handleNativePrint}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            title={language === 'en' ? 'Print Landscape / Save as PDF' : 'A4 ലാൻഡ്‌സ്‌കേപ്പ് പ്രിന്റ് / PDF ആയി സേവ് ചെയ്യുക'}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{t.camps.printPdfBtn}</span>
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
          <span>{t.camps.overviewTab}</span>
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
              {camp.studentCount} {t.camps.studentsCount}
            </span>
          </button>
        ))}

        {/* Unassigned / Non-Camp Students Tab */}
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'unassigned'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <UserMinus className="w-4 h-4 text-amber-600" />
          <span>{t.camps.unassignedTab || 'ക്യാമ്പിൽ ഇല്ലാത്തവർ'}</span>
          <span
            className={`ml-1 px-2 py-0.5 text-xs rounded-full font-medium ${
              activeTab === 'unassigned'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {unassignedStudents.length}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
          {t.camps.loadingMsg}
        </div>
      ) : activeTab === 'overview' ? (
        /* ================= OVERVIEW TAB: COMPARISON & SUMMARY ================= */
        <div className="space-y-6">
          {/* Top KPI Cards for All Camps */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">{t.camps.campStudents}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {allCampsSummary.totalStudents}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {t.camps.unassignedStudents}: {unassignedStudents.length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">{t.camps.totalTarget}</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {allCampsSummary.totalTarget}
              </div>
              <div className="text-xs text-indigo-500 mt-0.5">
                {t.camps.remainingTarget}: {allCampsSummary.totalTargetRemaining}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">{t.camps.calendarsTaken}</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {allCampsSummary.totalTaken}
              </div>
              <div className="text-xs text-blue-500 mt-0.5">{language === 'en' ? 'Calendars' : 'കലണ്ടറുകൾ'}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">{t.camps.calendarsSold}</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {allCampsSummary.totalSold}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                {grandProgress}% {t.camps.progressCompleted}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase">{t.camps.stockRemaining}</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {allCampsSummary.totalStock}
              </div>
              <div className="text-xs text-amber-500 mt-0.5">{language === 'en' ? 'Calendars' : 'കലണ്ടറുകൾ'}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              <div className="text-xs font-semibold text-emerald-800 uppercase">{t.camps.netCash}</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {currency} {allCampsSummary.totalNetCash.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                {t.camps.cashReceived}: {currency} {allCampsSummary.totalCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Camp Cards Comparison */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{t.camps.campComparison}</span>
                <span className="text-xs font-normal text-slate-500">
                  {t.camps.campComparisonSub}
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
                            {camp.studentCount} {t.camps.studentsCount}
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
                            <span>{t.camps.leaderInCharge}: {camp.leaderName}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveTab(camp.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span>{t.camps.viewDetails}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Inside Camp Card */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>{t.camps.targetCol}: {camp.totals.totalTarget}</span>
                        <span className="font-bold text-emerald-700">
                          {camp.totals.totalSold} {t.camps.soldCol} ({camp.totals.progressPercentage}%)
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
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.takenCol}</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">
                          {camp.totals.totalTaken}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.soldCol}</div>
                        <div className="text-base font-bold text-emerald-700 mt-0.5">
                          {camp.totals.totalSold}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.stockCol}</div>
                        <div className="text-base font-bold text-amber-600 mt-0.5">
                          {camp.totals.totalRemainingStock}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.cashCol}</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {currency} {camp.totals.totalCashReceived.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.expensesCol}</div>
                        <div className="text-sm font-bold text-rose-600 mt-0.5">
                          {currency} {camp.totals.totalExpenses.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <div className="text-[11px] font-semibold text-emerald-800 uppercase">{t.camps.netCashCol}</div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">
                          {currency} {camp.totals.totalNetCash.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{t.camps.averageCol}: {currency} {camp.totals.weightedAverage} / {language === 'en' ? 'Calendar' : 'കലണ്ടർ'}</span>
                    <button
                      onClick={() => handleExcelExport(camp.id, camp.name)}
                      className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Download Excel' : 'Excel ഡൗൺലോഡ്'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'unassigned' ? (
        /* ================= UNASSIGNED / NON-CAMP STUDENTS VIEW ================= */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shadow-sm shadow-amber-500/10">
                    <UserMinus className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <span>{t.camps.unassignedTab || 'ക്യാമ്പിൽ ഇല്ലാത്തവർ'}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {unassignedStudents.length} {t.camps.studentsCount}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.camps.unassignedSubtitle || 'ടീം ക്യാമ്പുകളിൽ ഉൾപ്പെടാത്ത വിദ്യാർത്ഥികളുടെ ദിവസേനയുള്ള കണക്കുകളും ആകെ സംഗ്രഹവും'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  onClick={handleUnassignedExcelExport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="Excel"
                >
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  <span>{t.camps.exportUnassignedExcel || 'Excel ഡൗൺലോഡ്'}</span>
                </button>
                <button
                  onClick={handleUnassignedPdfDownload}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Saving...' : 'PDF ഡൗൺലോഡ്'}</span>
                </button>
                <button
                  onClick={handleUnassignedReportView}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="Print"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>കാണുക / പ്രിന്റ്</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs: Total Summary vs Days 1..N */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
              <button
                onClick={() => setUnassignedSubTab('summary')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  unassignedSubTab === 'summary'
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.camps.totalSummaryTab || 'ആകെ സംഗ്രഹം'}</span>
              </button>

              {Array.from({ length: durationDays }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setUnassignedSubTab(d)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    unassignedSubTab === d
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? `Day ${d}` : `ദിവസം ${d}`}</span>
                </button>
              ))}
            </div>
          </div>

          {unassignedStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">
                {t.camps.noUnassignedStudents || 'എല്ലാ കുട്ടികളും നിലവിൽ ഏതെങ്കിലും ഒരു ക്യാമ്പിൽ ഉള്ളവരാണ്!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en'
                  ? 'All enrolled students have been assigned to team camps.'
                  : 'എല്ലാ കുട്ടികളെയും വിജയകരമായി ടീം ക്യാമ്പുകളിലേക്ക് ഉൾപ്പെടുത്തിയിരിക്കുന്നു.'}
              </p>
            </div>
          ) : unassignedSubTab === 'summary' ? (
            /* ================= SUB-TAB: TOTAL SUMMARY ================= */
            <div className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.totalTarget}</div>
                  <div className="text-xl font-bold text-indigo-700 mt-1">
                    {unassignedTotals?.totalTarget || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {t.camps.remainingTarget}: {unassignedTotals?.totalTargetRemaining || 0}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.calendarsTaken}</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    {unassignedTotals?.totalTaken || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {t.camps.unassignedTab}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.calendarsSold}</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    {unassignedTotals?.totalSold || 0}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    {unassignedTotals?.progressPercentage || 0}% {t.camps.progressCompleted}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.stockRemaining}</div>
                  <div className="text-xl font-bold text-amber-600 mt-1">
                    {unassignedTotals?.totalRemainingStock || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{language === 'en' ? 'In hand' : 'കൈവശമുള്ളത്'}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.cashReceived}</div>
                  <div className="text-xl font-bold text-blue-700 mt-1">
                    {currency}{(unassignedTotals?.totalCashReceived || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.camps.totalCollection}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.expenses}</div>
                  <div className="text-xl font-bold text-rose-600 mt-1">
                    {currency}{(unassignedTotals?.totalExpenses || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.camps.totalExpenseSub}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 shadow-sm text-center col-span-2 md:col-span-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">{t.camps.netCash}</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">
                    {currency}{(unassignedTotals?.totalNetCash || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    {t.camps.averagePerCalendar}: {currency}{(unassignedTotals?.weightedAverage || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Day-by-Day Sales Progression Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.camps.daySummaryTitle || 'ദിവസേനയുള്ള വിൽപ്പന സംഗ്രഹം'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {durationDays} {language === 'en' ? 'Days Duration' : 'ദിവസങ്ങൾ'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="py-2.5 px-3">{t.camps.dayCol || 'ദിവസം'}</th>
                        <th className="py-2.5 px-3 text-right text-emerald-700">{t.camps.soldCol}</th>
                        <th className="py-2.5 px-3 text-right text-amber-600">{t.camps.stockCol}</th>
                        <th className="py-2.5 px-3 text-right text-blue-700">{t.camps.cashCol}</th>
                        <th className="py-2.5 px-3 text-right text-rose-600">{t.camps.expensesCol}</th>
                        <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">{t.summaryCols.dailyNetCash}</th>
                        <th className="py-2.5 px-3 text-right text-blue-800 font-bold">{t.summaryCols.cumulativeNetCash}</th>
                        <th className="py-2.5 px-3 text-right">{t.camps.averageCol}</th>
                        <th className="py-2.5 px-3 text-center print:hidden">{t.camps.actionCol}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unassignedDailySummary.map((ds) => (
                        <tr key={ds.dayNumber} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>{language === 'en' ? `Day ${ds.dayNumber}` : `ദിവസം ${ds.dayNumber}`}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{ds.calendarsSold}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-amber-600">{ds.remainingStock}</td>
                          <td className="py-2.5 px-3 text-right text-blue-700">{currency}{ds.cashReceived.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-rose-600">{currency}{ds.expenses.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 bg-emerald-50/20">{currency}{ds.dailyNetCash.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-800 bg-blue-50/20">{currency}{ds.cumulativeNetCash.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">{currency}{ds.average.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            <button
                              onClick={() => setUnassignedSubTab(ds.dayNumber)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{language === 'en' ? 'View Day' : 'കണക്ക് കാണുക'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td className="py-2.5 px-3">{t.camps.totalRow}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">{unassignedTotals?.totalSold || 0}</td>
                        <td className="py-2.5 px-3 text-right text-amber-600">{unassignedTotals?.totalRemainingStock || 0}</td>
                        <td className="py-2.5 px-3 text-right text-blue-700">{currency}{(unassignedTotals?.totalCashReceived || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600">{currency}{(unassignedTotals?.totalExpenses || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">{currency}{(unassignedTotals?.totalNetCash || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-blue-800">{currency}{(unassignedTotals?.totalNetCash || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{currency}{(unassignedTotals?.weightedAverage || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Cumulative Students Ranking Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.camps.unassignedTab} - {t.camps.campStudentListTitle}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {unassignedStudents.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={unassignedSearchQuery}
                        onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                        placeholder={t.camps.searchStudentPlaceholder}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs md:hidden">
                      <button
                        onClick={() => setUnassignedMobileView('table')}
                        className={`p-1.5 rounded ${unassignedMobileView === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                        title={t.camps.tableView}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUnassignedMobileView('cards')}
                        className={`p-1.5 rounded ${unassignedMobileView === 'cards' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                        title={t.camps.cardsView}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <div className={`${unassignedMobileView === 'cards' ? 'hidden md:block' : 'block'} overflow-x-auto`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center sticky left-0 bg-slate-100 z-10">{t.camps.rankCol}</th>
                        <th className="py-2.5 px-3 min-w-[150px] sticky left-12 bg-slate-100 z-10">{t.camps.studentNameCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.camps.targetCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.camps.targetRemCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.camps.takenCol}</th>
                        <th className="py-2.5 px-3 text-right text-emerald-700">{t.camps.soldCol}</th>
                        <th className="py-2.5 px-3 text-right text-amber-600">{t.camps.stockCol}</th>
                        <th className="py-2.5 px-3 text-right text-blue-700">{t.camps.cashCol}</th>
                        <th className="py-2.5 px-3 text-right text-rose-600">{t.camps.expensesCol}</th>
                        <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">{t.camps.netCashCol}</th>
                        <th className="py-2.5 px-3 text-right">{t.camps.averageCol}</th>
                        <th className="py-2.5 px-3 min-w-[110px]">{t.camps.progressCol}</th>
                        {(isAdmin || isOperator) && (
                          <th className="py-2.5 px-3 text-center print:hidden">{t.camps.actionCol}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unassignedStudents
                        .filter((s) => {
                          if (!unassignedSearchQuery.trim()) return true;
                          const q = unassignedSearchQuery.toLowerCase();
                          return s.studentName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q);
                        })
                        .map((s) => (
                          <tr key={s.studentId} className="hover:bg-amber-50/20 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700 sticky left-0 bg-white z-10">
                              <span className="w-5 h-5 rounded-full bg-slate-100 inline-flex items-center justify-center text-[10px]">
                                {s.rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-12 bg-white z-10">
                              <div className="flex flex-col">
                                <span>{s.studentName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{s.studentCode}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{s.target}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{s.targetRemaining}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-800">{s.calendarsTaken}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{s.calendarsSold}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-amber-600">{s.remainingStock}</td>
                            <td className="py-2.5 px-3 text-right text-blue-700">{currency}{s.cashReceived.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-rose-600">{currency}{s.expenses.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 bg-emerald-50/20">
                              {currency}{s.netCash.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-700">{currency}{s.average.toFixed(2)}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      s.progressPercentage >= 100
                                        ? 'bg-emerald-500'
                                        : s.progressPercentage >= 50
                                        ? 'bg-blue-500'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, s.progressPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium w-8 text-right">
                                  {s.progressPercentage}%
                                </span>
                              </div>
                            </td>
                            {(isAdmin || isOperator) && (
                              <td className="py-2.5 px-3 text-center print:hidden">
                                <button
                                  onClick={() => {
                                    setAssigningStudent(s);
                                    setTargetCampId(camps[0]?.id || '');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                  title={t.camps.assignToCampBtn || 'ക്യാമ്പിലേക്ക് മാറ്റുക'}
                                >
                                  <Tent className="w-3.5 h-3.5" />
                                  <span>{t.camps.assignToCampBtn || 'ക്യാമ്പിലേക്ക് മാറ്റുക'}</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className={`${unassignedMobileView === 'table' ? 'hidden' : 'block md:hidden'} p-3 space-y-3`}>
                  {unassignedStudents
                    .filter((s) => {
                      if (!unassignedSearchQuery.trim()) return true;
                      const q = unassignedSearchQuery.toLowerCase();
                      return s.studentName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q);
                    })
                    .map((s) => (
                      <div key={s.studentId} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold inline-flex items-center justify-center">
                              #{s.rank}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{s.studentName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{s.studentCode}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-700">{currency}{s.netCash.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">{t.camps.netCash}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t.camps.targetCol}</span>
                            <span className="font-semibold text-slate-700">{s.target}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t.camps.takenCol}</span>
                            <span className="font-semibold text-slate-700">{s.calendarsTaken}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t.camps.soldCol}</span>
                            <span className="font-bold text-emerald-700">{s.calendarsSold}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t.camps.stockCol}</span>
                            <span className="font-semibold text-amber-600">{s.remainingStock}</span>
                          </div>
                        </div>

                        {(isAdmin || isOperator) && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                setAssigningStudent(s);
                                setTargetCampId(camps[0]?.id || '');
                              }}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              <Tent className="w-3.5 h-3.5" />
                              <span>{t.camps.assignToCampBtn || 'ക്യാമ്പിലേക്ക് മാറ്റുക'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* ================= SUB-TAB: DAILY SALES (DAY 1 TO N) ================= */
            <div className="space-y-4">
              {/* Day Header & Quick Totals Bar */}
              {(() => {
                const dayNum = Number(unassignedSubTab);
                const dayData = unassignedDaySales[dayNum];
                const dayTotals = dayData?.totals;
                const rows = dayData?.rows || [];

                const filteredDayRows = rows.filter((r: any) => {
                  if (!unassignedSearchQuery.trim()) return true;
                  const q = unassignedSearchQuery.toLowerCase();
                  return r.studentName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q);
                });

                return (
                  <div className="space-y-4">
                    {/* Day KPI bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{t.camps.soldCol}</div>
                        <div className="text-lg font-bold text-emerald-700 mt-0.5">
                          {dayTotals?.calendarsSold || 0}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{t.camps.stockCol}</div>
                        <div className="text-lg font-bold text-amber-600 mt-0.5">
                          {dayTotals?.remainingCalendars || 0}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{t.camps.cashCol}</div>
                        <div className="text-lg font-bold text-blue-700 mt-0.5">
                          {currency}{(dayTotals?.cashReceived || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{t.camps.expensesCol}</div>
                        <div className="text-lg font-bold text-rose-600 mt-0.5">
                          {currency}{(dayTotals?.expenses || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">{t.camps.netCash}</div>
                        <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                          {currency}{(dayTotals?.netCash || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{t.camps.averageCol}</div>
                        <div className="text-lg font-bold text-slate-700 mt-0.5">
                          {currency}
                          {(dayTotals?.calendarsSold || 0) > 0
                            ? ((dayTotals?.netCash || 0) / (dayTotals?.calendarsSold || 1)).toFixed(2)
                            : '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Table View Card */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <h3 className="text-sm font-bold text-slate-900">
                            {language === 'en' ? `Day ${dayNum} Sales Entries` : `ദിവസം ${dayNum} - വിൽപ്പന കണക്കുകൾ`}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                            {filteredDayRows.length} {t.camps.studentsCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 md:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={unassignedSearchQuery}
                              onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                              placeholder={t.camps.searchStudentPlaceholder}
                              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            />
                          </div>

                          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs md:hidden">
                            <button
                              onClick={() => setUnassignedMobileView('table')}
                              className={`p-1.5 rounded ${unassignedMobileView === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                            >
                              <List className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setUnassignedMobileView('cards')}
                              className={`p-1.5 rounded ${unassignedMobileView === 'cards' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Day Table */}
                      <div className={`${unassignedMobileView === 'cards' ? 'hidden md:block' : 'block'} overflow-x-auto`}>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                              <th className="py-2.5 px-3 w-10 text-center sticky left-0 bg-slate-100 z-10">#</th>
                              <th className="py-2.5 px-3 min-w-[150px] sticky left-10 bg-slate-100 z-10">{t.camps.studentNameCol}</th>
                              <th className="py-2.5 px-3 text-right">{t.camps.targetCol}</th>
                              {dayNum > 1 && (
                                <th className="py-2.5 px-3 text-right">{t.camps.targetRemCol}</th>
                              )}
                              <th className="py-2.5 px-3 text-right">{t.camps.takenCol}</th>
                              <th className="py-2.5 px-3 text-right text-emerald-700">{t.camps.soldCol}</th>
                              <th className="py-2.5 px-3 text-right text-amber-600">{t.camps.stockCol}</th>
                              <th className="py-2.5 px-3 text-right text-blue-700">{t.camps.cashCol}</th>
                              <th className="py-2.5 px-3 text-right text-rose-600">{t.camps.expensesCol}</th>
                              <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">{t.camps.netCashCol}</th>
                              <th className="py-2.5 px-3 text-right">{t.camps.averageCol}</th>
                              {dayNum > 1 && (
                                <>
                                  <th className="py-2.5 px-3 text-right text-emerald-800">{t.daysCols.cumulativeSold}</th>
                                  <th className="py-2.5 px-3 text-right text-blue-800">{t.daysCols.cumulativeNetCash}</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredDayRows.map((r: any, idx: number) => (
                              <tr key={r.studentId} className="hover:bg-amber-50/20 transition-colors">
                                <td className="py-2.5 px-3 text-center text-slate-500 sticky left-0 bg-white z-10">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-10 bg-white z-10">
                                  <div className="flex flex-col">
                                    <span>{r.studentName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{r.studentCode}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-600">{r.target}</td>
                                {dayNum > 1 && (
                                  <td className="py-2.5 px-3 text-right text-slate-500">{r.targetRemaining ?? '-'}</td>
                                )}
                                <td className="py-2.5 px-3 text-right font-medium text-slate-800">{r.calendarsTaken}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{r.calendarsSold}</td>
                                <td className="py-2.5 px-3 text-right font-medium text-amber-600">{r.remainingCalendars}</td>
                                <td className="py-2.5 px-3 text-right text-blue-700">{currency}{r.cashReceived.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right text-rose-600">{currency}{r.expenses.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700 bg-emerald-50/20">
                                  {currency}{r.netCash.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-slate-700">{currency}{r.average?.toFixed(2) ?? '0.00'}</td>
                                {dayNum > 1 && (
                                  <>
                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">{r.cumulativeSold}</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-blue-800">{currency}{r.cumulativeNetCash?.toLocaleString()}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                              <td colSpan={2} className="py-2.5 px-3">{t.camps.totalRow}</td>
                              <td className="py-2.5 px-3 text-right">{dayTotals?.target ?? '-'}</td>
                              {dayNum > 1 && (
                                <td className="py-2.5 px-3 text-right">{dayTotals?.targetRemaining ?? '-'}</td>
                              )}
                              <td className="py-2.5 px-3 text-right">{dayTotals?.calendarsTaken || 0}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-700">{dayTotals?.calendarsSold || 0}</td>
                              <td className="py-2.5 px-3 text-right text-amber-600">{dayTotals?.remainingCalendars || 0}</td>
                              <td className="py-2.5 px-3 text-right text-blue-700">{currency}{(dayTotals?.cashReceived || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right text-rose-600">{currency}{(dayTotals?.expenses || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-700">{currency}{(dayTotals?.netCash || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">
                                {currency}
                                {(dayTotals?.calendarsSold || 0) > 0
                                  ? ((dayTotals?.netCash || 0) / (dayTotals?.calendarsSold || 1)).toFixed(2)
                                  : '0.00'}
                              </td>
                              {dayNum > 1 && (
                                <>
                                  <td className="py-2.5 px-3 text-right text-emerald-800">{dayTotals?.cumulativeSold || 0}</td>
                                  <td className="py-2.5 px-3 text-right text-blue-800">{currency}{(dayTotals?.cumulativeNetCash || 0).toLocaleString()}</td>
                                </>
                              )}
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Mobile Cards for Day */}
                      <div className={`${unassignedMobileView === 'table' ? 'hidden' : 'block md:hidden'} p-3 space-y-3`}>
                        {filteredDayRows.map((r: any, idx: number) => (
                          <div key={r.studentId} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center justify-center">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{r.studentName}</div>
                                  <div className="text-[10px] font-mono text-slate-400">{r.studentCode}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-emerald-700">{currency}{r.netCash.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-400">{t.camps.netCash}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg">
                              <div>
                                <span className="text-[10px] text-slate-400 block">{t.camps.takenCol}</span>
                                <span className="font-semibold text-slate-700">{r.calendarsTaken}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">{t.camps.soldCol}</span>
                                <span className="font-bold text-emerald-700">{r.calendarsSold}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">{t.camps.stockCol}</span>
                                <span className="font-semibold text-amber-600">{r.remainingCalendars}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">{t.camps.averageCol}</span>
                                <span className="font-semibold text-slate-700">{currency}{r.average?.toFixed(2) ?? '0'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
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
                          <span>{t.camps.leaderInCharge}: {activeCamp.leaderName}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {activeCamp.studentCount} {t.camps.studentsCount}
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
                      <span>{t.camps.addExistingStudentBtn}</span>
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
                      <span>{t.camps.registerNewStudentBtn}</span>
                    </button>

                    <button
                      onClick={handleOpenEditCamp}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      title={t.camps.editCampBtn}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.camps.editCampBtn}</span>
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setDeletingCamp(activeCamp)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    title={t.camps.deleteCampBtn}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.camps.deleteCampBtn}</span>
                  </button>
                )}

                <button
                  onClick={() => handleExcelExport(activeCamp.id, activeCamp.name)}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="Excel"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => handleCampPdfDownload(activeCamp.id, activeCamp.name)}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Saving...' : 'PDF ഡൗൺലോഡ്'}</span>
                </button>

                <button
                  onClick={() => handleCampReportView(activeCamp.id, activeCamp.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  title="Print"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>കാണുക / പ്രിന്റ്</span>
                </button>
              </div>
            </div>
          </div>

          {/* Camp KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.totalTarget}</div>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                {activeCamp.totals.totalTarget}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {t.camps.remainingTarget}: {activeCamp.totals.totalTargetRemaining}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.calendarsTaken}</div>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {activeCamp.totals.totalTaken}
              </div>
              <div className="text-[11px] text-blue-400 mt-0.5">{language === 'en' ? 'Calendars' : 'കലണ്ടറുകൾ'}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.calendarsSold}</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {activeCamp.totals.totalSold}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {activeCamp.totals.progressPercentage}% {t.camps.progressCompleted}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.stockRemaining}</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {activeCamp.totals.totalRemainingStock}
              </div>
              <div className="text-[11px] text-amber-500 mt-0.5">{language === 'en' ? 'Calendars' : 'കലണ്ടറുകൾ'}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.cashReceived}</div>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {currency} {activeCamp.totals.totalCashReceived.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t.camps.totalCollection}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">{t.camps.expenses}</div>
              <div className="text-xl font-bold text-rose-600 mt-1">
                {currency} {activeCamp.totals.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-rose-400 mt-0.5">{t.camps.totalExpenseSub}</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-sm text-center col-span-2 md:col-span-1">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase">{t.camps.netCash}</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {currency} {activeCamp.totals.totalNetCash.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                {t.camps.averageCol}: {currency} {activeCamp.totals.weightedAverage}
              </div>
            </div>
          </div>

          {/* Student Leaderboard Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filter bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeCamp.name} - {t.camps.campStudentListTitle}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {filteredStudents.length} {t.camps.studentsCount}
                </span>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.camps.searchStudentPlaceholder}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-2 text-center w-12 sticky left-0 bg-slate-50 z-20">{t.camps.rankCol}</th>
                    <th className="py-3 px-3 min-w-[170px] sticky left-12 bg-slate-50 z-20 border-r border-slate-200 shadow-xs">{t.camps.studentNameCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.targetCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.targetRemCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.takenCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.soldCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.stockCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.cashCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.expensesCol}</th>
                    <th className="py-3 px-3 text-right font-black text-emerald-800">{t.camps.netCashCol}</th>
                    <th className="py-3 px-3 text-right">{t.camps.averageCol}</th>
                    <th className="py-3 px-3 text-center">{t.camps.progressCol}</th>
                    <th className="py-3 px-3 text-center print:hidden w-16">{t.camps.actionCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-slate-400">
                        {searchQuery
                          ? t.camps.noStudentsFoundSearch
                          : t.camps.noStudentsInCamp}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isTop3 = student.rank <= 3;
                      const rowBg = student.rank === 1
                        ? 'bg-amber-50/40'
                        : student.rank === 2
                        ? 'bg-slate-50/60'
                        : student.rank === 3
                        ? 'bg-orange-50/30'
                        : 'bg-white';
                      return (
                        <tr
                          key={student.studentId}
                          className={`hover:bg-slate-50/80 transition-colors ${rowBg}`}
                        >
                          <td className={`py-2.5 px-2 text-center font-bold sticky left-0 z-10 ${rowBg}`}>
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
                          <td className={`py-2.5 px-3 sticky left-12 z-10 border-r border-slate-200 shadow-xs ${rowBg}`}>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{student.studentName}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {student.studentCode}
                              </span>
                            </div>
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
                                title={t.camps.removeFromCampTooltip}
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
                      <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-left sticky left-0 bg-emerald-950 z-10 border-r border-emerald-900 shadow-xs">
                        {t.camps.totalRow}
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
                      <td className="py-3 px-3 text-center print:hidden"></td>
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
                <h3 className="text-base font-bold text-slate-900">{t.camps.createNewCampTitle}</h3>
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
                  {t.camps.campNameLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder={t.camps.campNamePlaceholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.locationLabel}
                </label>
                <input
                  type="text"
                  value={campLocation}
                  onChange={(e) => setCampLocation(e.target.value)}
                  placeholder={t.camps.locationPlaceholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.leaderLabel}
                </label>
                <input
                  type="text"
                  value={campLeader}
                  onChange={(e) => setCampLeader(e.target.value)}
                  placeholder={t.camps.leaderPlaceholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.notesLabel}
                </label>
                <textarea
                  value={campNotes}
                  onChange={(e) => setCampNotes(e.target.value)}
                  placeholder={t.camps.notesPlaceholder}
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
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t.camps.saving : t.camps.saveCampBtn}
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
                <h3 className="text-base font-bold text-slate-900">{t.camps.editCampTitle}</h3>
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
                  {t.camps.campNameLabel} <span className="text-rose-500">*</span>
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
                  {t.camps.locationLabel}
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
                  {t.camps.leaderLabel}
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
                  {t.camps.notesLabel}
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
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t.camps.updating : t.camps.updateCampBtn}
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
                  {activeCamp.name} - {t.camps.addExistingModalTitle}
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
                {t.camps.addExistingModalDesc}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.searchStudentLabel}
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchFilter}
                    onChange={(e) => setStudentSearchFilter(e.target.value)}
                    placeholder={t.camps.searchStudentPlaceholder}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredUnassigned.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      {t.camps.noAvailableStudents}
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
                              {t.camps.codeLabel} {st.studentCode}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px]">
                          <div className="font-semibold text-emerald-700">
                            {t.camps.soldCol}: {st.calendarsSold}
                          </div>
                          <div className="text-slate-500">
                            {t.camps.cashCol}: {currency} {st.netCash}
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
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId || isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t.camps.assigning : t.camps.assignBtn}
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
                  {activeCamp.name} - {t.camps.registerNewModalTitle}
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
                {t.camps.registerNewModalDesc}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.studentCodeLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  placeholder={t.camps.studentCodePlaceholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.studentNameLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder={t.camps.studentNamePlaceholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t.camps.targetLabel}
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
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? t.camps.registering : t.camps.registerBtn}
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
              {t.camps.deleteCampModalTitle}
            </h3>
            <p className="text-center text-xs text-slate-600 mb-6 leading-relaxed">
              {t.camps.deleteCampModalDesc.replace('{campName}', deletingCamp.name)}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCamp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t.camps.keepCampBtn}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCamp}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t.camps.deleting : t.camps.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN UNASSIGNED STUDENT TO A CAMP ================= */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tent className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t.camps.assignToCampBtn || 'ക്യാമ്പിലേക്ക് മാറ്റുക'}
                </h3>
              </div>
              <button
                onClick={() => setAssigningStudent(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignToCamp} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">{t.camps.studentNameCol}</div>
                <div className="text-base font-bold text-slate-900">{assigningStudent.studentName}</div>
                <div className="text-xs font-mono text-slate-400">{assigningStudent.studentCode}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                  {t.camps.selectTargetCamp || 'ക്യാമ്പ് തിരഞ്ഞെടുക്കുക:'}
                </label>
                <div className="space-y-2">
                  {camps.map((camp) => (
                    <label
                      key={camp.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        targetCampId === camp.id
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="targetCamp"
                          value={camp.id}
                          checked={targetCampId === camp.id}
                          onChange={(e) => setTargetCampId(e.target.value)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{camp.name}</div>
                          {camp.location && (
                            <div className="text-xs text-slate-500">{camp.location}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {camp.studentCount} {t.camps.studentsCount}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetCampId}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {isSubmitting ? t.common.saving : (t.camps.assignToCampBtn || 'ക്യാമ്പിലേക്ക് മാറ്റുക')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeReportModal && activeReportModal.isOpen && (
        <ReportModal
          isOpen={activeReportModal.isOpen}
          onClose={() => setActiveReportModal(null)}
          title={activeReportModal.title}
          endpoint={activeReportModal.endpoint}
          filename={activeReportModal.filename}
        />
      )}
    </div>
  );
};
export default CampsPage;
