import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
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
import { createAuditLog } from '../services/auditService';
import { ImportService } from '../services/importService';

export const salesRouter = Router();

salesRouter.use(authenticateToken);

// GET /api/campaigns/:campaignId/days/:dayNumber
salesRouter.get(
  '/campaigns/:campaignId/days/:dayNumber',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const dayNumber = parseInt(req.params.dayNumber as string, 10);

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല' });
        return;
      }

      const maxDays = Math.max(campaign.durationDays || 7, 7);

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > maxDays) {
        res.status(400).json({ error: `സാധുവായ ദിവസം നൽകുക (Day must be 1 to ${maxDays})` });
        return;
      }

      // Fetch all active campaign students, ordered by studentCode
      const campaignStudents = await prisma.campaignStudent.findMany({
        where: {
          campaignId,
          isActive: true,
          student: { isActive: true },
        },
        include: {
          student: true,
        },
        orderBy: {
          student: { studentCode: 'asc' },
        },
      });

      // Fetch all daily sales up to this day for cumulative calculations
      const allSalesUpToDay = await prisma.dailySale.findMany({
        where: {
          campaignId,
          dayNumber: { lte: dayNumber },
        },
      });

      // Group sales by student and day
      const salesMap: { [studentId: string]: { [day: number]: any } } = {};
      allSalesUpToDay.forEach((s) => {
        if (!salesMap[s.studentId]) {
          salesMap[s.studentId] = {};
        }
        salesMap[s.studentId][s.dayNumber] = s;
      });

      if (dayNumber === 1) {
        // DAY 1 CALCULATION
        const entryRows = campaignStudents.map((cs: any) => {
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
            notes: todaySale?.notes,
          };

          return calculateDay1StudentRow(input, campaign.calendarPrice);
        });

        const entryTotals = calculateDay1Totals(entryRows);
        const ranking = calculateDay1Ranking(entryRows);

        res.json({
          dayNumber: 1,
          calendarPrice: campaign.calendarPrice,
          currency: campaign.currency,
          entryRows,
          entryTotals,
          rankingRows: ranking.rankingRows,
          rankingTotals: ranking.totals,
        });
      } else {
        // DAYS 2 TO 7 CALCULATION
        const entryRows = campaignStudents.map((cs: any) => {
          const studentSales = salesMap[cs.studentId] || {};

          // Calculate previous days' cumulative sold and net cash (Days 1 to dayNumber - 1)
          let previousCumulativeSold = 0;
          let previousCumulativeNetCash = 0;

          for (let d = 1; d < dayNumber; d++) {
            const prevSale = studentSales[d];
            if (prevSale) {
              previousCumulativeSold += prevSale.calendarsSold;
              previousCumulativeNetCash += (prevSale.cashReceived - prevSale.expenses);
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
            notes: todaySale?.notes,
          };

          const history: CumulativeHistory = {
            previousCumulativeSold,
            previousCumulativeNetCash,
          };

          return calculateDayStudentRow(input, history, campaign.calendarPrice);
        });

        const entryTotals = calculateDailyTotals(entryRows);
        const ranking = calculateDailyRanking(entryRows);

        res.json({
          dayNumber,
          calendarPrice: campaign.calendarPrice,
          currency: campaign.currency,
          entryRows,
          entryTotals,
          rankingRows: ranking.rankingRows,
          rankingTotals: ranking.totals,
        });
      }
    } catch (error) {
      console.error('Daily sales fetch error:', error);
      res.status(500).json({ error: 'ദിവസേനയുള്ള വിവരങ്ങൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

const batchEntryItemSchema = z.object({
  studentId: z.string().min(1),
  calendarsTaken: z.number().int().min(0).default(0),
  calendarsSold: z.number().int().min(0).default(0),
  cashReceived: z.number().min(0).default(0),
  expenses: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const batchSaveSchema = z.object({
  entries: z.array(batchEntryItemSchema),
});

// POST /api/campaigns/:campaignId/days/:dayNumber/batch (ADMIN or OPERATOR)
salesRouter.post(
  '/campaigns/:campaignId/days/:dayNumber/batch',
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const dayNumber = parseInt(req.params.dayNumber as string, 10);

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല' });
        return;
      }

      const maxDays = Math.max(campaign.durationDays || 7, 7);

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > maxDays) {
        res.status(400).json({ error: `സാധുവായ ദിവസം നൽകുക (Day must be 1 to ${maxDays})` });
        return;
      }

      const parseResult = batchSaveSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors[0].message });
        return;
      }

      const { entries } = parseResult.data;

      // Execute upserts in transaction
      await prisma.$transaction(
        entries.map((entry) =>
          prisma.dailySale.upsert({
            where: {
              campaignId_studentId_dayNumber: {
                campaignId,
                studentId: entry.studentId,
                dayNumber,
              },
            },
            update: {
              calendarsTaken: entry.calendarsTaken,
              calendarsSold: entry.calendarsSold,
              cashReceived: entry.cashReceived,
              expenses: entry.expenses,
              notes: entry.notes,
              enteredBy: req.user?.id,
            },
            create: {
              campaignId,
              studentId: entry.studentId,
              dayNumber,
              calendarsTaken: entry.calendarsTaken,
              calendarsSold: entry.calendarsSold,
              cashReceived: entry.cashReceived,
              expenses: entry.expenses,
              notes: entry.notes,
              enteredBy: req.user?.id,
            },
          })
        )
      );

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'UPDATE',
        entityType: 'DAILY_SALE',
        newValues: { dayNumber, updatedCount: entries.length },
      });

      res.json({ message: 'വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!', count: entries.length });
    } catch (error: any) {
      console.error('Batch save error:', error);
      res.status(500).json({ error: 'വിവരങ്ങൾ സേവ് ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു' });
    }
  }
);

// POST /api/campaigns/:campaignId/days/:dayNumber/import
salesRouter.post(
  '/campaigns/:campaignId/days/:dayNumber/import',
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const dayNumber = parseInt(req.params.dayNumber as string, 10);
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'ഇറക്കുമതി ചെയ്യേണ്ട വിവരങ്ങൾ നൽകിയിട്ടില്ല' });
        return;
      }

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല' });
        return;
      }

      const maxDays = Math.max(campaign.durationDays || 7, 7);

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > maxDays) {
        res.status(400).json({ error: `സാധുവായ ദിവസം നൽകുക (Day must be 1 to ${maxDays})` });
        return;
      }

      const result = await ImportService.importSingleDaySales(
        campaignId,
        dayNumber,
        req.user?.id || 'system',
        text
      );

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'IMPORT_DAY_SALES',
        entityType: 'DAILY_SALE',
        newValues: { dayNumber, updatedCount: result.count },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Import day sales error:', error);
      res.status(400).json({ error: error.message || 'ഇറക്കുമതി പരാജയപ്പെട്ടു' });
    }
  }
);
