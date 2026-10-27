import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
  console.log('🔄 Checking if real data restore is required...');

  const backupFile = path.resolve(__dirname, 'real_backup.json');
  if (!fs.existsSync(backupFile)) {
    console.error('❌ real_backup.json not found!');
    return;
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  // Check if real students already exist
  const existingRealStudent = await prisma.student.findFirst({
    where: { name: 'നുഅ്മാൻ പടപ്പറമ്പ്' },
  });

  if (existingRealStudent) {
    console.log('✅ Real student data is already present in database. Preserving live data.');
    return;
  }

  console.log('🚀 Restoring authentic user data into PostgreSQL...');

  // Clean dummy demo data
  await prisma.dailySale.deleteMany();
  await prisma.campaignStudent.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.student.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 1. Insert Users
  for (const u of backup.users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        isActive: u.isActive,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.users.length} Users.`);

  // 2. Insert Campaign
  for (const c of backup.campaigns) {
    await prisma.campaign.create({
      data: {
        id: c.id,
        name: c.name,
        institutionName: c.institutionName,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        durationDays: c.durationDays,
        calendarPrice: c.calendarPrice,
        currency: c.currency,
        description: c.description,
        status: c.status,
        createdBy: c.createdBy,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.campaigns.length} Campaigns.`);

  // 3. Insert Students
  for (const s of backup.students) {
    await prisma.student.create({
      data: {
        id: s.id,
        studentCode: s.studentCode,
        name: s.name,
        isActive: s.isActive,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.students.length} Students.`);

  // 4. Insert Camps
  for (const camp of backup.camps) {
    await prisma.camp.create({
      data: {
        id: camp.id,
        campaignId: camp.campaignId,
        name: camp.name,
        location: camp.location,
        leaderName: camp.leaderName,
        notes: camp.notes,
        createdAt: new Date(camp.createdAt),
        updatedAt: new Date(camp.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.camps.length} Camps.`);

  // 5. Insert CampaignStudents
  for (const cs of backup.campaignStudents) {
    await prisma.campaignStudent.create({
      data: {
        id: cs.id,
        campaignId: cs.campaignId,
        studentId: cs.studentId,
        campId: cs.campId,
        targetCalendars: cs.targetCalendars,
        isActive: cs.isActive,
        createdAt: new Date(cs.createdAt),
        updatedAt: new Date(cs.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.campaignStudents.length} CampaignStudent relations.`);

  // 6. Insert DailySales
  for (const ds of backup.dailySales) {
    await prisma.dailySale.create({
      data: {
        id: ds.id,
        campaignId: ds.campaignId,
        studentId: ds.studentId,
        dayNumber: ds.dayNumber,
        calendarsTaken: ds.calendarsTaken,
        calendarsSold: ds.calendarsSold,
        cashReceived: ds.cashReceived,
        expenses: ds.expenses,
        notes: ds.notes,
        enteredBy: ds.enteredBy,
        createdAt: new Date(ds.createdAt),
        updatedAt: new Date(ds.updatedAt),
      },
    });
  }
  console.log(`✅ Restored ${backup.dailySales.length} DailySales records.`);
  console.log('🎉 REAL DATA RESTORE COMPLETED SUCCESSFULLY!');
}

restore()
  .catch((e) => {
    console.error('Error during data restore:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
