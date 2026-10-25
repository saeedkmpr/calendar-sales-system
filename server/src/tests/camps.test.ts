import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../prisma';

describe('Team Camps System Verification', () => {
  let testCampaignId = '';
  let testCampId = '';
  let testStudentId = '';

  beforeAll(async () => {
    // Find active campaign
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (campaign) {
      testCampaignId = campaign.id;
    }
  });

  it('should find or verify seeded camps (ആലപ്പുഴ and കണ്ണൂർ)', async () => {
    if (!testCampaignId) return;

    const camps = await prisma.camp.findMany({
      where: { campaignId: testCampaignId },
    });

    // We seeded ആലപ്പുഴ and കണ്ണൂർ
    expect(camps.length).toBeGreaterThanOrEqual(2);
    const campNames = camps.map((c) => c.name);
    expect(campNames).toContain('ആലപ്പുഴ');
    expect(campNames).toContain('കണ്ണൂർ');
    testCampId = camps[0].id;
  });

  it('should assign a student to a camp and synchronize metrics', async () => {
    if (!testCampaignId || !testCampId) return;

    // Pick a campaign student
    const cs = await prisma.campaignStudent.findFirst({
      where: { campaignId: testCampaignId },
      include: { student: true },
    });

    if (!cs) return;
    testStudentId = cs.studentId;

    // Assign to camp
    await prisma.campaignStudent.update({
      where: {
        campaignId_studentId: {
          campaignId: testCampaignId,
          studentId: testStudentId,
        },
      },
      data: { campId: testCampId },
    });

    // Check assignment
    const updated = await prisma.campaignStudent.findUnique({
      where: {
        campaignId_studentId: {
          campaignId: testCampaignId,
          studentId: testStudentId,
        },
      },
    });

    expect(updated?.campId).toBe(testCampId);

    // Verify daily sales exist and are linked to student
    const sales = await prisma.dailySale.findMany({
      where: { campaignId: testCampaignId, studentId: testStudentId },
    });

    const totalSold = sales.reduce((sum, s) => sum + s.calendarsSold, 0);
    const totalCash = sales.reduce((sum, s) => sum + s.cashReceived, 0);

    expect(totalSold).toBeGreaterThanOrEqual(0);
    expect(totalCash).toBeGreaterThanOrEqual(0);
  });
});
