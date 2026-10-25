import {
  Day1Row,
  DailySalesRow,
  RankingRow,
  DayTotals,
  DaySummaryItem,
  OverallSummary
} from '../types';

export interface StudentInputData {
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

export interface StudentHistoricalData {
  previousCumulativeSold: number;
  previousCumulativeNetCash: number;
}

/**
 * Calculates Day 1 row values
 */
export function calculateDay1Row(
  input: StudentInputData,
  calendarPrice: number = 100
): Day1Row {
  const remainingCalendars = input.calendarsTaken - input.calendarsSold;
  const netCash = input.cashReceived - input.expenses;
  const average = input.calendarsSold > 0 ? netCash / input.calendarsSold : 0;
  const expectedCash = input.calendarsSold * calendarPrice;
  const cashDiff = input.cashReceived - expectedCash;

  let hasWarning = false;
  let warningMessage: string | undefined = undefined;

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
 * Calculates Days 2-7 row values
 */
export function calculateDayRow(
  input: StudentInputData,
  history: StudentHistoricalData,
  calendarPrice: number = 100
): DailySalesRow {
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
  let warningMessage: string | undefined = undefined;

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
 * Calculate totals for Day 1
 */
export function calculateDay1Totals(rows: Day1Row[]): DayTotals {
  const totalTarget = rows.reduce((sum, r) => sum + r.target, 0);
  const totalTaken = rows.reduce((sum, r) => sum + r.calendarsTaken, 0);
  const totalSold = rows.reduce((sum, r) => sum + r.calendarsSold, 0);
  const totalRemaining = totalTaken - totalSold;
  const totalCashReceived = rows.reduce((sum, r) => sum + r.cashReceived, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.expenses, 0);
  const totalNetCash = totalCashReceived - totalExpenses;
  const weightedAverage = totalSold > 0 ? totalNetCash / totalSold : 0;
  const totalExpectedCash = rows.reduce((sum, r) => sum + r.expectedCash, 0);
  const totalCashDiff = totalCashReceived - totalExpectedCash;

  return {
    target: totalTarget,
    calendarsTaken: totalTaken,
    calendarsSold: totalSold,
    remainingCalendars: totalRemaining,
    cashReceived: totalCashReceived,
    expenses: totalExpenses,
    netCash: totalNetCash,
    average: Math.round(weightedAverage * 100) / 100,
    expectedCash: totalExpectedCash,
    cashDiff: totalCashDiff,
  };
}

/**
 * Calculate totals for Days 2-7
 */
export function calculateDailyTotals(rows: DailySalesRow[]): DayTotals {
  const totalTarget = rows.reduce((sum, r) => sum + r.target, 0);
  const totalTargetRemaining = rows.reduce((sum, r) => sum + r.targetRemaining, 0);
  const totalTaken = rows.reduce((sum, r) => sum + r.calendarsTaken, 0);
  const totalSold = rows.reduce((sum, r) => sum + r.calendarsSold, 0);
  const totalRemainingStock = rows.reduce((sum, r) => sum + r.remainingCalendars, 0);
  const totalCumulativeSold = rows.reduce((sum, r) => sum + r.cumulativeSold, 0);
  const totalCashReceived = rows.reduce((sum, r) => sum + r.cashReceived, 0);
  const totalExpenses = rows.reduce((sum, r) => sum + r.expenses, 0);
  const totalNetCash = totalCashReceived - totalExpenses;
  const weightedDailyAverage = totalSold > 0 ? totalNetCash / totalSold : 0;
  const totalCumulativeNetCash = rows.reduce((sum, r) => sum + r.cumulativeNetCash, 0);
  const weightedCumulativeAverage =
    totalCumulativeSold > 0 ? totalCumulativeNetCash / totalCumulativeSold : 0;
  const totalExpectedCash = rows.reduce((sum, r) => sum + r.expectedCash, 0);
  const totalCashDiff = totalCashReceived - totalExpectedCash;

  return {
    target: totalTarget,
    targetRemaining: totalTargetRemaining,
    calendarsTaken: totalTaken,
    calendarsSold: totalSold,
    remainingCalendars: totalRemainingStock,
    cumulativeSold: totalCumulativeSold,
    cashReceived: totalCashReceived,
    expenses: totalExpenses,
    netCash: totalNetCash,
    average: Math.round(weightedDailyAverage * 100) / 100,
    cumulativeNetCash: totalCumulativeNetCash,
    cumulativeAverage: Math.round(weightedCumulativeAverage * 100) / 100,
    expectedCash: totalExpectedCash,
    cashDiff: totalCashDiff,
  };
}

/**
 * Calculates Automatic Ranking Table for Day 1
 */
export function calculateDay1Ranking(rows: Day1Row[]): {
  rankingRows: RankingRow[];
  totals: {
    calendarsSold: number;
    cashReceived: number;
    expenses: number;
    netCash: number;
    weightedAverage: number;
  };
} {
  // Filter or sort: ordered by netCash descending, stable secondary order by student name
  const sorted = [...rows].sort((a, b) => {
    if (b.netCash !== a.netCash) {
      return b.netCash - a.netCash;
    }
    return a.studentName.localeCompare(b.studentName, 'ml');
  });

  // Assign ranks with consistent tie handling (tied students share the same rank)
  let currentRank = 1;
  const rankingRows: RankingRow[] = sorted.map((row, index) => {
    if (index > 0 && row.netCash === sorted[index - 1].netCash) {
      // Shared rank
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

  const totalSold = rows.reduce((sum, r) => sum + r.calendarsSold, 0);
  const totalCash = rows.reduce((sum, r) => sum + r.cashReceived, 0);
  const totalExp = rows.reduce((sum, r) => sum + r.expenses, 0);
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
 * Calculates Automatic Ranking Table for Days 2 to 7
 */
export function calculateDailyRanking(rows: DailySalesRow[]): {
  rankingRows: RankingRow[];
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
  // Sort by today's netCash descending, secondary sort by student name
  const sorted = [...rows].sort((a, b) => {
    if (b.netCash !== a.netCash) {
      return b.netCash - a.netCash;
    }
    return a.studentName.localeCompare(b.studentName, 'ml');
  });

  let currentRank = 1;
  const rankingRows: RankingRow[] = sorted.map((row, index) => {
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

  const totalSold = rows.reduce((sum, r) => sum + r.calendarsSold, 0);
  const totalCash = rows.reduce((sum, r) => sum + r.cashReceived, 0);
  const totalExp = rows.reduce((sum, r) => sum + r.expenses, 0);
  const totalNet = totalCash - totalExp;
  const weightedAverage = totalSold > 0 ? totalNet / totalSold : 0;
  const totalCumSold = rows.reduce((sum, r) => sum + r.cumulativeSold, 0);
  const totalCumNet = rows.reduce((sum, r) => sum + r.cumulativeNetCash, 0);

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

/**
 * Calculates Overall Summary (ആകെ സംഗ്രഹം) across 7 days
 */
export function calculateOverallSummary(
  allDaysSales: { [day: number]: { calendarsSold: number; remainingStock: number; cashReceived: number; expenses: number } }
): OverallSummary {
  const dailySummaries: DaySummaryItem[] = [];
  let runningCumulativeNetCash = 0;
  let totalSoldAllDays = 0;
  let totalCashReceivedAllDays = 0;
  let totalExpensesAllDays = 0;
  let latestStock = 0;

  for (let day = 1; day <= 7; day++) {
    const dayData = allDaysSales[day] || {
      calendarsSold: 0,
      remainingStock: 0,
      cashReceived: 0,
      expenses: 0,
    };

    const dailyNet = dayData.cashReceived - dayData.expenses;
    runningCumulativeNetCash += dailyNet;
    totalSoldAllDays += dayData.calendarsSold;
    totalCashReceivedAllDays += dayData.cashReceived;
    totalExpensesAllDays += dayData.expenses;
    latestStock = dayData.remainingStock;

    dailySummaries.push({
      dayNumber: day,
      calendarsSold: dayData.calendarsSold,
      remainingCalendars: dayData.remainingStock,
      cashReceived: dayData.cashReceived,
      expenses: dayData.expenses,
      netCash: dailyNet,
      cumulativeNetCash: runningCumulativeNetCash,
    });
  }

  return {
    dailySummaries,
    totals: {
      totalSold: totalSoldAllDays,
      currentStockRemaining: latestStock,
      totalCashReceived: totalCashReceivedAllDays,
      totalExpenses: totalExpensesAllDays,
      totalNetCash: runningCumulativeNetCash,
    },
  };
}
