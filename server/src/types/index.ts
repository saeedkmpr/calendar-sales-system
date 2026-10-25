export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: UserRole;
}

export interface Day1RowData {
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
  average: number; // Net Cash / Calendars Sold Today
  expectedCash: number; // Sold * Price
  cashDiff: number; // Cash Received - Expected Cash
  hasWarning: boolean;
  warningMessage?: string;
}

export interface DailySalesRowData {
  studentId: string;
  studentCode: string;
  studentName: string;
  target: number;
  targetRemaining: number; // MAX(0, Target - Cumulative Sold)
  calendarsTaken: number;
  calendarsSold: number;
  remainingCalendars: number; // Today's Taken - Today's Sold
  cumulativeSold: number; // Previous Days + Today
  cashReceived: number;
  expenses: number;
  netCash: number; // Today's Cash Received - Today's Expenses
  average: number; // Today's Net Cash / Today's Calendars Sold
  cumulativeNetCash: number; // Previous Days + Today
  cumulativeAverage: number; // Cumulative Net Cash / Cumulative Sold
  expectedCash: number; // Sold * Price
  cashDiff: number; // Cash Received - Expected Cash
  hasWarning: boolean;
  warningMessage?: string;
}

export interface RankingRowData {
  rank: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  calendarsSold: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  average: number;
  cumulativeSold?: number;
  cumulativeNetCash?: number;
}

export interface DayTotalsData {
  target: number;
  targetRemaining?: number;
  calendarsTaken: number;
  calendarsSold: number;
  remainingCalendars: number;
  cumulativeSold?: number;
  cashReceived: number;
  expenses: number;
  netCash: number;
  average: number;
  cumulativeNetCash?: number;
  cumulativeAverage?: number;
  expectedCash: number;
  cashDiff: number;
}
