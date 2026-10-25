import ExcelJS from 'exceljs';
import {
  Day1RowData,
  DailySalesRowData,
  RankingRowData,
  DayTotalsData
} from '../types';

export class ExcelService {
  /**
   * Export Day Sales and Ranking to Excel with two separate worksheets:
   * Sheet 1: Data Entry Table
   * Sheet 2: Automatic Ranking Table
   */
  static async exportDaySales(
    campaignName: string,
    dayNumber: number,
    entryRows: (Day1RowData | DailySalesRowData)[],
    entryTotals: DayTotalsData,
    rankingRows: RankingRowData[],
    rankingTotals: any
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Calendar Sales Management System';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    };

    const totalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // Slate 200
    };

    const totalFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      bold: true,
      size: 11,
    };

    // SHEET 1: DATA ENTRY TABLE
    const sheet1 = workbook.addWorksheet(`ദിവസം ${dayNumber} - എൻട്രി`);
    sheet1.views = [{ showGridLines: true }];

    // Title rows
    sheet1.mergeCells('A1:J1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = `${campaignName} — ദിവസം ${dayNumber} (ഡാറ്റാ എൻട്രി)`;
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    let headers: string[] = [];
    if (dayNumber === 1) {
      headers = [
        'റോൾ നമ്പർ',
        'കുട്ടിയുടെ പേര്',
        'ടാർഗറ്റ്',
        'കൊണ്ടുപോയ കലണ്ടർ',
        'വിറ്റ കലണ്ടർ',
        'ബാക്കി കലണ്ടർ',
        'ലഭിച്ച കാശ്',
        'ചെലവ്',
        'ബാക്കി കാശ്',
        'ശരാശരി',
      ];
    } else {
      headers = [
        'റോൾ നമ്പർ',
        'കുട്ടിയുടെ പേര്',
        'ടാർഗറ്റ്',
        'ടാർഗറ്റിൽ ബാക്കി',
        'കൊണ്ടുപോയ കലണ്ടർ',
        'വിറ്റ കലണ്ടർ',
        'ബാക്കി കലണ്ടർ',
        'ആകെ വിറ്റ കലണ്ടർ',
        'ലഭിച്ച കാശ്',
        'ചെലവ്',
        'ബാക്കി കാശ്',
        'ശരാശരി',
        'ആകെ ബാക്കി',
        'ആകെ ശരാശരി',
      ];
    }

    const headerRow1 = sheet1.addRow(headers);
    headerRow1.height = 24;
    headerRow1.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add rows
    entryRows.forEach((r) => {
      let rowValues: any[] = [];
      if (dayNumber === 1) {
        const d1 = r as Day1RowData;
        rowValues = [
          d1.studentCode,
          d1.studentName,
          d1.target,
          d1.calendarsTaken,
          d1.calendarsSold,
          d1.remainingCalendars,
          d1.cashReceived,
          d1.expenses,
          d1.netCash,
          d1.average,
        ];
      } else {
        const d = r as DailySalesRowData;
        rowValues = [
          d.studentCode,
          d.studentName,
          d.target,
          d.targetRemaining,
          d.calendarsTaken,
          d.calendarsSold,
          d.remainingCalendars,
          d.cumulativeSold,
          d.cashReceived,
          d.expenses,
          d.netCash,
          d.average,
          d.cumulativeNetCash,
          d.cumulativeAverage,
        ];
      }
      const row = sheet1.addRow(rowValues);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }; // Name left aligned
    });

    // Add Entry Totals Row
    let totalRowValues: any[] = [];
    if (dayNumber === 1) {
      totalRowValues = [
        '',
        'ആകെ (SUM)',
        entryTotals.target,
        entryTotals.calendarsTaken,
        entryTotals.calendarsSold,
        entryTotals.remainingCalendars,
        entryTotals.cashReceived,
        entryTotals.expenses,
        entryTotals.netCash,
        entryTotals.average,
      ];
    } else {
      totalRowValues = [
        '',
        'ആകെ (SUM)',
        entryTotals.target,
        entryTotals.targetRemaining || 0,
        entryTotals.calendarsTaken,
        entryTotals.calendarsSold,
        entryTotals.remainingCalendars,
        entryTotals.cumulativeSold || 0,
        entryTotals.cashReceived,
        entryTotals.expenses,
        entryTotals.netCash,
        entryTotals.average,
        entryTotals.cumulativeNetCash || 0,
        entryTotals.cumulativeAverage || 0,
      ];
    }

    const tRow = sheet1.addRow(totalRowValues);
    tRow.height = 22;
    tRow.eachCell((cell) => {
      cell.fill = totalFill;
      cell.font = totalFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    tRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    // Auto fit column widths
    sheet1.columns.forEach((col) => {
      col.width = 18;
    });
    sheet1.getColumn(2).width = 28;

    // SHEET 2: AUTOMATIC RANKING TABLE
    const sheet2 = workbook.addWorksheet(`ദിവസം ${dayNumber} - റാങ്കിംഗ്`);
    sheet2.views = [{ showGridLines: true }];

    sheet2.mergeCells('A1:I1');
    const rTitleCell = sheet2.getCell('A1');
    rTitleCell.value = `${campaignName} — ദിവസം ${dayNumber} റാങ്കിംഗ് പട്ടിക`;
    rTitleCell.font = { name: 'Segoe UI', size: 14, bold: true };
    rTitleCell.alignment = { horizontal: 'center' };

    let rHeaders: string[] = [];
    if (dayNumber === 1) {
      rHeaders = [
        'റാങ്ക്',
        'കുട്ടിയുടെ പേര്',
        'വിറ്റ കലണ്ടർ',
        'ലഭിച്ച കാശ്',
        'ചെലവ്',
        'ബാക്കി കാശ്',
        'ശരാശരി',
      ];
    } else {
      rHeaders = [
        'റാങ്ക്',
        'കുട്ടിയുടെ പേര്',
        'വിറ്റ കലണ്ടർ',
        'ലഭിച്ച കാശ്',
        'ചെലവ്',
        'ബാക്കി കാശ്',
        'ശരാശരി',
        'ആകെ വിറ്റ കലണ്ടർ',
        'ആകെ ബാക്കി',
      ];
    }

    const headerRow2 = sheet2.addRow(rHeaders);
    headerRow2.height = 24;
    headerRow2.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF065F46' }, // Emerald 800
      };
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    rankingRows.forEach((r) => {
      let rRowVals: any[] = [];
      if (dayNumber === 1) {
        rRowVals = [
          r.rank,
          r.studentName,
          r.calendarsSold,
          r.cashReceived,
          r.expenses,
          r.netCash,
          r.average,
        ];
      } else {
        rRowVals = [
          r.rank,
          r.studentName,
          r.calendarsSold,
          r.cashReceived,
          r.expenses,
          r.netCash,
          r.average,
          r.cumulativeSold || 0,
          r.cumulativeNetCash || 0,
        ];
      }
      const rRow = sheet2.addRow(rRowVals);
      rRow.alignment = { vertical: 'middle', horizontal: 'center' };
      rRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Ranking SUM row
    let rSumVals: any[] = [];
    if (dayNumber === 1) {
      rSumVals = [
        '',
        'ആകെ (SUM)',
        rankingTotals.calendarsSold,
        rankingTotals.cashReceived,
        rankingTotals.expenses,
        rankingTotals.netCash,
        rankingTotals.weightedAverage,
      ];
    } else {
      rSumVals = [
        '',
        'ആകെ (SUM)',
        rankingTotals.calendarsSold,
        rankingTotals.cashReceived,
        rankingTotals.expenses,
        rankingTotals.netCash,
        rankingTotals.weightedAverage,
        rankingTotals.cumulativeSold || 0,
        rankingTotals.cumulativeNetCash || 0,
      ];
    }

    const rSumRow = sheet2.addRow(rSumVals);
    rSumRow.height = 22;
    rSumRow.eachCell((cell) => {
      cell.fill = totalFill;
      cell.font = totalFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    rSumRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    sheet2.columns.forEach((col) => {
      col.width = 18;
    });
    sheet2.getColumn(2).width = 28;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export Overall 7-Day Summary to Excel
   */
  static async exportSummary(
    campaignName: string,
    dailySummaries: any[],
    totals: any
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ആകെ സംഗ്രഹം');

    sheet.mergeCells('A1:G1');
    const title = sheet.getCell('A1');
    title.value = `${campaignName} — ആകെ സംഗ്രഹം (Overall Summary)`;
    title.font = { name: 'Segoe UI', size: 14, bold: true };
    title.alignment = { horizontal: 'center' };

    const headers = [
      'ദിവസം',
      'ആകെ വിറ്റ കലണ്ടർ',
      'ആകെ ബാക്കി കലണ്ടർ',
      'ലഭിച്ച കാശ്',
      'ചെലവ്',
      'അന്നത്തെ ബാക്കി കാശ്',
      'ആകെ ബാക്കി കാശ്',
    ];

    const hRow = sheet.addRow(headers);
    hRow.height = 24;
    hRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.font = { name: 'Segoe UI', color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    dailySummaries.forEach((d) => {
      const row = sheet.addRow([
        d.dayLabel || `ദിവസം ${d.dayNumber}`,
        d.calendarsSold,
        d.remainingCalendars,
        d.cashReceived,
        d.expenses,
        d.dailyNetCash,
        d.cumulativeNetCash,
      ]);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const totalRow = sheet.addRow([
      'ആകെ തുക',
      totals.totalSold,
      totals.currentStockRemaining,
      totals.totalCashReceived,
      totals.totalExpenses,
      totals.totalNetCash,
      totals.totalNetCash,
    ]);
    totalRow.height = 22;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.font = { name: 'Segoe UI', bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export Student List to Excel
   */
  static async exportStudents(
    campaignName: string,
    students: any[]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('കുട്ടികളുടെ പട്ടിക');

    sheet.mergeCells('A1:D1');
    const title = sheet.getCell('A1');
    title.value = `${campaignName} — കുട്ടികളുടെ പട്ടിക`;
    title.font = { name: 'Segoe UI', size: 14, bold: true };
    title.alignment = { horizontal: 'center' };

    const headers = ['റോൾ നമ്പർ', 'കുട്ടിയുടെ പേര്', 'ടാർഗറ്റ് കലണ്ടറുകൾ', 'നില'];
    const hRow = sheet.addRow(headers);
    hRow.height = 24;
    hRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.font = { name: 'Segoe UI', color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    students.forEach((s) => {
      const row = sheet.addRow([
        s.studentCode,
        s.name,
        s.targetCalendars,
        s.isActive ? 'സജീവം' : 'നിഷ്‌ക്രിയം',
      ]);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    });

    sheet.columns.forEach((col) => {
      col.width = 22;
    });
    sheet.getColumn(2).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export Full Student Leaderboard / Cumulative Summary to Excel
   */
  static async exportLeaderboard(
    campaignName: string,
    rows: any[],
    totals: any
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('കുട്ടികളുടെ ആകെ കണക്ക്');

    sheet.mergeCells('A1:L1');
    const title = sheet.getCell('A1');
    title.value = `${campaignName} — കുട്ടികളുടെ ആകെ കണക്കും റാങ്കിംഗും (Student Leaderboard)`;
    title.font = { name: 'Segoe UI', size: 14, bold: true };
    title.alignment = { horizontal: 'center' };

    const headers = [
      'റാങ്ക്',
      'റോൾ നമ്പർ',
      'കുട്ടിയുടെ പേര്',
      'ടാർഗറ്റ്',
      'ടാർഗറ്റിൽ ബാക്കി',
      'ആകെ കൊണ്ടുപോയത്',
      'ആകെ വിറ്റത്',
      'ബാക്കി സ്റ്റോക്ക്',
      'ആകെ ലഭിച്ച കാശ്',
      'ആകെ ചെലവ്',
      'ആകെ ബാക്കി കാശ്',
      'ശരാശരി',
    ];

    const hRow = sheet.addRow(headers);
    hRow.height = 24;
    hRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF065F46' }, // Emerald 800
      };
      cell.font = { name: 'Segoe UI', color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    rows.forEach((r) => {
      const row = sheet.addRow([
        r.rank,
        r.studentCode,
        r.studentName,
        r.target,
        r.targetRemaining,
        r.totalTaken,
        r.totalSold,
        r.remainingStock,
        r.totalCashReceived,
        r.totalExpenses,
        r.totalNetCash,
        r.average,
      ]);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    });

    const sumRow = sheet.addRow([
      '',
      '',
      'ആകെ (SUM)',
      totals.totalTarget,
      totals.totalTargetRemaining,
      totals.totalTaken,
      totals.totalSold,
      totals.totalRemainingStock,
      totals.totalCashReceived,
      totals.totalExpenses,
      totals.totalNetCash,
      totals.weightedAverage,
    ]);
    sumRow.height = 22;
    sumRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.font = { name: 'Segoe UI', bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    sumRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

    sheet.columns.forEach((col) => {
      col.width = 18;
    });
    sheet.getColumn(3).width = 28;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
