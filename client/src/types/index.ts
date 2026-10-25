export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  institutionName?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  calendarPrice: number;
  currency: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';
  createdAt: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  studentCode: string;
  name: string; // Malayalam name
  isActive: boolean;
  createdAt: string;
  targetCalendars?: number; // Target for current campaign
}

export interface CampaignStudent {
  id: string;
  campaignId: string;
  studentId: string;
  targetCalendars: number;
  isActive: boolean;
  student: Student;
}

export interface DailySaleRaw {
  id?: string;
  campaignId: string;
  studentId: string;
  dayNumber: number;
  calendarsTaken: number;
  calendarsSold: number;
  cashReceived: number;
  expenses: number;
  notes?: string;
}

// Calculated row for Day 1
export interface Day1Row {
  studentId: string;
  studentCode: string;
  studentName: string;
  target: number;
  calendarsTaken: number;
  calendarsSold: number;
  remainingCalendars: number; // Taken - Sold
  cashReceived: number;
  expenses: number;
  netCash: number; // Cash Received - Expenses
  average: number; // Net Cash / Sold (0 if sold is 0)
  expectedCash: number; // Sold * Price
  cashDiff: number; // Cash Received - Expected Cash
  hasWarning: boolean;
  warningMessage?: string;
}

// Calculated row for Days 2 to 7
export interface DailySalesRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  target: number;
  targetRemaining: number; // MAX(0, Target - Cumulative Sold)
  calendarsTaken: number;
  calendarsSold: number;
  remainingCalendars: number; // Today's Taken - Today's Sold
  cumulativeSold: number; // Previous Cumulative Sold + Today's Sold
  cashReceived: number;
  expenses: number;
  netCash: number; // Today's Cash Received - Today's Expenses
  average: number; // Net Cash / Today's Sold (0 if sold is 0)
  cumulativeNetCash: number; // Previous Cumulative Net Cash + Today's Net Cash
  cumulativeAverage: number; // Cumulative Net Cash / Cumulative Sold (0 if sold is 0)
  expectedCash: number; // Sold * Price
  cashDiff: number; // Cash Received - Expected Cash
  hasWarning: boolean;
  warningMessage?: string;
}

export interface RankingRow {
  rank: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  calendarsSold: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  average: number;
  // Available for Days 2-7:
  cumulativeSold?: number;
  cumulativeNetCash?: number;
}

export interface DayTotals {
  target: number;
  targetRemaining?: number;
  calendarsTaken: number;
  calendarsSold: number;
  remainingCalendars: number;
  cumulativeSold?: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  average: number; // Weighted: Total Net Cash / Total Sold
  cumulativeNetCash?: number;
  cumulativeAverage?: number; // Weighted: Total Cumulative Net Cash / Total Cumulative Sold
  expectedCash: number;
  cashDiff: number;
}

export interface DaySummaryItem {
  dayNumber: number;
  calendarsSold: number;
  remainingCalendars: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  cumulativeNetCash: number;
}

export interface OverallSummary {
  dailySummaries: DaySummaryItem[];
  totals: {
    totalSold: number;
    currentStockRemaining: number;
    totalCashReceived: number;
    totalExpenses: number;
    totalNetCash: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  campaignId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
}
