import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { ImportService } from '../services/importService';

export const campaignsRouter = Router();

campaignsRouter.use(authenticateToken);

const campaignSchema = z.object({
  name: z.string().min(1, 'ക്യാമ്പയിൻ പേര് നൽകണം (Name is required)'),
  institutionName: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  durationDays: z.number().int().min(1).default(7),
  calendarPrice: z.number().positive().default(100.0),
  currency: z.string().default('₹'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).default('ACTIVE'),
});

// GET /api/campaigns
campaignsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { campaignStudents: true },
        },
      },
    });

    const result = campaigns.map((c: any) => ({
      ...c,
      studentCount: c._count.campaignStudents,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id
campaignsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: { campaignStudents: true },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല (Campaign not found)' });
      return;
    }

    res.json({
      ...campaign,
      studentCount: (campaign as any)._count.campaignStudents,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns (ADMIN)
campaignsRouter.post('/', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = campaignSchema.parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        institutionName: data.institutionName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        durationDays: data.durationDays,
        calendarPrice: data.calendarPrice,
        currency: data.currency,
        description: data.description,
        status: data.status,
        createdBy: req.user?.id,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      campaignId: campaign.id,
      action: 'CREATE',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      newValues: campaign,
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id (ADMIN)
campaignsRouter.put('/:id', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const data = campaignSchema.partial().parse(req.body);

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      campaignId: updated.id,
      action: 'UPDATE',
      entityType: 'CAMPAIGN',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update campaign' });
  }
});

// POST /api/campaigns/:id/cancel (ADMIN - Cancel campaign)
campaignsRouter.post('/:id/cancel', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      campaignId: updated.id,
      action: 'CANCEL',
      entityType: 'CAMPAIGN',
      entityId: updated.id,
      oldValues: { status: existing.status },
      newValues: { status: 'CANCELLED' },
    });

    res.json({ message: 'ക്യാമ്പയിൻ വിജയകരമായി റദ്ദാക്കി', campaign: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to cancel campaign' });
  }
});

// DELETE /api/campaigns/:id (ADMIN - Delete campaign completely)
campaignsRouter.delete('/:id', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Cascade delete sales and campaign students
    await prisma.dailySale.deleteMany({ where: { campaignId: id } });
    await prisma.campaignStudent.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DELETE',
      entityType: 'CAMPAIGN',
      entityId: id,
      oldValues: existing,
    });

    res.json({ message: 'ക്യാമ്പയിൻ പൂർണ്ണമായി നീക്കം ചെയ്തു' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete campaign' });
  }
});

// POST /api/campaigns/:id/reset-sales (ADMIN - Clear daily sales entries, keep students)
campaignsRouter.post('/:id/reset-sales', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const deleteResult = await prisma.dailySale.deleteMany({
      where: { campaignId: id },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      campaignId: id,
      action: 'RESET_SALES',
      entityType: 'DAILY_SALE',
      newValues: { clearedCount: deleteResult.count },
    });

    res.json({
      message: '7 ദിവസത്തെ എല്ലാ വിൽപ്പന വിവരങ്ങളും വിജയകരമായി റീസെറ്റ് ചെയ്തു',
      clearedCount: deleteResult.count,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reset sales' });
  }
});

// POST /api/campaigns/:id/reset-all (ADMIN - Clear sales AND all students for fresh start)
campaignsRouter.post('/:id/reset-all', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Delete sales first, then campaign student associations
    await prisma.dailySale.deleteMany({ where: { campaignId: id } });
    const studentsDeleted = await prisma.campaignStudent.deleteMany({ where: { campaignId: id } });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      campaignId: id,
      action: 'RESET_ALL',
      entityType: 'CAMPAIGN',
      newValues: { removedStudentsCount: studentsDeleted.count },
    });

    res.json({
      message: 'ക്യാമ്പയിൻ വിവരങ്ങൾ പൂർണ്ണമായി റീസെറ്റ് ചെയ്തു. ഇനി നിങ്ങൾക്ക് പുതിയ കുട്ടികളെ ചേർക്കാം.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reset campaign' });
  }
});

// GET /api/campaigns/:id/dashboard
campaignsRouter.get('/:id/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        campaignStudents: {
          where: { isActive: true },
          include: { student: true },
        },
        dailySales: true,
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const students = (campaign as any).campaignStudents || [];
    const sales = (campaign as any).dailySales || [];

    const totalStudents = students.length;
    const totalTarget = students.reduce((sum: number, s: any) => sum + s.targetCalendars, 0);

    const totalTaken = sales.reduce((sum: number, s: any) => sum + s.calendarsTaken, 0);
    const totalSold = sales.reduce((sum: number, s: any) => sum + s.calendarsSold, 0);
    const totalRemainingStock = totalTaken - totalSold;
    const totalCashReceived = sales.reduce((sum: number, s: any) => sum + s.cashReceived, 0);
    const totalExpenses = sales.reduce((sum: number, s: any) => sum + s.expenses, 0);
    const totalNetCash = totalCashReceived - totalExpenses;
    const progressPercentage = totalTarget > 0 ? Math.round((totalSold / totalTarget) * 100 * 10) / 10 : 0;

    const studentSalesMap: {
      [studentId: string]: {
        name: string;
        code: string;
        target: number;
        sold: number;
        netCash: number;
      };
    } = {};

    for (const cs of students) {
      studentSalesMap[cs.studentId] = {
        name: cs.student.name,
        code: cs.student.studentCode,
        target: cs.targetCalendars,
        sold: 0,
        netCash: 0,
      };
    }

    for (const s of sales) {
      if (studentSalesMap[s.studentId]) {
        studentSalesMap[s.studentId].sold += s.calendarsSold;
        studentSalesMap[s.studentId].netCash += (s.cashReceived - s.expenses);
      }
    }

    let completedTargetCount = 0;
    let remainingTargetCount = 0;
    const studentStats = Object.values(studentSalesMap);

    for (const stat of studentStats) {
      if (stat.sold >= stat.target && stat.target > 0) {
        completedTargetCount++;
      } else {
        remainingTargetCount++;
      }
    }

    const topStudentsByNetCash = [...studentStats]
      .sort((a, b) => b.netCash - a.netCash)
      .slice(0, 5);

    const topStudentsBySold = [...studentStats]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const dayStats: {
      [day: number]: {
        dayNumber: number;
        dayLabel: string;
        sold: number;
        taken: number;
        remaining: number;
        cashReceived: number;
        expenses: number;
        netCash: number;
      };
    } = {};

    const durationDays = campaign.durationDays || 7;

    for (let d = 1; d <= durationDays; d++) {
      dayStats[d] = {
        dayNumber: d,
        dayLabel: `ദിവസം ${d}`,
        sold: 0,
        taken: 0,
        remaining: 0,
        cashReceived: 0,
        expenses: 0,
        netCash: 0,
      };
    }

    for (const s of sales) {
      if (dayStats[s.dayNumber]) {
        dayStats[s.dayNumber].sold += s.calendarsSold;
        dayStats[s.dayNumber].taken += s.calendarsTaken;
        dayStats[s.dayNumber].cashReceived += s.cashReceived;
        dayStats[s.dayNumber].expenses += s.expenses;
        dayStats[s.dayNumber].netCash += (s.cashReceived - s.expenses);
      }
    }

    let highestDailyNetCash = 0;
    for (let d = 1; d <= durationDays; d++) {
      dayStats[d].remaining = dayStats[d].taken - dayStats[d].sold;
      if (dayStats[d].netCash > highestDailyNetCash) {
        highestDailyNetCash = dayStats[d].netCash;
      }
    }

    res.json({
      campaign,
      metrics: {
        totalStudents,
        totalTarget,
        totalTaken,
        totalSold,
        totalRemainingStock,
        totalCashReceived,
        totalExpenses,
        totalNetCash,
        progressPercentage,
        completedTargetCount,
        remainingTargetCount,
        highestDailyNetCash,
      },
      topStudentsByNetCash,
      topStudentsBySold,
      dailyTrend: Object.values(dayStats),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard statistics' });
  }
});

// POST /api/campaigns/:id/import-workbook (Import whole Excel workbook or CSV multi-day text)
campaignsRouter.post(
  '/:id/import-workbook',
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.id as string;
      const { text, fileBase64 } = req.body;

      const result = await ImportService.importWorkbookData(campaignId, req.user?.id || 'system', {
        text,
        fileBase64,
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'IMPORT_WORKBOOK',
        entityType: 'CAMPAIGN',
        newValues: result,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Import workbook error:', error);
      res.status(400).json({ error: error.message || 'ഇറക്കുമതി പരാജയപ്പെട്ടു' });
    }
  }
);

// GET /api/campaigns/:id/leaderboard (Full student leaderboard across all days, ranked by net cash)
campaignsRouter.get('/:id/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        campaignStudents: {
          where: { isActive: true },
          include: { student: true },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const allSales = await prisma.dailySale.findMany({
      where: { campaignId },
    });

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

    // Sort by totalNetCash descending, tie-breaker: totalSold descending, then studentCode
    studentRows.sort((a, b) => {
      if (b.totalNetCash !== a.totalNetCash) {
        return b.totalNetCash - a.totalNetCash;
      }
      if (b.totalSold !== a.totalSold) {
        return b.totalSold - a.totalSold;
      }
      return a.studentCode.localeCompare(b.studentCode);
    });

    // Assign rank
    const rankedRows = studentRows.map((r, idx) => ({
      rank: idx + 1,
      ...r,
    }));

    // Grand totals
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

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        institutionName: campaign.institutionName,
        calendarPrice: campaign.calendarPrice,
        currency: campaign.currency,
      },
      rows: rankedRows,
      totals,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});
