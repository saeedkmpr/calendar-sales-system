import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

export const usersRouter = Router();

usersRouter.use(authenticateToken);
usersRouter.use(requireRole(['ADMIN']));

const userCreateSchema = z.object({
  name: z.string().min(1, 'പേര് നൽകണം'),
  username: z.string().min(3, 'യൂസർനെയിം കുറഞ്ഞത് 3 അക്ഷരങ്ങൾ വേണം'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം'),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).default('OPERATOR'),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// GET /api/users
usersRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
usersRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = userCreateSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'ഈ യൂസർനെയിം അല്ലെങ്കിൽ ഇമെയിൽ നിലവിലുണ്ട്' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        passwordHash,
        role: data.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      newValues: { username: newUser.username, role: newUser.role },
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'ഉപയോക്താവിനെ ചേർക്കാൻ സാധിച്ചില്ല' });
  }
});

// PUT /api/users/:id
usersRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = userUpdateSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'ഉപയോക്താവിനെ കണ്ടെത്താനായില്ല' });
      return;
    }

    let passwordHash: string | undefined;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email !== undefined ? (data.email || null) : undefined,
        role: data.role,
        isActive: data.isActive,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: updated.id,
      newValues: { username: updated.username, role: updated.role, isActive: updated.isActive },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'അപ്ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല' });
  }
});

const adminChangePasswordSchema = z.object({
  newPassword: z.string().min(6, 'പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം'),
});

// PUT /api/users/:id/password (Admin resetting any user's password directly)
usersRouter.put('/:id/password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const parseResult = adminChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { newPassword } = parseResult.data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'ഉപയോക്താവിനെ കണ്ടെത്താനായില്ല' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: existing.id,
      newValues: { targetUser: existing.username, resetBy: req.user?.name },
    });

    res.json({ message: `"${existing.name}" (${existing.username}) എന്ന ഉപയോക്താവിന്റെ പാസ്‌വേഡ് വിജയകരമായി മാറ്റി!` });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'പാസ്‌വേഡ് മാറ്റാൻ സാധിച്ചില്ല' });
  }
});
