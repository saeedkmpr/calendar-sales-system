import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import {
  calculateDay1StudentRow,
  calculateDayStudentRow,
  calculateDay1Totals,
  calculateDailyTotals,
  StudentInput,
  CumulativeHistory,
} from '../services/calculations';

export const campsRouter = Router();

// Camp creation schema
const campSchema = z.object({
  name: z.string().min(1, 'ക്യാമ്പിന്റെ പേര് ആവശ്യമാണ് (Camp name is required)'),
  location: z.string().optional(),
  leaderName: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Helper to compute full cumulative metrics for a list of students in a campaign
 */
async function getStudentMetricsForCampaign(campaignId: string, campaignStudents: any[]) {
  if (campaignStudents.length === 0) return [];

  const studentIds = campaignStudents.map((cs) => cs.studentId);
  const sales = await prisma.dailySale.findMany({
    where: { campaignId, studentId: { in: studentIds } },
  });

  const salesMap: {
    [studentId: string]: { taken: number; sold: number; cash: number; exp: number };
  } = {};

  studentIds.forEach((id) => {
    salesMap[id] = { taken: 0, sold: 0, cash: 0, exp: 0 };
  });

  sales.forEach((s) => {
    if (salesMap[s.studentId]) {
      salesMap[s.studentId].taken += s.calendarsTaken;
      salesMap[s.studentId].sold += s.calendarsSold;
      salesMap[s.studentId].cash += s.cashReceived;
      salesMap[s.studentId].exp += s.expenses;
    }
  });

  const studentRows = campaignStudents.map((cs) => {
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
      isTargetCompleted: s.sold >= target,
    };
  });

  // Sort by netCash descending (tie-breaker: sold desc, studentCode asc)
  studentRows.sort((a, b) => {
    if (b.netCash !== a.netCash) return b.netCash - a.netCash;
    if (b.calendarsSold !== a.calendarsSold) return b.calendarsSold - a.calendarsSold;
    return a.studentCode.localeCompare(b.studentCode);
  });

  // Assign ranks
  return studentRows.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * GET /api/campaigns/:campaignId/camps
 * Returns all camps with aggregated totals, ranked students, and unassigned students
 */
campsRouter.get(
  '/campaigns/:campaignId/camps',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Check if camps exist; if not, initialize the default camps requested ("ആലപ്പുഴ", "കണ്ണൂർ")
      const existingCamps = await prisma.camp.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'asc' },
      });

      if (existingCamps.length === 0) {
        await prisma.camp.createMany({
          data: [
            {
              campaignId,
              name: 'ആലപ്പുഴ',
              location: 'ആലപ്പുഴ ജില്ല (Alappuzha)',
              leaderName: 'ക്യാമ്പ് ഇൻചാർജ്',
              notes: 'ആലപ്പുഴ ടീം ക്യാമ്പ്',
            },
            {
              campaignId,
              name: 'കണ്ണൂർ',
              location: 'കണ്ണൂർ ജില്ല (Kannur)',
              leaderName: 'ക്യാമ്പ് ഇൻചാർജ്',
              notes: 'കണ്ണൂർ ടീം ക്യാമ്പ്',
            },
          ],
        });
      }

      // Re-fetch all camps
      const camps = await prisma.camp.findMany({
        where: { campaignId },
        orderBy: { name: 'asc' },
      });

      // Fetch all campaign students
      const allCampaignStudents = await prisma.campaignStudent.findMany({
        where: { campaignId, isActive: true, student: { isActive: true } },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      // Group students by campId
      const campStudentsMap: { [campId: string]: any[] } = {};
      const unassignedList: any[] = [];

      camps.forEach((c) => {
        campStudentsMap[c.id] = [];
      });

      allCampaignStudents.forEach((cs) => {
        if (cs.campId && campStudentsMap[cs.campId]) {
          campStudentsMap[cs.campId].push(cs);
        } else {
          unassignedList.push(cs);
        }
      });

      // Calculate metrics for each camp
      const campsData = await Promise.all(
        camps.map(async (camp) => {
          const csList = campStudentsMap[camp.id] || [];
          const students = await getStudentMetricsForCampaign(campaignId, csList);

          // Sum camp totals
          let totalTarget = 0;
          let totalTargetRemaining = 0;
          let totalTaken = 0;
          let totalSold = 0;
          let totalStock = 0;
          let totalCash = 0;
          let totalExp = 0;
          let totalNet = 0;

          students.forEach((s) => {
            totalTarget += s.target;
            totalTargetRemaining += s.targetRemaining;
            totalTaken += s.calendarsTaken;
            totalSold += s.calendarsSold;
            totalStock += s.remainingStock;
            totalCash += s.cashReceived;
            totalExp += s.expenses;
            totalNet += s.netCash;
          });

          const weightedAvg = totalSold > 0 ? Math.round((totalNet / totalSold) * 100) / 100 : 0;
          const progress = totalTarget > 0 ? Math.min(100, Math.round((totalSold / totalTarget) * 100)) : 0;

          return {
            id: camp.id,
            campaignId: camp.campaignId,
            name: camp.name,
            location: camp.location,
            leaderName: camp.leaderName,
            notes: camp.notes,
            studentCount: students.length,
            totals: {
              totalTarget,
              totalTargetRemaining,
              totalTaken,
              totalSold,
              totalRemainingStock: totalStock,
              totalCashReceived: totalCash,
              totalExpenses: totalExp,
              totalNetCash: totalNet,
              weightedAverage: weightedAvg,
              progressPercentage: progress,
            },
            students,
          };
        })
      );

      // Unassigned students with their metrics
      const unassignedStudents = await getStudentMetricsForCampaign(campaignId, unassignedList);

      let unassignedTotalTarget = 0;
      let unassignedTotalTargetRemaining = 0;
      let unassignedTotalTaken = 0;
      let unassignedTotalSold = 0;
      let unassignedTotalStock = 0;
      let unassignedTotalCash = 0;
      let unassignedTotalExp = 0;
      let unassignedTotalNet = 0;

      unassignedStudents.forEach((s) => {
        unassignedTotalTarget += s.target;
        unassignedTotalTargetRemaining += s.targetRemaining;
        unassignedTotalTaken += s.calendarsTaken;
        unassignedTotalSold += s.calendarsSold;
        unassignedTotalStock += s.remainingStock;
        unassignedTotalCash += s.cashReceived;
        unassignedTotalExp += s.expenses;
        unassignedTotalNet += s.netCash;
      });

      const unassignedWeightedAvg =
        unassignedTotalSold > 0 ? Math.round((unassignedTotalNet / unassignedTotalSold) * 100) / 100 : 0;
      const unassignedProgress =
        unassignedTotalTarget > 0
          ? Math.min(100, Math.round((unassignedTotalSold / unassignedTotalTarget) * 100))
          : 0;

      const unassignedTotals = {
        totalTarget: unassignedTotalTarget,
        totalTargetRemaining: unassignedTotalTargetRemaining,
        totalTaken: unassignedTotalTaken,
        totalSold: unassignedTotalSold,
        totalRemainingStock: unassignedTotalStock,
        totalCashReceived: unassignedTotalCash,
        totalExpenses: unassignedTotalExp,
        totalNetCash: unassignedTotalNet,
        weightedAverage: unassignedWeightedAvg,
        progressPercentage: unassignedProgress,
      };

      // Day-by-day calculations for unassigned students
      const durationDays = Math.max(campaign.durationDays || 7, 7);
      const unassignedStudentIds = unassignedList.map((cs) => cs.studentId);

      const allUnassignedSales =
        unassignedStudentIds.length > 0
          ? await prisma.dailySale.findMany({
              where: {
                campaignId,
                studentId: { in: unassignedStudentIds },
              },
            })
          : [];

      const unassignedSalesMap: { [studentId: string]: { [day: number]: any } } = {};
      allUnassignedSales.forEach((s) => {
        if (!unassignedSalesMap[s.studentId]) {
          unassignedSalesMap[s.studentId] = {};
        }
        unassignedSalesMap[s.studentId][s.dayNumber] = s;
      });

      const unassignedDaySales: { [day: number]: { dayNumber: number; rows: any[]; totals: any } } = {};
      const unassignedDailySummary: any[] = [];
      let runningCumulativeNetCash = 0;

      for (let d = 1; d <= durationDays; d++) {
        let entryRows: any[] = [];
        let dayTotals: any;

        if (d === 1) {
          entryRows = unassignedList.map((cs: any) => {
            const sale = unassignedSalesMap[cs.studentId]?.[1];
            const input: StudentInput = {
              studentId: cs.studentId,
              studentCode: cs.student.studentCode,
              studentName: cs.student.name,
              target: cs.targetCalendars || 0,
              calendarsTaken: sale?.calendarsTaken || 0,
              calendarsSold: sale?.calendarsSold || 0,
              cashReceived: sale?.cashReceived || 0,
              expenses: sale?.expenses || 0,
              notes: sale?.notes,
            };
            return calculateDay1StudentRow(input, campaign.calendarPrice);
          });
          dayTotals = calculateDay1Totals(entryRows);
        } else {
          entryRows = unassignedList.map((cs: any) => {
            const sMap = unassignedSalesMap[cs.studentId] || {};
            let prevSold = 0;
            let prevNet = 0;
            for (let prevD = 1; prevD < d; prevD++) {
              const prevSale = sMap[prevD];
              if (prevSale) {
                prevSold += prevSale.calendarsSold;
                prevNet += prevSale.cashReceived - prevSale.expenses;
              }
            }
            const sale = sMap[d];
            const input: StudentInput = {
              studentId: cs.studentId,
              studentCode: cs.student.studentCode,
              studentName: cs.student.name,
              target: cs.targetCalendars || 0,
              calendarsTaken: sale?.calendarsTaken || 0,
              calendarsSold: sale?.calendarsSold || 0,
              cashReceived: sale?.cashReceived || 0,
              expenses: sale?.expenses || 0,
              notes: sale?.notes,
            };
            const history: CumulativeHistory = {
              previousCumulativeSold: prevSold,
              previousCumulativeNetCash: prevNet,
            };
            return calculateDayStudentRow(input, history, campaign.calendarPrice);
          });
          dayTotals = calculateDailyTotals(entryRows);
        }

        unassignedDaySales[d] = {
          dayNumber: d,
          rows: entryRows,
          totals: dayTotals,
        };

        const dayNet = dayTotals.netCash || 0;
        runningCumulativeNetCash += dayNet;

        unassignedDailySummary.push({
          dayNumber: d,
          dayLabel: `Day ${d}`,
          calendarsSold: dayTotals.calendarsSold || 0,
          remainingStock: dayTotals.remainingCalendars || 0,
          cashReceived: dayTotals.cashReceived || 0,
          expenses: dayTotals.expenses || 0,
          dailyNetCash: dayNet,
          cumulativeNetCash: runningCumulativeNetCash,
          average:
            (dayTotals.calendarsSold || 0) > 0
              ? Math.round((dayNet / dayTotals.calendarsSold) * 100) / 100
              : 0,
        });
      }

      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          currency: campaign.currency,
          calendarPrice: campaign.calendarPrice,
          durationDays,
        },
        camps: campsData,
        unassignedStudents,
        unassignedTotals,
        unassignedDailySummary,
        unassignedDaySales,
        durationDays,
        totalCampCount: camps.length,
      });
    } catch (error: any) {
      console.error('Error fetching camps:', error);
      res.status(500).json({ error: 'ക്യാമ്പ് വിവരങ്ങൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * POST /api/campaigns/:campaignId/camps
 * Create a new team camp
 */
campsRouter.post(
  '/campaigns/:campaignId/camps',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const data = campSchema.parse(req.body);

      // Prevent duplicate camp names in the same campaign
      const existing = await prisma.camp.findUnique({
        where: {
          campaignId_name: {
            campaignId,
            name: data.name.trim(),
          },
        },
      });

      if (existing) {
        res.status(400).json({ error: 'ഈ പേരിൽ ഇതിനകം ഒരു ക്യാമ്പ് നിലവിലുണ്ട്' });
        return;
      }

      const camp = await prisma.camp.create({
        data: {
          campaignId,
          name: data.name.trim(),
          location: data.location?.trim() || null,
          leaderName: data.leaderName?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'CREATE',
        entityType: 'CAMP',
        entityId: camp.id,
        newValues: camp,
      });

      res.status(201).json(camp);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'ക്യാമ്പ് നിർമ്മിക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * PUT /api/camps/:id
 * Edit camp details
 */
campsRouter.put(
  '/camps/:id',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = campSchema.parse(req.body);

      const existing = await prisma.camp.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      const updated = await prisma.camp.update({
        where: { id },
        data: {
          name: data.name.trim(),
          location: data.location?.trim() || null,
          leaderName: data.leaderName?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId: updated.campaignId,
        action: 'UPDATE',
        entityType: 'CAMP',
        entityId: updated.id,
        oldValues: existing,
        newValues: updated,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'ക്യാമ്പ് അപ്ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * DELETE /api/camps/:id
 * Delete a camp (unassigns students safely back to unassigned list)
 */
campsRouter.delete(
  '/camps/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const camp = await prisma.camp.findUnique({ where: { id } });
      if (!camp) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      // Unassign students first
      await prisma.campaignStudent.updateMany({
        where: { campId: id },
        data: { campId: null },
      });

      // Delete the camp
      await prisma.camp.delete({ where: { id } });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId: camp.campaignId,
        action: 'DELETE',
        entityType: 'CAMP',
        entityId: id,
        oldValues: camp,
      });

      res.json({ message: 'ക്യാമ്പ് വിജയകരമായി നീക്കം ചെയ്തു', campId: id });
    } catch (error: any) {
      res.status(500).json({ error: 'ക്യാമ്പ് ഇല്ലാതാക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * POST /api/camps/:id/students
 * Assign an existing student to this camp (from the dropdown)
 */
campsRouter.post(
  '/camps/:id/students',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campId = req.params.id as string;
      const { studentId } = req.body;

      if (!studentId) {
        res.status(400).json({ error: 'Student ID ആവശ്യമാണ്' });
        return;
      }

      const camp = await prisma.camp.findUnique({ where: { id: campId } });
      if (!camp) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      // Check if student exists in this campaign
      let campaignStudent = await prisma.campaignStudent.findUnique({
        where: {
          campaignId_studentId: {
            campaignId: camp.campaignId,
            studentId,
          },
        },
      });

      if (!campaignStudent) {
        // Register student into campaign and assign to camp
        campaignStudent = await prisma.campaignStudent.create({
          data: {
            campaignId: camp.campaignId,
            studentId,
            campId,
            targetCalendars: 100,
          },
        });
      } else {
        // Update existing campaign student's camp
        campaignStudent = await prisma.campaignStudent.update({
          where: { id: campaignStudent.id },
          data: { campId },
        });
      }

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId: camp.campaignId,
        action: 'UPDATE',
        entityType: 'CAMP_ASSIGNMENT',
        entityId: campId,
        newValues: { campId, studentId },
      });

      res.json({ message: 'വിദ്യാർത്ഥിയെ ക്യാമ്പിലേക്ക് ചേർത്തു', campaignStudent });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'വിദ്യാർത്ഥിയെ ചേർക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * POST /api/camps/:id/new-student
 * Register a brand-new student and assign them immediately to this camp & campaign
 */
campsRouter.post(
  '/camps/:id/new-student',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campId = req.params.id as string;
      const { name, target, studentCode } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'കുട്ടിയുടെ പേര് ആവശ്യമാണ്' });
        return;
      }

      const camp = await prisma.camp.findUnique({ where: { id: campId } });
      if (!camp) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      // Generate roll code if not provided
      let code = studentCode?.trim();
      if (!code) {
        const count = await prisma.student.count();
        code = `STU${String(count + 1).padStart(3, '0')}`;
      }

      // Check for code uniqueness
      const existingStudent = await prisma.student.findUnique({ where: { studentCode: code } });
      if (existingStudent) {
        code = `STU${Date.now().toString().slice(-4)}`;
      }

      const targetVal = target ? parseInt(target, 10) : 100;

      // Create student & assign to campaign and camp in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({
          data: {
            name: name.trim(),
            studentCode: code,
            isActive: true,
          },
        });

        const cs = await tx.campaignStudent.create({
          data: {
            campaignId: camp.campaignId,
            studentId: student.id,
            campId,
            targetCalendars: targetVal,
          },
        });

        return { student, cs };
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId: camp.campaignId,
        action: 'CREATE',
        entityType: 'STUDENT',
        entityId: result.student.id,
        newValues: { student: result.student, camp: camp.name },
      });

      res.status(201).json({
        message: 'പുതിയ കുട്ടിയെ ക്യാമ്പിലേക്ക് ചേർത്തു',
        student: result.student,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'കുട്ടിയെ ചേർക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * DELETE /api/camps/:id/students/:studentId
 * Unassign a student from a camp
 */
campsRouter.delete(
  '/camps/:id/students/:studentId',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campId = req.params.id as string;
      const studentId = req.params.studentId as string;

      const camp = await prisma.camp.findUnique({ where: { id: campId } });
      if (!camp) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      await prisma.campaignStudent.updateMany({
        where: {
          campaignId: camp.campaignId,
          studentId,
          campId,
        },
        data: {
          campId: null,
        },
      });

      res.json({ message: 'വിദ്യാർത്ഥിയെ ക്യാമ്പിൽ നിന്ന് മാറ്റി' });
    } catch (error: any) {
      res.status(500).json({ error: 'വിദ്യാർത്ഥിയെ നീക്കം ചെയ്യാൻ സാധിച്ചില്ല' });
    }
  }
);

/**
 * GET /api/camps/:id/export/excel
 * Export this camp's leaderboard to Excel
 */
campsRouter.get(
  '/camps/:id/export/excel',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const camp = await prisma.camp.findUnique({
        where: { id },
        include: { campaign: true },
      });

      if (!camp) {
        res.status(404).json({ error: 'Camp not found' });
        return;
      }

      const csList = await prisma.campaignStudent.findMany({
        where: { campId: id, isActive: true },
        include: { student: true },
      });

      const students = await getStudentMetricsForCampaign(camp.campaignId, csList);

      let totalTarget = 0;
      let totalTargetRemaining = 0;
      let totalTaken = 0;
      let totalSold = 0;
      let totalStock = 0;
      let totalCash = 0;
      let totalExp = 0;
      let totalNet = 0;

      students.forEach((s) => {
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
      };

      const rows = students.map((s) => ({
        rank: s.rank,
        studentCode: s.studentCode,
        studentName: s.studentName,
        target: s.target,
        targetRemaining: s.targetRemaining,
        totalTaken: s.calendarsTaken,
        totalSold: s.calendarsSold,
        remainingStock: s.remainingStock,
        totalCashReceived: s.cashReceived,
        totalExpenses: s.expenses,
        totalNetCash: s.netCash,
        average: s.average,
      }));

      const buffer = await ExcelService.exportLeaderboard(
        `${camp.campaign.name} - ${camp.name} ക്യാമ്പ്`,
        rows,
        totals
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(camp.name)}_Camp_Report.xlsx"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: 'Excel export failed' });
    }
  }
);

/**
 * GET /api/camps/:id/print
 * Printable official camp report
 */
campsRouter.get(
  '/camps/:id/print',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const camp = await prisma.camp.findUnique({
        where: { id },
        include: { campaign: true },
      });

      if (!camp) {
        res.status(404).send('Camp not found');
        return;
      }

      const csList = await prisma.campaignStudent.findMany({
        where: { campId: id, isActive: true },
        include: { student: true },
      });

      const students = await getStudentMetricsForCampaign(camp.campaignId, csList);

      let totalTarget = 0;
      let totalTargetRemaining = 0;
      let totalTaken = 0;
      let totalSold = 0;
      let totalStock = 0;
      let totalCash = 0;
      let totalExp = 0;
      let totalNet = 0;

      students.forEach((s) => {
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

      const html = PdfService.generateCampPrintHtml(camp.campaign, camp, students, totals);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      res.status(500).send('Print failed');
    }
  }
);

/**
 * GET /api/campaigns/:campaignId/camps/unassigned/export/excel
 * Export unassigned students report to Excel
 */
campsRouter.get(
  '/campaigns/:campaignId/camps/unassigned/export/excel',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const allCamps = await prisma.camp.findMany({ where: { campaignId }, select: { id: true } });
      const campIds = allCamps.map((c) => c.id);

      const unassignedList = await prisma.campaignStudent.findMany({
        where: {
          campaignId,
          isActive: true,
          OR: [
            { campId: null },
            { campId: { notIn: campIds } },
          ],
        },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      const students = await getStudentMetricsForCampaign(campaignId, unassignedList);

      let totalTarget = 0;
      let totalTargetRemaining = 0;
      let totalTaken = 0;
      let totalSold = 0;
      let totalStock = 0;
      let totalCash = 0;
      let totalExp = 0;
      let totalNet = 0;

      students.forEach((s) => {
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
      };

      const rows = students.map((s) => ({
        rank: s.rank,
        studentCode: s.studentCode,
        studentName: s.studentName,
        target: s.target,
        targetRemaining: s.targetRemaining,
        totalTaken: s.calendarsTaken,
        totalSold: s.calendarsSold,
        remainingStock: s.remainingStock,
        totalCashReceived: s.cashReceived,
        totalExpenses: s.expenses,
        totalNetCash: s.netCash,
        average: s.average,
      }));

      const buffer = await ExcelService.exportLeaderboard(
        `${campaign.name} - ക്യാമ്പിൽ ഇല്ലാത്ത കുട്ടികൾ (Non-Camp Students)`,
        rows,
        totals
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Non_Camp_Students_Report.xlsx"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Unassigned excel export error:', error);
      res.status(500).json({ error: 'Excel export failed' });
    }
  }
);

/**
 * GET /api/campaigns/:campaignId/camps/unassigned/print
 * Printable official non-camp students report
 */
campsRouter.get(
  '/campaigns/:campaignId/camps/unassigned/print',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).send('Campaign not found');
        return;
      }

      const allCamps = await prisma.camp.findMany({ where: { campaignId }, select: { id: true } });
      const campIds = allCamps.map((c) => c.id);

      const unassignedList = await prisma.campaignStudent.findMany({
        where: {
          campaignId,
          isActive: true,
          OR: [
            { campId: null },
            { campId: { notIn: campIds } },
          ],
        },
        include: { student: true },
        orderBy: { student: { studentCode: 'asc' } },
      });

      const students = await getStudentMetricsForCampaign(campaignId, unassignedList);

      let totalTarget = 0;
      let totalTargetRemaining = 0;
      let totalTaken = 0;
      let totalSold = 0;
      let totalStock = 0;
      let totalCash = 0;
      let totalExp = 0;
      let totalNet = 0;

      students.forEach((s) => {
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

      const durationDays = Math.max(campaign.durationDays || 7, 7);
      const unassignedStudentIds = unassignedList.map((cs) => cs.studentId);
      const allSales = unassignedStudentIds.length > 0
        ? await prisma.dailySale.findMany({ where: { campaignId, studentId: { in: unassignedStudentIds } } })
        : [];

      const daySalesMap: { [day: number]: { sold: number; stock: number; cash: number; expenses: number } } = {};
      for (let d = 1; d <= durationDays; d++) daySalesMap[d] = { sold: 0, stock: 0, cash: 0, expenses: 0 };
      allSales.forEach((s) => {
        if (daySalesMap[s.dayNumber]) {
          daySalesMap[s.dayNumber].sold += s.calendarsSold;
          daySalesMap[s.dayNumber].stock += (s.calendarsTaken - s.calendarsSold);
          daySalesMap[s.dayNumber].cash += s.cashReceived;
          daySalesMap[s.dayNumber].expenses += s.expenses;
        }
      });

      let runningCumulativeNet = 0;
      const dailySummary = [];
      for (let d = 1; d <= durationDays; d++) {
        const item = daySalesMap[d];
        const dayNet = item.cash - item.expenses;
        runningCumulativeNet += dayNet;
        dailySummary.push({
          dayNumber: d,
          dayLabel: `ദിവസം ${d}`,
          calendarsSold: item.sold,
          remainingStock: item.stock,
          cashReceived: item.cash,
          expenses: item.expenses,
          dailyNetCash: dayNet,
          cumulativeNetCash: runningCumulativeNet,
          average: item.sold > 0 ? Math.round((dayNet / item.sold) * 100) / 100 : 0,
        });
      }

      const html = PdfService.generateUnassignedPrintHtml(campaign, students, totals, dailySummary);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      console.error('Unassigned print error:', error);
      res.status(500).send('Print failed');
    }
  }
);
