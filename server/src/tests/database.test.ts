import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../prisma';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Database is already seeded
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Campaign exists and has students linked', async () => {
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        campaignStudents: true,
      },
    });

    expect(campaign).toBeDefined();
    expect(campaign?.campaignStudents?.length || 0).toBeGreaterThan(0);
  });

  it('Default users exist with correct roles', async () => {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const operator = await prisma.user.findUnique({ where: { username: 'operator' } });
    const viewer = await prisma.user.findUnique({ where: { username: 'viewer' } });

    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');

    expect(operator).toBeDefined();
    expect(operator?.role).toBe('OPERATOR');

    expect(viewer).toBeDefined();
    expect(viewer?.role).toBe('VIEWER');
  });

  it('Daily sales records exist for Day 1', async () => {
    const sales = await prisma.dailySale.findMany({
      where: { dayNumber: 1 },
    });

    expect(sales.length).toBeGreaterThan(0);
  });
});
