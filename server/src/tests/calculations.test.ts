import { describe, it, expect } from 'vitest';
import {
  calculateDay1StudentRow,
  calculateDayStudentRow,
  calculateDay1Totals,
  calculateDailyTotals,
  calculateDay1Ranking,
  calculateDailyRanking,
  StudentInput,
  CumulativeHistory,
} from '../services/calculations';

describe('Calculation Engine & Ranking Unit Tests', () => {
  const dummyStudent1: StudentInput = {
    studentId: 'st-1',
    studentCode: 'S01',
    studentName: 'മുഹമ്മദ്‌ റഫീഖ്',
    target: 50,
    calendarsTaken: 10,
    calendarsSold: 8,
    cashReceived: 800,
    expenses: 50,
  };

  const dummyStudent2: StudentInput = {
    studentId: 'st-2',
    studentCode: 'S02',
    studentName: 'ഫാത്തിമ സന',
    target: 40,
    calendarsTaken: 12,
    calendarsSold: 12,
    cashReceived: 1200,
    expenses: 0,
  };

  const dummyStudentZeroSold: StudentInput = {
    studentId: 'st-3',
    studentCode: 'S03',
    studentName: 'അനന്തു കൃഷ്ണൻ',
    target: 50,
    calendarsTaken: 5,
    calendarsSold: 0,
    cashReceived: 0,
    expenses: 0,
  };

  // Test 1: Day 1 remaining stock equals calendars taken minus calendars sold
  it('1. Day 1 remaining stock equals calendars taken minus calendars sold', () => {
    const row = calculateDay1StudentRow(dummyStudent1, 100);
    expect(row.remainingCalendars).toBe(10 - 8); // 2
  });

  // Test 2: Daily net cash equals cash received minus expenses
  it('2. Daily net cash equals cash received minus expenses', () => {
    const row = calculateDay1StudentRow(dummyStudent1, 100);
    expect(row.netCash).toBe(800 - 50); // 750
  });

  // Test 3: Daily average equals daily net cash divided by daily calendars sold
  it('3. Daily average equals daily net cash divided by daily calendars sold', () => {
    const row = calculateDay1StudentRow(dummyStudent1, 100);
    expect(row.average).toBe(Math.round((750 / 8) * 100) / 100); // 93.75
  });

  // Test 4: Cumulative calendars sold include all previous days
  it('4. Cumulative calendars sold include all previous days', () => {
    const history: CumulativeHistory = {
      previousCumulativeSold: 15,
      previousCumulativeNetCash: 1400,
    };
    const row = calculateDayStudentRow(dummyStudent1, history, 100);
    expect(row.cumulativeSold).toBe(15 + 8); // 23
  });

  // Test 5: Remaining target decreases as cumulative sales increase and never goes negative
  it('5. Remaining target decreases as cumulative sales increase and never goes negative', () => {
    const history: CumulativeHistory = {
      previousCumulativeSold: 45,
      previousCumulativeNetCash: 4500,
    };
    const row = calculateDayStudentRow(dummyStudent1, history, 100);
    // target is 50, cumulative sold is 45 + 8 = 53
    expect(row.cumulativeSold).toBe(53);
    expect(row.targetRemaining).toBe(0); // MAX(0, 50 - 53)
  });

  // Test 6: Cumulative net cash includes all previous daily net cash values
  it('6. Cumulative net cash includes all previous daily net cash values', () => {
    const history: CumulativeHistory = {
      previousCumulativeSold: 10,
      previousCumulativeNetCash: 950,
    };
    const row = calculateDayStudentRow(dummyStudent1, history, 100);
    // today's net cash = 800 - 50 = 750
    expect(row.cumulativeNetCash).toBe(950 + 750); // 1700
  });

  // Test 7: Cumulative average uses cumulative net cash divided by cumulative calendars sold
  it('7. Cumulative average uses cumulative net cash divided by cumulative calendars sold', () => {
    const history: CumulativeHistory = {
      previousCumulativeSold: 10,
      previousCumulativeNetCash: 1000,
    };
    const row = calculateDayStudentRow(dummyStudent1, history, 100);
    // cumulative net cash = 1000 + 750 = 1750
    // cumulative sold = 10 + 8 = 18
    expect(row.cumulativeAverage).toBe(Math.round((1750 / 18) * 100) / 100);
  });

  // Test 8: Ranking is ordered by daily net cash, highest first
  it('8. Ranking is ordered by daily net cash, highest first', () => {
    const row1 = calculateDay1StudentRow(dummyStudent1, 100); // netCash: 750
    const row2 = calculateDay1StudentRow(dummyStudent2, 100); // netCash: 1200
    const ranking = calculateDay1Ranking([row1, row2]);

    expect(ranking.rankingRows[0].studentId).toBe('st-2');
    expect(ranking.rankingRows[0].rank).toBe(1);
    expect(ranking.rankingRows[1].studentId).toBe('st-1');
    expect(ranking.rankingRows[1].rank).toBe(2);
  });

  // Test 9: Ranking updates when cash or expenses change
  it('9. Ranking updates when cash or expenses change', () => {
    // If student 1 gets more cash or less expenses, ranking changes
    const updatedStudent1: StudentInput = {
      ...dummyStudent1,
      cashReceived: 1500,
      expenses: 0,
    };
    const row1 = calculateDay1StudentRow(updatedStudent1, 100); // netCash: 1500
    const row2 = calculateDay1StudentRow(dummyStudent2, 100); // netCash: 1200
    const ranking = calculateDay1Ranking([row1, row2]);

    expect(ranking.rankingRows[0].studentId).toBe('st-1');
    expect(ranking.rankingRows[0].rank).toBe(1);
  });

  // Test 10: Ranking ties are handled consistently with shared rank and Malayalam secondary sort
  it('10. Ranking ties are handled consistently with shared rank', () => {
    const studentA: StudentInput = {
      studentId: 'st-a',
      studentCode: 'A01',
      studentName: 'അനന്തു',
      target: 50,
      calendarsTaken: 10,
      calendarsSold: 10,
      cashReceived: 1000,
      expenses: 100, // netCash = 900
    };
    const studentB: StudentInput = {
      studentId: 'st-b',
      studentCode: 'B01',
      studentName: 'വിഷ്ണു',
      target: 50,
      calendarsTaken: 10,
      calendarsSold: 10,
      cashReceived: 1000,
      expenses: 100, // netCash = 900
    };

    const rowA = calculateDay1StudentRow(studentA, 100);
    const rowB = calculateDay1StudentRow(studentB, 100);
    const ranking = calculateDay1Ranking([rowA, rowB]);

    expect(ranking.rankingRows[0].rank).toBe(1);
    expect(ranking.rankingRows[1].rank).toBe(1); // Shared rank
    expect(ranking.rankingRows[0].studentName).toBe('അനന്തു'); // Alphabetical in Malayalam
  });

  // Test 11: The SUM row displays correct totals for both entry and ranking tables
  it('11. SUM row displays correct totals for both entry and ranking tables', () => {
    const row1 = calculateDay1StudentRow(dummyStudent1, 100);
    const row2 = calculateDay1StudentRow(dummyStudent2, 100);
    const totals = calculateDay1Totals([row1, row2]);
    const ranking = calculateDay1Ranking([row1, row2]);

    expect(totals.calendarsSold).toBe(8 + 12); // 20
    expect(totals.cashReceived).toBe(800 + 1200); // 2000
    expect(totals.expenses).toBe(50 + 0); // 50
    expect(totals.netCash).toBe(1950);

    // Ranking totals match entry totals exactly
    expect(ranking.totals.calendarsSold).toBe(totals.calendarsSold);
    expect(ranking.totals.cashReceived).toBe(totals.cashReceived);
    expect(ranking.totals.expenses).toBe(totals.expenses);
    expect(ranking.totals.netCash).toBe(totals.netCash);
  });

  // Test 12: Weighted averages are calculated correctly (Total Net Cash / Total Calendars Sold)
  it('12. Weighted averages are calculated as Total Net Cash / Total Calendars Sold', () => {
    const row1 = calculateDay1StudentRow(dummyStudent1, 100); // sold: 8, net: 750, avg: 93.75
    const row2 = calculateDay1StudentRow(dummyStudent2, 100); // sold: 12, net: 1200, avg: 100
    const totals = calculateDay1Totals([row1, row2]);

    // Simple average of (93.75 + 100)/2 = 96.88
    // Weighted average: (750 + 1200) / (8 + 12) = 1950 / 20 = 97.5
    expect(totals.average).toBe(97.5);
    expect(totals.average).not.toBe(96.88);
  });

  // Test 13: Zero calendars sold never causes a division error (returns 0)
  it('13. Zero calendars sold never causes a division error', () => {
    const row = calculateDay1StudentRow(dummyStudentZeroSold, 100);
    expect(row.average).toBe(0);
    expect(Number.isFinite(row.average)).toBe(true);

    const history: CumulativeHistory = {
      previousCumulativeSold: 0,
      previousCumulativeNetCash: 0,
    };
    const rowDay2 = calculateDayStudentRow(dummyStudentZeroSold, history, 100);
    expect(rowDay2.average).toBe(0);
    expect(rowDay2.cumulativeAverage).toBe(0);
  });

  // Test 14: Warnings trigger when sold exceeds taken
  it('14. Warnings trigger when sold exceeds taken', () => {
    const invalidInput: StudentInput = {
      ...dummyStudent1,
      calendarsTaken: 5,
      calendarsSold: 8,
    };
    const row = calculateDay1StudentRow(invalidInput, 100);
    expect(row.hasWarning).toBe(true);
    expect(row.warningMessage).toContain('വിറ്റ കലണ്ടർ കൊണ്ടുപോയതിനേക്കാൾ കൂടുതലാണ്');
  });

  // Test 15: Missing previous days treated as zero without errors
  it('15. Missing previous days treated as zero without errors', () => {
    const history: CumulativeHistory = {
      previousCumulativeSold: 0,
      previousCumulativeNetCash: 0,
    };
    const row = calculateDayStudentRow(dummyStudent1, history, 100);
    expect(row.cumulativeSold).toBe(8);
    expect(row.cumulativeNetCash).toBe(750);
  });
});
