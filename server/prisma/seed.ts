import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const malayalamStudents = [
  { code: 'S01', name: 'മുഹമ്മദ്‌ റഫീഖ്' },
  { code: 'S02', name: 'ഫാത്തിമ സന' },
  { code: 'S03', name: 'അനന്തു കൃഷ്ണൻ' },
  { code: 'S04', name: 'ആതിര സുരേഷ്' },
  { code: 'S05', name: 'റോഹൻ ജോസഫ്' },
  { code: 'S06', name: 'ആൻ മരിയ' },
  { code: 'S07', name: 'അഭിജിത്ത് ആർ.' },
  { code: 'S08', name: 'ഐശ്വര്യ സന്തോഷ്' },
  { code: 'S09', name: 'അജ്മൽ ഷാ' },
  { code: 'S10', name: 'അലീന തോമസ്' },
  { code: 'S11', name: 'വിഷ്ണു പ്രസാദ്' },
  { code: 'S12', name: 'ശ്രേയ നായർ' },
  { code: 'S13', name: 'രാഹുൽ മാധവ്' },
  { code: 'S14', name: 'നിമിഷ പ്രവീൺ' },
  { code: 'S15', name: 'നിഹാൽ അഹമ്മദ്' },
  { code: 'S16', name: 'അപർണ ബാലകൃഷ്ണൻ' },
  { code: 'S17', name: 'സച്ചിൻ കെ.വി.' },
  { code: 'S18', name: 'സ്നേഹ വത്സൻ' },
  { code: 'S19', name: 'ജോയൽ ജേക്കബ്' },
  { code: 'S20', name: 'ദിയ മനോജ്' },
  { code: 'S21', name: 'ബിലാൽ ഹസ്സൻ' },
  { code: 'S22', name: 'കാവ്യ ചന്ദ്രൻ' },
  { code: 'S23', name: 'രോഹിത് മേനോൻ' },
  { code: 'S24', name: 'അനുശ്രീ കൃഷ്ണ' },
  { code: 'S25', name: 'ബേസിൽ പീറ്റർ' },
  { code: 'S26', name: 'ഗൗരി ശങ്കർ' },
  { code: 'S27', name: 'ആദിൽ റഹ്മാൻ' },
  { code: 'S28', name: 'അഞ്ജന മുരളി' },
  { code: 'S29', name: 'അശ്വിൻ ദാസ്' },
  { code: 'S30', name: 'അമൃത രാജ്' },
  { code: 'S31', name: 'നവനീത് കൃഷ്ണൻ' },
  { code: 'S32', name: 'ഷഹാന മറിയം' },
  { code: 'S33', name: 'സൂരജ് എസ്. കുമാർ' },
  { code: 'S34', name: 'ദേവിക നന്ദ' },
  { code: 'S35', name: 'മിഥുൻ മോഹൻ' },
  { code: 'S36', name: 'അനാമിക രാജീവ്' },
  { code: 'S37', name: 'ഫർഹാൻ അലി' },
  { code: 'S38', name: 'പ്രണവ് സന്തോഷ്' },
  { code: 'S39', name: 'മേഘ സതീഷ്' },
  { code: 'S40', name: 'അർജുൻ വിജയൻ' },
];

async function main() {
  console.log('🌱 Checking database seeding...');

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('✅ Database already contains data. Skipping initial seeding to preserve user entries.');
    return;
  }

  // 1. Create Default Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const operatorHash = await bcrypt.hash('operator123', salt);
  const viewerHash = await bcrypt.hash('viewer123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'പ്രധാന അഡ്മിനിസ്ട്രേറ്റർ',
      username: 'admin',
      email: 'admin@school.kerala.gov.in',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'ഡാറ്റാ എൻട്രി ഓപ്പറേറ്റർ',
      username: 'operator',
      email: 'operator@school.kerala.gov.in',
      passwordHash: operatorHash,
      role: 'OPERATOR',
      isActive: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'സ്കൂൾ നിരീക്ഷകൻ',
      username: 'viewer',
      email: 'viewer@school.kerala.gov.in',
      passwordHash: viewerHash,
      role: 'VIEWER',
      isActive: true,
    },
  });

  console.log('✅ Users seeded: admin/admin123, operator/operator123, viewer/viewer123');

  // 2. Create Active Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'കലണ്ടർ വിൽപന 2026 - വാർഷിക ക്യാമ്പയിൻ',
      institutionName: 'മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ കോഴിക്കോട്',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-07'),
      durationDays: 7,
      calendarPrice: 100.0,
      currency: '₹',
      description: 'വിദ്യാർത്ഥികളുടെ 7 ദിവസത്തെ വാർഷിക കലണ്ടർ വിൽപന പദ്ധതി',
      status: 'ACTIVE',
      createdBy: admin.id,
    },
  });

  console.log(`✅ Campaign created: ${campaign.name}`);

  // 3. Create 40 Students and link to Campaign
  const createdStudents = [];
  for (const s of malayalamStudents) {
    const student = await prisma.student.create({
      data: {
        studentCode: s.code,
        name: s.name,
        isActive: true,
      },
    });
    createdStudents.push(student);

    // Default target 50, varied for some
    const target = s.code === 'S01' ? 70 : s.code === 'S02' ? 60 : s.code === 'S03' ? 50 : 40;

    await prisma.campaignStudent.create({
      data: {
        campaignId: campaign.id,
        studentId: student.id,
        targetCalendars: target,
        isActive: true,
      },
    });
  }

  console.log(`✅ 40 Malayalam students created and linked with targets.`);

  // Create Camps
  const campAlappuzha = await prisma.camp.create({
    data: {
      campaignId: campaign.id,
      name: 'ആലപ്പുഴ',
      location: 'ആലപ്പുഴ ബീച്ച് ഏരിയ',
      leaderName: 'മുഹമ്മദ്‌ റഫീഖ്',
    },
  });

  const campKannur = await prisma.camp.create({
    data: {
      campaignId: campaign.id,
      name: 'കണ്ണൂർ',
      location: 'കണ്ണൂർ ടൗൺ',
      leaderName: 'അനന്തു കൃഷ്ണൻ',
    },
  });

  // Assign first 12 students to Alappuzha, next 12 to Kannur, rest 16 unassigned (non-camp)
  for (let i = 0; i < 12; i++) {
    await prisma.campaignStudent.update({
      where: { campaignId_studentId: { campaignId: campaign.id, studentId: createdStudents[i].id } },
      data: { campId: campAlappuzha.id },
    });
  }
  for (let i = 12; i < 24; i++) {
    await prisma.campaignStudent.update({
      where: { campaignId_studentId: { campaignId: campaign.id, studentId: createdStudents[i].id } },
      data: { campId: campKannur.id },
    });
  }
  console.log(`✅ Camps 'ആലപ്പുഴ' & 'കണ്ണൂർ' created and students assigned.`);

  // 4. Seed Daily Sales for Days 1 to 7 with realistic data
  // Day 1 to Day 5 have realistic entered data, Day 6-7 partially filled to demonstrate workflow
  for (let day = 1; day <= 5; day++) {
    for (let i = 0; i < createdStudents.length; i++) {
      const student = createdStudents[i];
      // Deterministic realistic variance based on student index and day
      const baseTaken = ((i % 5) + 3) * 2; // 6 to 14
      const sold = Math.max(0, baseTaken - ((i + day) % 3)); // slightly less or equal to taken
      const cashReceived = sold * 100;
      const expenses = (i % 4 === 0 && sold > 0) ? 20 : (i % 7 === 0 ? 50 : 0);

      await prisma.dailySale.create({
        data: {
          campaignId: campaign.id,
          studentId: student.id,
          dayNumber: day,
          calendarsTaken: baseTaken,
          calendarsSold: sold,
          cashReceived: cashReceived,
          expenses: expenses,
          notes: expenses > 0 ? 'യാത്രാ ബത്ത' : undefined,
          enteredBy: operator.id,
        },
      });
    }
  }

  // Days 6 and 7: entries for top students to simulate ongoing days
  for (let day = 6; day <= 7; day++) {
    for (let i = 0; i < 20; i++) {
      const student = createdStudents[i];
      const baseTaken = 8;
      const sold = 7;
      const cashReceived = sold * 100;
      const expenses = i === 2 ? 30 : 0;

      await prisma.dailySale.create({
        data: {
          campaignId: campaign.id,
          studentId: student.id,
          dayNumber: day,
          calendarsTaken: baseTaken,
          calendarsSold: sold,
          cashReceived: cashReceived,
          expenses: expenses,
          enteredBy: operator.id,
        },
      });
    }
  }

  console.log(`✅ 7 Days of realistic sales data seeded.`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
