import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

export const auditRouter = Router();

auditRouter.use(authenticateToken);
auditRouter.use(requireRole(['ADMIN']));

// GET /api/audit-logs
auditRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, entityType, limit } = req.query;

    const where: any = {};
    if (campaignId && typeof campaignId === 'string') {
      where.campaignId = campaignId;
    }
    if (entityType && typeof entityType === 'string') {
      where.entityType = entityType;
    }

    const take = limit ? Math.min(parseInt(limit as string, 10), 100) : 50;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        campaign: { select: { name: true } },
      },
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
