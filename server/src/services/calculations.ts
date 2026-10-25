import {
  Day1RowData,
  DailySalesRowData,
  RankingRowData,
  DayTotalsData
} from '../types';

export interface StudentInput {
  studentId: string;
  studentCode: string;
  studentName: string;
  target: number;
  calendarsTaken: number;
  calendarsSold: number;
  cashReceived: number;
  expenses: number;
  notes?: string;
}

export interface CumulativeHistory {
  previousCumulativeSold: number;
  previousCumulativeNetCash: number;
}

/**
 * Calculates a single student's Day 1 figures
 */
export function calculateDay1StudentRow(
  input: StudentInput,
  calendarPrice: number = 100
): Day1RowData {
  const remainingCalendars = input.calendarsTaken - input.calendarsSold;
  const netCash = input.cashReceived - input.expenses;
  const average = input.calendarsSold > 0 ? netCash / input.calendarsSold : 0;
  const expectedCash = input.calendarsSold * calendarPrice;
  const cashDiff = input.cashReceived - expectedCash;

  let hasWarning = false;
  let warningMessage: string | undefined;

  if (input.calendarsSold > input.calendarsTaken) {
    hasWarning = true;
    warningMessage = 'വിറ്റ കലണ്ടർ കൊണ്ടുപോയതിനേക്കാൾ കൂടുതലാണ്!';
  } else if (remainingCalendars < 0) {
    hasWarning = true;
    warningMessage = 'ബാക്കി കലണ്ടർ പൂജ്യത്തിലും കുറവാണ്!';
  }

  return {
    studentId: input.studentId,
    studentCode: input.studentCode,
    studentName: input.studentName,
    target: input.target,
    calendarsTaken: input.calendarsTaken,
    calendarsSold: input.calendarsSold,
    remainingCalendars,
    cashReceived: input.cashReceived,
    expenses: input.expenses,
    netCash,
    average: Math.round(average * 100) / 100,
    expectedCash,
    cashDiff,
    hasWarning,
    warningMessage,
  };
}

/**
 * Calculates a single student's Days 2-7 figures
 */
export function calculateDayStudentRow(
  input: StudentInput,
  history: CumulativeHistory,
  calendarPrice: number = 100
): DailySalesRowData {
  const remainingCalendars = input.calendarsTaken - input.calendarsSold;
  const cumulativeSold = (history.previousCumulativeSold || 0) + input.calendarsSold;
  const targetRemaining = Math.max(0, input.target - cumulativeSold);
  const netCash = input.cashReceived - input.expenses;
  const average = input.calendarsSold > 0 ? netCash / input.calendarsSold : 0;
  const cumulativeNetCash = (history.previousCumulativeNetCash || 0) + netCash;
  const cumulativeAverage = cumulativeSold > 0 ? cumulativeNetCash / cumulativeSold : 0;
  const expectedCash = input.calendarsSold * calendarPrice;
  const cashDiff = input.cashReceived - expectedCash;

  let hasWarning = false;
  let warningMessage: string | undefined;

  if (input.calendarsSold > input.calendarsTaken) {
    hasWarning = true;
    warningMessage = 'വിറ്റ കലണ്ടർ കൊണ്ടുപോയതിനേക്കാൾ കൂടുതലാണ്!';
  } else if (cumulativeSold > input.target) {
    hasWarning = true;
    warningMessage = 'കുട്ടി നിശ്ചയിച്ച ടാർഗറ്റിൽ കൂടുതൽ വിറ്റു!';
  } else if (remainingCalendars < 0) {
    hasWarning = true;
    warningMessage = 'ബാക്കി കലണ്ടർ പൂജ്യത്തിലും കുറവാണ്!';
  }

  return {
    studentId: input.studentId,
    studentCode: input.studentCode,
    studentName: input.studentName,
    target: input.target,
    targetRemaining,
    calendarsTaken: input.calendarsTaken,
    calendarsSold: input.calendarsSold,
    remainingCalendars,
    cumulativeSold,
    cashReceived: input.cashReceived,
    expenses: input.expenses,
    netCash,
    average: Math.round(average * 100) / 100,
    cumulativeNetCash,
    cumulativeAverage: Math.round(cumulativeAverage * 100) / 100,
    expectedCash,
    cashDiff,
    hasWarning,
    warningMessage,
  };
}

/**
 * Totals for Day 1
 */
export function calculateDay1Totals(rows: Day1RowData[]): DayTotalsData {
  const target = rows.reduce((s, r) => s + r.target, 0);
  const calendarsTaken = rows.reduce((s, r) => s + r.calendarsTaken, 0);
  const calendarsSold = rows.reduce((s, r) => s + r.calendarsSold, 0);
  const remainingCalendars = calendarsTaken - calendarsSold;
  const cashReceived = rows.reduce((s, r) => s + r.cashReceived, 0);
  const expenses = rows.reduce((s, r) => s + r.expenses, 0);
  const netCash = cashReceived - expenses;
  const average = calendarsSold > 0 ? netCash / calendarsSold : 0;
  const expectedCash = rows.reduce((s, r) => s + r.expectedCash, 0);
  const cashDiff = cashReceived - expectedCash;

  return {
    target,
    calendarsTaken,
    calendarsSold,
    remainingCalendars,
    cashReceived,
    expenses,
    netCash,
    average: Math.round(average * 100) / 100,
    expectedCash,
    cashDiff,
  };
}

/**
 * Totals for Days 2-7
 */
export function calculateDailyTotals(rows: DailySalesRowData[]): DayTotalsData {
  const target = rows.reduce((s, r) => s + r.target, 0);
  const targetRemaining = rows.reduce((s, r) => s + r.targetRemaining, 0);
  const calendarsTaken = rows.reduce((s, r) => s + r.calendarsTaken, 0);
  const calendarsSold = rows.reduce((s, r) => s + r.calendarsSold, 0);
  const remainingCalendars = rows.reduce((s, r) => s + r.remainingCalendars, 0);
  const cumulativeSold = rows.reduce((s, r) => s + r.cumulativeSold, 0);
  const cashReceived = rows.reduce((s, r) => s + r.cashReceived, 0);
  const expenses = rows.reduce((s, r) => s + r.expenses, 0);
  const netCash = cashReceived - expenses;
  const average = calendarsSold > 0 ? netCash / calendarsSold : 0;
  const cumulativeNetCash = rows.reduce((s, r) => s + r.cumulativeNetCash, 0);
  const cumulativeAverage = cumulativeSold > 0 ? cumulativeNetCash / cumulativeSold : 0;
  const expectedCash = rows.reduce((s, r) => s + r.expectedCash, 0);
  const cashDiff = cashReceived - expectedCash;

  return {
    target,
    targetRemaining,
    calendarsTaken,
    calendarsSold,
    remainingCalendars,
    cumulativeSold,
    cashReceived,
    expenses,
    netCash,
    average: Math.round(average * 100) / 100,
    cumulativeNetCash,
    cumulativeAverage: Math.round(cumulativeAverage * 100) / 100,
    expectedCash,
    cashDiff,
  };
}

/**
 * Rankings for Day 1
 */
export function calculateDay1Ranking(rows: Day1RowData[]): {
  rankingRows: RankingRowData[];
  totals: {
    calendarsSold: number;
    cashReceived: number;
    expenses: number;
    netCash: number;
    weightedAverage: number;
  };
} {
  const sorted = [...rows].sort((a, b) => {
    if (b.netCash !== a.netCash) {
      return b.netCash - a.netCash;
    }
    return a.studentName.localeCompare(b.studentName, 'ml');
  });

  let currentRank = 1;
  const rankingRows: RankingRowData[] = sorted.map((row, index) => {
    if (index > 0 && row.netCash === sorted[index - 1].netCash) {
      return {
        rank: currentRank,
        studentId: row.studentId,
        studentCode: row.studentCode,
        studentName: row.studentName,
        calendarsSold: row.calendarsSold,
        cashReceived: row.cashReceived,
        expenses: row.expenses,
        netCash: row.netCash,
        average: row.average,
      };
    } else {
      currentRank = index + 1;
      return {
        rank: currentRank,
        studentId: row.studentId,
        studentCode: row.studentCode,
        studentName: row.studentName,
        calendarsSold: row.calendarsSold,
        cashReceived: row.cashReceived,
        expenses: row.expenses,
        netCash: row.netCash,
        average: row.average,
      };
    }
  });

  const totalSold = rows.reduce((s, r) => s + r.calendarsSold, 0);
  const totalCash = rows.reduce((s, r) => s + r.cashReceived, 0);
  const totalExp = rows.reduce((s, r) => s + r.expenses, 0);
  const totalNet = totalCash - totalExp;
  const weightedAverage = totalSold > 0 ? totalNet / totalSold : 0;

  return {
    rankingRows,
    totals: {
      calendarsSold: totalSold,
      cashReceived: totalCash,
      expenses: totalExp,
      netCash: totalNet,
      weightedAverage: Math.round(weightedAverage * 100) / 100,
    },
  };
}

/**
 * Rankings for Days 2 to 7
 */
export function calculateDailyRanking(rows: DailySalesRowData[]): {
  rankingRows: RankingRowData[];
  totals: {
    calendarsSold: number;
    cashReceived: number;
    expenses: number;
    netCash: number;
    weightedAverage: number;
    cumulativeSold: number;
    cumulativeNetCash: number;
  };
} {
  const sorted = [...rows].sort((a, b) => {
    if (b.netCash !== a.netCash) {
      return b.netCash - a.netCash;
    }
    return a.studentName.localeCompare(b.studentName, 'ml');
  });

  let currentRank = 1;
  const rankingRows: RankingRowData[] = sorted.map((row, index) => {
    if (index > 0 && row.netCash === sorted[index - 1].netCash) {
      return {
        rank: currentRank,
        studentId: row.studentId,
        studentCode: row.studentCode,
        studentName: row.studentName,
        calendarsSold: row.calendarsSold,
        cashReceived: row.cashReceived,
        expenses: row.expenses,
        netCash: row.netCash,
        average: row.average,
        cumulativeSold: row.cumulativeSold,
        cumulativeNetCash: row.cumulativeNetCash,
      };
    } else {
      currentRank = index + 1;
      return {
        rank: currentRank,
        studentId: row.studentId,
        studentCode: row.studentCode,
        studentName: row.studentName,
        calendarsSold: row.calendarsSold,
        cashReceived: row.cashReceived,
        expenses: row.expenses,
        netCash: row.netCash,
        average: row.average,
        cumulativeSold: row.cumulativeSold,
        cumulativeNetCash: row.cumulativeNetCash,
      };
    }
  });

  const totalSold = rows.reduce((s, r) => s + r.calendarsSold, 0);
  const totalCash = rows.reduce((s, r) => s + r.cashReceived, 0);
  const totalExp = rows.reduce((s, r) => s + r.expenses, 0);
  const totalNet = totalCash - totalExp;
  const weightedAverage = totalSold > 0 ? totalNet / totalSold : 0;
  const totalCumSold = rows.reduce((s, r) => s + r.cumulativeSold, 0);
  const totalCumNet = rows.reduce((s, r) => s + r.cumulativeNetCash, 0);

  return {
    rankingRows,
    totals: {
      calendarsSold: totalSold,
      cashReceived: totalCash,
      expenses: totalExp,
      netCash: totalNet,
      weightedAverage: Math.round(weightedAverage * 100) / 100,
      cumulativeSold: totalCumSold,
      cumulativeNetCash: totalCumNet,
    },
  };
}
