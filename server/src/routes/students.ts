import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

export const studentsRouter = Router();

studentsRouter.use(authenticateToken);

const studentCreateSchema = z.object({
  studentCode: z.string().min(1, 'റോൾ നമ്പർ നൽകണം'),
  name: z.string().min(1, 'കുട്ടിയുടെ പേര് നൽകണം'),
  targetCalendars: z.number().int().min(1).default(50),
});

const studentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  targetCalendars: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/campaigns/:campaignId/students
studentsRouter.get('/campaigns/:campaignId/students', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const { search, status } = req.query;

    const whereClause: any = {
      campaignId,
    };

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const campaignStudents = await prisma.campaignStudent.findMany({
      where: whereClause,
      include: {
        student: true,
      },
      orderBy: {
        student: { studentCode: 'asc' },
      },
    });

    let result = campaignStudents.map((cs: any) => ({
      id: cs.id,
      campaignId: cs.campaignId,
      studentId: cs.studentId,
      studentCode: cs.student.studentCode,
      name: cs.student.name,
      targetCalendars: cs.targetCalendars,
      isActive: cs.isActive && cs.student.isActive,
      createdAt: cs.createdAt,
    }));

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/campaigns/:campaignId/students (Add student to campaign)
studentsRouter.post(
  '/campaigns/:campaignId/students',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const data = studentCreateSchema.parse(req.body);

      // Verify campaign exists
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        res.status(404).json({ error: 'ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല' });
        return;
      }

      // Check if student with same code exists globally
      let student = await prisma.student.findUnique({
        where: { studentCode: data.studentCode },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            studentCode: data.studentCode,
            name: data.name,
            isActive: true,
          },
        });
      } else {
        // Update name if changed
        if (student.name !== data.name) {
          student = await prisma.student.update({
            where: { id: student.id },
            data: { name: data.name },
          });
        }
      }

      // Check if already in campaign
      const existingLink = await prisma.campaignStudent.findUnique({
        where: {
          campaignId_studentId: {
            campaignId,
            studentId: student.id,
          },
        },
      });

      if (existingLink) {
        res.status(400).json({ error: 'ഈ കുട്ടി ഇതിനകം ഈ ക്യാമ്പയിനിൽ ഉൾപ്പെട്ടിട്ടുണ്ട് (Duplicate student)' });
        return;
      }

      const campaignStudent = await prisma.campaignStudent.create({
        data: {
          campaignId,
          studentId: student.id,
          targetCalendars: data.targetCalendars,
          isActive: true,
        },
        include: { student: true },
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'CREATE',
        entityType: 'STUDENT',
        entityId: student.id,
        newValues: {
          name: student.name,
          studentCode: student.studentCode,
          target: data.targetCalendars,
        },
      });

      res.status(201).json({
        id: campaignStudent.id,
        campaignId: campaignStudent.campaignId,
        studentId: campaignStudent.studentId,
        studentCode: (campaignStudent as any).student.studentCode,
        name: (campaignStudent as any).student.name,
        targetCalendars: campaignStudent.targetCalendars,
        isActive: campaignStudent.isActive,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'കുട്ടിയെ ചേർക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

// PUT /api/campaigns/:campaignId/students/:studentId
studentsRouter.put(
  '/campaigns/:campaignId/students/:studentId',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const studentId = req.params.studentId as string;
      const data = studentUpdateSchema.parse(req.body);

      const existingCS = await prisma.campaignStudent.findUnique({
        where: {
          campaignId_studentId: { campaignId, studentId },
        },
        include: { student: true },
      });

      if (!existingCS) {
        res.status(404).json({ error: 'കുട്ടിയെ കണ്ടെത്താനായില്ല' });
        return;
      }

      if (data.name && data.name !== (existingCS as any).student.name) {
        await prisma.student.update({
          where: { id: studentId },
          data: { name: data.name },
        });
      }

      const updatedCS = await prisma.campaignStudent.update({
        where: { id: existingCS.id },
        data: {
          targetCalendars: data.targetCalendars !== undefined ? data.targetCalendars : existingCS.targetCalendars,
          isActive: data.isActive !== undefined ? data.isActive : existingCS.isActive,
        },
        include: { student: true },
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'UPDATE',
        entityType: 'STUDENT',
        entityId: studentId,
        oldValues: {
          name: (existingCS as any).student.name,
          target: existingCS.targetCalendars,
          isActive: existingCS.isActive,
        },
        newValues: {
          name: (updatedCS as any).student.name,
          target: updatedCS.targetCalendars,
          isActive: updatedCS.isActive,
        },
      });

      res.json({
        id: updatedCS.id,
        campaignId: updatedCS.campaignId,
        studentId: updatedCS.studentId,
        studentCode: (updatedCS as any).student.studentCode,
        name: (updatedCS as any).student.name,
        targetCalendars: updatedCS.targetCalendars,
        isActive: updatedCS.isActive,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല' });
    }
  }
);

// DELETE /api/campaigns/:campaignId/students/:studentId (ADMIN - Remove student from campaign)
studentsRouter.delete(
  '/campaigns/:campaignId/students/:studentId',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const studentId = req.params.studentId as string;

      const existingCS = await prisma.campaignStudent.findUnique({
        where: {
          campaignId_studentId: { campaignId, studentId },
        },
        include: { student: true },
      });

      if (!existingCS) {
        res.status(404).json({ error: 'കുട്ടിയെ കണ്ടെത്താനായില്ല' });
        return;
      }

      // Delete student daily sales in this campaign, then remove link
      await prisma.dailySale.deleteMany({
        where: { campaignId, studentId },
      });

      await prisma.campaignStudent.delete({
        where: { id: existingCS.id },
      });

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'DELETE',
        entityType: 'STUDENT',
        entityId: studentId,
        oldValues: { name: (existingCS as any).student.name },
      });

      res.json({ message: 'വിദ്യാർത്ഥിയെ ഈ ക്യാമ്പയിനിൽ നിന്ന് ഒഴിവാക്കി' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'കുട്ടിയെ ഒഴിവാക്കാൻ സാധിച്ചില്ല' });
    }
  }
);

// POST /api/campaigns/:campaignId/students/import (Bulk import)
studentsRouter.post(
  '/campaigns/:campaignId/students/import',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        res.status(400).json({ error: 'സാധുവായ കുട്ടികളുടെ ലിസ്റ്റ് നൽകുക (Valid array required)' });
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;

      for (const item of students) {
        const studentCode = String(item.studentCode || item.code || '').trim();
        const name = String(item.name || item.studentName || '').trim();
        const target = parseInt(item.targetCalendars || item.target || '50', 10) || 50;

        if (!studentCode || !name) continue;

        let student = await prisma.student.findUnique({
          where: { studentCode },
        });

        if (!student) {
          student = await prisma.student.create({
            data: { studentCode, name, isActive: true },
          });
        } else {
          if (student.name !== name) {
            student = await prisma.student.update({
              where: { id: student.id },
              data: { name },
            });
          }
        }

        const existingCS = await prisma.campaignStudent.findUnique({
          where: {
            campaignId_studentId: {
              campaignId,
              studentId: student.id,
            },
          },
        });

        if (existingCS) {
          await prisma.campaignStudent.update({
            where: { id: existingCS.id },
            data: { targetCalendars: target, isActive: true },
          });
          updatedCount++;
        } else {
          await prisma.campaignStudent.create({
            data: {
              campaignId,
              studentId: student.id,
              targetCalendars: target,
              isActive: true,
            },
          });
          importedCount++;
        }
      }

      await createAuditLog({
        userId: req.user?.id,
        userName: req.user?.name,
        campaignId,
        action: 'IMPORT',
        entityType: 'STUDENT',
        newValues: { importedCount, updatedCount },
      });

      res.json({
        message: 'വിജയകരമായി ഇറക്കുമതി ചെയ്തു',
        importedCount,
        updatedCount,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ error: 'കുട്ടികളെ ഇറക്കുമതി ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു' });
    }
  }
);

// GET /api/campaigns/:campaignId/students/:studentId/history
studentsRouter.get(
  '/campaigns/:campaignId/students/:studentId/history',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;
      const studentId = req.params.studentId as string;

      const cs = await prisma.campaignStudent.findUnique({
        where: {
          campaignId_studentId: { campaignId, studentId },
        },
        include: {
          student: true,
          campaign: true,
        },
      });

      if (!cs) {
        res.status(404).json({ error: 'കുട്ടിയെ കണ്ടെത്താനായില്ല' });
        return;
      }

      const sales = await prisma.dailySale.findMany({
        where: { campaignId, studentId },
        orderBy: { dayNumber: 'asc' },
      });

      const dayMap: { [day: number]: any } = {};
      sales.forEach((s) => {
        dayMap[s.dayNumber] = s;
      });

      let cumulativeSold = 0;
      let cumulativeNetCash = 0;
      const historyRows = [];
      const durationDays = cs.campaign?.durationDays || 7;

      for (let day = 1; day <= durationDays; day++) {
        const s = dayMap[day] || {
          dayNumber: day,
          calendarsTaken: 0,
          calendarsSold: 0,
          cashReceived: 0,
          expenses: 0,
          notes: '',
        };

        const netCash = s.cashReceived - s.expenses;
        cumulativeSold += s.calendarsSold;
        cumulativeNetCash += netCash;
        const remainingStock = s.calendarsTaken - s.calendarsSold;
        const targetRemaining = Math.max(0, cs.targetCalendars - cumulativeSold);
        const average = s.calendarsSold > 0 ? netCash / s.calendarsSold : 0;
        const cumulativeAverage = cumulativeSold > 0 ? cumulativeNetCash / cumulativeSold : 0;

        historyRows.push({
          dayNumber: day,
          calendarsTaken: s.calendarsTaken,
          calendarsSold: s.calendarsSold,
          remainingStock,
          cumulativeSold,
          targetRemaining,
          cashReceived: s.cashReceived,
          expenses: s.expenses,
          netCash,
          average: Math.round(average * 100) / 100,
          cumulativeNetCash,
          cumulativeAverage: Math.round(cumulativeAverage * 100) / 100,
          notes: s.notes,
        });
      }

      res.json({
        student: {
          id: (cs as any).student.id,
          code: (cs as any).student.studentCode,
          name: (cs as any).student.name,
          target: cs.targetCalendars,
          isActive: cs.isActive,
        },
        campaign: {
          id: (cs as any).campaign.id,
          name: (cs as any).campaign.name,
          calendarPrice: (cs as any).campaign.calendarPrice,
          currency: (cs as any).campaign.currency,
        },
        totals: {
          target: cs.targetCalendars,
          cumulativeSold,
          targetRemaining: Math.max(0, cs.targetCalendars - cumulativeSold),
          cumulativeNetCash,
          targetAchievedPercentage:
            cs.targetCalendars > 0
              ? Math.min(100, Math.round((cumulativeSold / cs.targetCalendars) * 100))
              : 0,
        },
        days: historyRows,
      });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ error: 'വിവരങ്ങൾ എടുക്കാൻ സാധിച്ചില്ല' });
    }
  }
);
