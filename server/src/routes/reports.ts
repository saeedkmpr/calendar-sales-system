import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
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

export const reportsRouter = Router();

// Allow public token verification via query param or header for easy window.open / print downloads
reportsRouter.use(async (req: any, res: Response, next) => {
  if (
    req.query.token &&
    typeof req.query.token === 'string' &&
    req.query.token !== 'null' &&
    req.query.token !== 'undefined' &&
    !req.headers.authorization
  ) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  authenticateToken(req, res, next);
});

// GET /api/reports/campaigns/:campaignId/days/:dayNumber/excel
reportsRouter.get(
  '/campaigns/:campaignId/days/:dayNumber/excel',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const dayNumber = parseInt(req.params.dayNumber as string, 10);

      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const campaignStudents = await prisma.campaignStudent.findMany({
        where: { campaignId, isActive: true, student: { isActive: true } },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      const allSalesUpToDay = await prisma.dailySale.findMany({
        where: { campaignId, dayNumber: { lte: dayNumber } },
      });

      const salesMap: { [studentId: string]: { [day: number]: any } } = {};
      allSalesUpToDay.forEach((s) => {
        if (!salesMap[s.studentId]) salesMap[s.studentId] = {};
        salesMap[s.studentId][s.dayNumber] = s;
      });

      let entryRows: any[] = [];
      let entryTotals: any;
      let rankingRows: any[] = [];
      let rankingTotals: any;

      if (dayNumber === 1) {
        entryRows = campaignStudents.map((cs: any) => {
          const todaySale = salesMap[cs.studentId]?.[1];
          const input: StudentInput = {
            studentId: cs.studentId,
            studentCode: cs.student.studentCode,
            studentName: cs.student.name,
            target: cs.targetCalendars,
            calendarsTaken: todaySale ? todaySale.calendarsTaken : 0,
            calendarsSold: todaySale ? todaySale.calendarsSold : 0,
            cashReceived: todaySale ? todaySale.cashReceived : 0,
            expenses: todaySale ? todaySale.expenses : 0,
          };
          return calculateDay1StudentRow(input, campaign.calendarPrice);
        });

        entryTotals = calculateDay1Totals(entryRows);
        const ranking = calculateDay1Ranking(entryRows);
        rankingRows = ranking.rankingRows;
        rankingTotals = ranking.totals;
      } else {
        entryRows = campaignStudents.map((cs: any) => {
          const studentSales = salesMap[cs.studentId] || {};
          let prevSold = 0;
          let prevNet = 0;
          for (let d = 1; d < dayNumber; d++) {
            const s = studentSales[d];
            if (s) {
              prevSold += s.calendarsSold;
              prevNet += (s.cashReceived - s.expenses);
            }
          }
          const todaySale = studentSales[dayNumber];
          const input: StudentInput = {
            studentId: cs.studentId,
            studentCode: cs.student.studentCode,
            studentName: cs.student.name,
            target: cs.targetCalendars,
            calendarsTaken: todaySale ? todaySale.calendarsTaken : 0,
            calendarsSold: todaySale ? todaySale.calendarsSold : 0,
            cashReceived: todaySale ? todaySale.cashReceived : 0,
            expenses: todaySale ? todaySale.expenses : 0,
          };
          const history: CumulativeHistory = {
            previousCumulativeSold: prevSold,
            previousCumulativeNetCash: prevNet,
          };
          return calculateDayStudentRow(input, history, campaign.calendarPrice);
        });

        entryTotals = calculateDailyTotals(entryRows);
        const ranking = calculateDailyRanking(entryRows);
        rankingRows = ranking.rankingRows;
        rankingTotals = ranking.totals;
      }

      const buffer = await ExcelService.exportDaySales(
        campaign.name,
        dayNumber,
        entryRows,
        entryTotals,
        rankingRows,
        rankingTotals
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Day_${dayNumber}_Report.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Excel report error:', error);
      res.status(500).json({ error: 'Excel export failed' });
    }
  }
);

// GET /api/reports/campaigns/:campaignId/days/:dayNumber/print
reportsRouter.get(
  '/campaigns/:campaignId/days/:dayNumber/print',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const dayNumber = parseInt(req.params.dayNumber as string, 10);

      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).send('Campaign not found');
        return;
      }

      const campaignStudents = await prisma.campaignStudent.findMany({
        where: { campaignId, isActive: true, student: { isActive: true } },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      const allSalesUpToDay = await prisma.dailySale.findMany({
        where: { campaignId, dayNumber: { lte: dayNumber } },
      });

      const salesMap: { [studentId: string]: { [day: number]: any } } = {};
      allSalesUpToDay.forEach((s) => {
        if (!salesMap[s.studentId]) salesMap[s.studentId] = {};
        salesMap[s.studentId][s.dayNumber] = s;
      });

      let entryRows: any[] = [];
      let entryTotals: any;
      let rankingRows: any[] = [];
      let rankingTotals: any;

      if (dayNumber === 1) {
        entryRows = campaignStudents.map((cs: any) => {
          const todaySale = salesMap[cs.studentId]?.[1];
          const input: StudentInput = {
            studentId: cs.studentId,
            studentCode: cs.student.studentCode,
            studentName: cs.student.name,
            target: cs.targetCalendars,
            calendarsTaken: todaySale ? todaySale.calendarsTaken : 0,
            calendarsSold: todaySale ? todaySale.calendarsSold : 0,
            cashReceived: todaySale ? todaySale.cashReceived : 0,
            expenses: todaySale ? todaySale.expenses : 0,
          };
          return calculateDay1StudentRow(input, campaign.calendarPrice);
        });

        entryTotals = calculateDay1Totals(entryRows);
        const ranking = calculateDay1Ranking(entryRows);
        rankingRows = ranking.rankingRows;
        rankingTotals = ranking.totals;
      } else {
        entryRows = campaignStudents.map((cs: any) => {
          const studentSales = salesMap[cs.studentId] || {};
          let prevSold = 0;
          let prevNet = 0;
          for (let d = 1; d < dayNumber; d++) {
            const s = studentSales[d];
            if (s) {
              prevSold += s.calendarsSold;
              prevNet += (s.cashReceived - s.expenses);
            }
          }
          const todaySale = studentSales[dayNumber];
          const input: StudentInput = {
            studentId: cs.studentId,
            studentCode: cs.student.studentCode,
            studentName: cs.student.name,
            target: cs.targetCalendars,
            calendarsTaken: todaySale ? todaySale.calendarsTaken : 0,
            calendarsSold: todaySale ? todaySale.calendarsSold : 0,
            cashReceived: todaySale ? todaySale.cashReceived : 0,
            expenses: todaySale ? todaySale.expenses : 0,
          };
          const history: CumulativeHistory = {
            previousCumulativeSold: prevSold,
            previousCumulativeNetCash: prevNet,
          };
          return calculateDayStudentRow(input, history, campaign.calendarPrice);
        });

        entryTotals = calculateDailyTotals(entryRows);
        const ranking = calculateDailyRanking(entryRows);
        rankingRows = ranking.rankingRows;
        rankingTotals = ranking.totals;
      }

      const html = PdfService.generateDayPrintHtml(
        campaign,
        dayNumber,
        entryRows,
        entryTotals,
        rankingRows,
        rankingTotals
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Print report error:', error);
      res.status(500).send('Print failed');
    }
  }
);

// GET /api/reports/campaigns/:campaignId/summary/excel
reportsRouter.get(
  '/campaigns/:campaignId/summary/excel',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const durationDays = campaign.durationDays || 7;
      const sales = await prisma.dailySale.findMany({ where: { campaignId } });
      const daySalesMap: { [day: number]: any } = {};
      for (let d = 1; d <= durationDays; d++) {
        daySalesMap[d] = { taken: 0, sold: 0, cash: 0, expenses: 0 };
      }
      sales.forEach((s) => {
        if (daySalesMap[s.dayNumber]) {
          daySalesMap[s.dayNumber].taken += s.calendarsTaken;
          daySalesMap[s.dayNumber].sold += s.calendarsSold;
          daySalesMap[s.dayNumber].cash += s.cashReceived;
          daySalesMap[s.dayNumber].expenses += s.expenses;
        }
      });

      const dayRows = [];
      let runningNet = 0;
      let totalSold = 0;
      let totalCash = 0;
      let totalExp = 0;
      let latestStock = 0;

      for (let d = 1; d <= durationDays; d++) {
        const item = daySalesMap[d];
        const dailyNet = item.cash - item.expenses;
        runningNet += dailyNet;
        totalSold += item.sold;
        totalCash += item.cash;
        totalExp += item.expenses;
        const rem = item.taken - item.sold;
        if (item.taken > 0 || item.sold > 0) latestStock = rem;

        dayRows.push({
          dayNumber: d,
          dayLabel: `ദിവസം ${d}`,
          calendarsSold: item.sold,
          remainingCalendars: rem,
          cashReceived: item.cash,
          expenses: item.expenses,
          dailyNetCash: dailyNet,
          cumulativeNetCash: runningNet,
        });
      }

      const totals = {
        totalSold,
        currentStockRemaining: latestStock,
        totalCashReceived: totalCash,
        totalExpenses: totalExp,
        totalNetCash: runningNet,
      };

      const buffer = await ExcelService.exportSummary(campaign.name, dayRows, totals);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Summary_Report.xlsx"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: 'Summary Excel failed' });
    }
  }
);

// GET /api/reports/campaigns/:campaignId/summary/print
reportsRouter.get(
  '/campaigns/:campaignId/summary/print',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).send('Campaign not found');
        return;
      }

      const durationDays = campaign.durationDays || 7;
      const sales = await prisma.dailySale.findMany({ where: { campaignId } });
      const daySalesMap: { [day: number]: any } = {};
      for (let d = 1; d <= durationDays; d++) {
        daySalesMap[d] = { taken: 0, sold: 0, cash: 0, expenses: 0 };
      }
      sales.forEach((s) => {
        if (daySalesMap[s.dayNumber]) {
          daySalesMap[s.dayNumber].taken += s.calendarsTaken;
          daySalesMap[s.dayNumber].sold += s.calendarsSold;
          daySalesMap[s.dayNumber].cash += s.cashReceived;
          daySalesMap[s.dayNumber].expenses += s.expenses;
        }
      });

      const dayRows = [];
      let runningNet = 0;
      let totalSold = 0;
      let totalCash = 0;
      let totalExp = 0;
      let latestStock = 0;

      for (let d = 1; d <= durationDays; d++) {
        const item = daySalesMap[d];
        const dailyNet = item.cash - item.expenses;
        runningNet += dailyNet;
        totalSold += item.sold;
        totalCash += item.cash;
        totalExp += item.expenses;
        const rem = item.taken - item.sold;
        if (item.taken > 0 || item.sold > 0) latestStock = rem;

        dayRows.push({
          dayNumber: d,
          dayLabel: `ദിവസം ${d}`,
          calendarsSold: item.sold,
          remainingCalendars: rem,
          cashReceived: item.cash,
          expenses: item.expenses,
          dailyNetCash: dailyNet,
          cumulativeNetCash: runningNet,
        });
      }

      const totals = {
        totalSold,
        currentStockRemaining: latestStock,
        totalCashReceived: totalCash,
        totalExpenses: totalExp,
        totalNetCash: runningNet,
      };

      const html = PdfService.generateSummaryPrintHtml(campaign, dayRows, totals);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send('Print failed');
    }
  }
);

// GET /api/reports/campaigns/:campaignId/students/excel
reportsRouter.get(
  '/campaigns/:campaignId/students/excel',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const csList = await prisma.campaignStudent.findMany({
        where: { campaignId },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      const students = csList.map((cs: any) => ({
        studentCode: cs.student.studentCode,
        name: cs.student.name,
        targetCalendars: cs.targetCalendars,
        isActive: cs.isActive && cs.student.isActive,
      }));

      const buffer = await ExcelService.exportStudents(campaign.name, students);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Students_List.xlsx"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: 'Excel export failed' });
    }
  }
);

// Helper function to build leaderboard rows for reports
async function getLeaderboardData(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      campaignStudents: {
        where: { isActive: true },
        include: { student: true },
      },
    },
  });

  if (!campaign) return null;

  const allSales = await prisma.dailySale.findMany({ where: { campaignId } });
  const salesByStudent: { [studentId: string]: { taken: number; sold: number; cash: number; exp: number } } = {};
  allSales.forEach((s) => {
    if (!salesByStudent[s.studentId]) {
      salesByStudent[s.studentId] = { taken: 0, sold: 0, cash: 0, exp: 0 };
    }
    salesByStudent[s.studentId].taken += s.calendarsTaken;
    salesByStudent[s.studentId].sold += s.calendarsSold;
    salesByStudent[s.studentId].cash += s.cashReceived;
    salesByStudent[s.studentId].exp += s.expenses;
  });

  const studentRows = campaign.campaignStudents.map((cs) => {
    const agg = salesByStudent[cs.studentId] || { taken: 0, sold: 0, cash: 0, exp: 0 };
    const totalNetCash = agg.cash - agg.exp;
    const remainingStock = agg.taken - agg.sold;
    const targetRemaining = Math.max(0, cs.targetCalendars - agg.sold);
    const average = agg.sold > 0 ? parseFloat((totalNetCash / agg.sold).toFixed(2)) : 0;

    return {
      studentId: cs.studentId,
      studentCode: cs.student.studentCode,
      studentName: cs.student.name,
      target: cs.targetCalendars,
      targetRemaining,
      totalTaken: agg.taken,
      totalSold: agg.sold,
      remainingStock,
      totalCashReceived: agg.cash,
      totalExpenses: agg.exp,
      totalNetCash,
      average,
    };
  });

  studentRows.sort((a, b) => {
    if (b.totalNetCash !== a.totalNetCash) return b.totalNetCash - a.totalNetCash;
    if (b.totalSold !== a.totalSold) return b.totalSold - a.totalSold;
    return a.studentCode.localeCompare(b.studentCode);
  });

  const rankedRows = studentRows.map((r, idx) => ({
    rank: idx + 1,
    ...r,
  }));

  const totalTarget = rankedRows.reduce((acc, r) => acc + r.target, 0);
  const totalTargetRemaining = rankedRows.reduce((acc, r) => acc + r.targetRemaining, 0);
  const totalTaken = rankedRows.reduce((acc, r) => acc + r.totalTaken, 0);
  const totalSold = rankedRows.reduce((acc, r) => acc + r.totalSold, 0);
  const totalRemainingStock = totalTaken - totalSold;
  const totalCashReceived = rankedRows.reduce((acc, r) => acc + r.totalCashReceived, 0);
  const totalExpenses = rankedRows.reduce((acc, r) => acc + r.totalExpenses, 0);
  const totalNetCash = totalCashReceived - totalExpenses;
  const weightedAverage = totalSold > 0 ? parseFloat((totalNetCash / totalSold).toFixed(2)) : 0;

  const totals = {
    totalTarget,
    totalTargetRemaining,
    totalTaken,
    totalSold,
    totalRemainingStock,
    totalCashReceived,
    totalExpenses,
    totalNetCash,
    weightedAverage,
  };

  return { campaign, rows: rankedRows, totals };
}

// GET /api/reports/campaigns/:campaignId/leaderboard/excel
reportsRouter.get(
  '/campaigns/:campaignId/leaderboard/excel',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const data = await getLeaderboardData(campaignId);
      if (!data) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const buffer = await ExcelService.exportLeaderboard(data.campaign.name, data.rows, data.totals);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Student_Leaderboard.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Leaderboard excel error:', error);
      res.status(500).json({ error: 'Excel export failed' });
    }
  }
);

// GET /api/reports/campaigns/:campaignId/leaderboard/print
reportsRouter.get(
  '/campaigns/:campaignId/leaderboard/print',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const data = await getLeaderboardData(campaignId);
      if (!data) {
        res.status(404).send('Campaign not found');
        return;
      }

      const html = PdfService.generateLeaderboardPrintHtml(data.campaign, data.rows, data.totals);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Leaderboard print error:', error);
      res.status(500).send('Print failed');
    }
  }
);

// GET /api/reports/campaigns/:campaignId/camps/:campId/print
reportsRouter.get(
  '/campaigns/:campaignId/camps/:campId/print',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campId = req.params.campId as string;
      const camp = await prisma.camp.findUnique({
        where: { id: campId },
        include: { campaign: true },
      });

      if (!camp) {
        res.status(404).send('Camp not found');
        return;
      }

      const csList = await prisma.campaignStudent.findMany({
        where: { campId, isActive: true },
        include: { student: true },
      });

      const studentIds = csList.map((cs) => cs.studentId);
      const sales = await prisma.dailySale.findMany({
        where: { campaignId: camp.campaignId, studentId: { in: studentIds } },
      });

      const salesMap: { [studentId: string]: { taken: number; sold: number; cash: number; exp: number } } = {};
      studentIds.forEach((id) => { salesMap[id] = { taken: 0, sold: 0, cash: 0, exp: 0 }; });
      sales.forEach((s) => {
        if (salesMap[s.studentId]) {
          salesMap[s.studentId].taken += s.calendarsTaken;
          salesMap[s.studentId].sold += s.calendarsSold;
          salesMap[s.studentId].cash += s.cashReceived;
          salesMap[s.studentId].exp += s.expenses;
        }
      });

      const studentRows = csList.map((cs) => {
        const s = salesMap[cs.studentId] || { taken: 0, sold: 0, cash: 0, exp: 0 };
        const netCash = Math.round((s.cash - s.exp) * 100) / 100;
        const remainingStock = s.taken - s.sold;
        const target = cs.targetCalendars || 0;
        const targetRemaining = Math.max(0, target - s.sold);
        const average = s.sold > 0 ? Math.round((netCash / s.sold) * 100) / 100 : 0;
        const progress = target > 0 ? Math.min(100, Math.round((s.sold / target) * 100)) : 0;

        return {
          studentId: cs.studentId,
          studentCode: cs.student.studentCode,
          studentName: cs.student.name,
          target,
          targetRemaining,
          calendarsTaken: s.taken,
          calendarsSold: s.sold,
          remainingStock,
          cashReceived: s.cash,
          expenses: s.exp,
          netCash,
          average,
          progressPercentage: progress,
        };
      });

      studentRows.sort((a, b) => b.netCash - a.netCash || b.calendarsSold - a.calendarsSold);
      const rankedStudents = studentRows.map((r, idx) => ({ rank: idx + 1, ...r }));

      let totalTarget = 0;
      let totalTargetRemaining = 0;
      let totalTaken = 0;
      let totalSold = 0;
      let totalStock = 0;
      let totalCash = 0;
      let totalExp = 0;
      let totalNet = 0;

      rankedStudents.forEach((s) => {
        totalTarget += s.target;
        totalTargetRemaining += s.targetRemaining;
        totalTaken += s.calendarsTaken;
        totalSold += s.calendarsSold;
        totalStock += s.remainingStock;
        totalCash += s.cashReceived;
        totalExp += s.expenses;
        totalNet += s.netCash;
      });

      const totals = {
        totalTarget,
        totalTargetRemaining,
        totalTaken,
        totalSold,
        totalRemainingStock: totalStock,
        totalCashReceived: totalCash,
        totalExpenses: totalExp,
        totalNetCash: totalNet,
        weightedAverage: totalSold > 0 ? Math.round((totalNet / totalSold) * 100) / 100 : 0,
        progressPercentage: totalTarget > 0 ? Math.min(100, Math.round((totalSold / totalTarget) * 100)) : 0,
      };

      const html = PdfService.generateCampPrintHtml(camp.campaign, camp, rankedStudents, totals);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send('Print failed');
    }
  }
);
