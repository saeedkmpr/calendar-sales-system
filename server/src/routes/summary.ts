import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

export const summaryRouter = Router();

summaryRouter.use(authenticateToken);

// GET /api/campaigns/:campaignId/summary
summaryRouter.get(
  '/campaigns/:campaignId/summary',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല' });
        return;
      }

      // Fetch all daily sales for this campaign
      const sales = await prisma.dailySale.findMany({
        where: { campaignId },
      });

      // Group sales by day
      const daySalesMap: {
        [day: number]: {
          taken: number;
          sold: number;
          cash: number;
          expenses: number;
        };
      } = {};

      const durationDays = Math.max(campaign.durationDays || 7, 7);

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
      let runningCumulativeNetCash = 0;
      let totalSoldAllDays = 0;
      let totalCashReceivedAllDays = 0;
      let totalExpensesAllDays = 0;
      let latestDayStock = 0;

      for (let day = 1; day <= durationDays; day++) {
        const d = daySalesMap[day];
        const dailyNetCash = d.cash - d.expenses;
        runningCumulativeNetCash += dailyNetCash;
        totalSoldAllDays += d.sold;
        totalCashReceivedAllDays += d.cash;
        totalExpensesAllDays += d.expenses;

        const dayRemainingStock = d.taken - d.sold;
        if (d.taken > 0 || d.sold > 0) {
          latestDayStock = dayRemainingStock;
        }

        dayRows.push({
          dayNumber: day,
          dayLabel: `ദിവസം ${day}`,
          calendarsSold: d.sold,
          remainingCalendars: dayRemainingStock,
          cashReceived: d.cash,
          expenses: d.expenses,
          dailyNetCash,
          cumulativeNetCash: runningCumulativeNetCash,
        });
      }

      const totals = {
        totalSold: totalSoldAllDays,
        currentStockRemaining: latestDayStock,
        totalCashReceived: totalCashReceivedAllDays,
        totalExpenses: totalExpensesAllDays,
        totalNetCash: runningCumulativeNetCash,
      };

      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          institutionName: campaign.institutionName,
          calendarPrice: campaign.calendarPrice,
          currency: campaign.currency,
        },
        dailySummaries: dayRows,
        totals,
      });
    } catch (error) {
      console.error('Summary fetch error:', error);
      res.status(500).json({ error: 'ആകെ സംഗ്രഹം ലഭ്യമാക്കാൻ സാധിച്ചില്ല' });
    }
  }
);
