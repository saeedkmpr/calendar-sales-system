import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// The user's exact 21 students and targets from their Excel spreadsheet
const userStudents = [
  { code: 'S01', name: 'നുഅ്മാൻ പടപ്പറമ്പ്', target: 250 },
  { code: 'S02', name: 'സിയാദ് കഞ്ഞിപ്പുര', target: 250 },
  { code: 'S03', name: 'അബ്ദുൽ ബാരി', target: 250 },
  { code: 'S04', name: 'നാജി പൂന്താനം', target: 250 },
  { code: 'S05', name: 'മഖ്ബൂൽ പട്ടിക്കാട്', target: 250 },
  { code: 'S06', name: 'അൽത്വാഫ് മണ്ണുംകുളം', target: 250 },
  { code: 'S07', name: 'ജുബൈർ മണ്ണുംകുളം', target: 250 },
  { code: 'S08', name: 'മിർദാസ് താനൂർ', target: 250 },
  { code: 'S09', name: 'സിനാൻ പേർശനൂർ', target: 250 },
  { code: 'S10', name: 'സ്വാലിഹ് എടയൂർ', target: 250 },
  { code: 'S11', name: 'സിനാൻ പുത്തനങ്ങാടി', target: 200 },
  { code: 'S12', name: 'നിഹാൽ പുറമണ്ണൂർ', target: 200 },
  { code: 'S13', name: 'ശാദിൽ പുറമണ്ണൂർ', target: 200 },
  { code: 'S14', name: 'മിസ്ഹബ് ഓണപ്പുട', target: 200 },
  { code: 'S15', name: 'സഅദ് പട്ടാമ്പി', target: 200 },
  { code: 'S16', name: 'സിറാജ് തെയ്യോട്ടുചിറ', target: 200 },
  { code: 'S17', name: 'ഹിദാഷ് പൂന്താനം', target: 200 },
  { code: 'S18', name: 'അനസ് കരുവാരക്കുണ്ട്', target: 100 },
  { code: 'S19', name: 'അബൂത്വാഹിർ', target: 100 },
  { code: 'S20', name: 'യാസീൻ തുവ്വക്കാട്', target: 100 },
  { code: 'S21', name: 'ഷെഫിൻ ക്ലാരി', target: 100 },
];

// Day 1 exact sales data from Excel
const day1Data: { [name: string]: { taken: number; sold: number; cash: number; exp: number; notes?: string } } = {
  'നാജി പൂന്താനം': { taken: 60, sold: 40, cash: 3346, exp: 226 },
  'ജുബൈർ മണ്ണുംകുളം': { taken: 60, sold: 48, cash: 3936, exp: 256 },
  'മിർദാസ് താനൂർ': { taken: 50, sold: 17, cash: 1526, exp: 386 },
  'സിനാൻ പേർശനൂർ': { taken: 50, sold: 42, cash: 1679, exp: 265 },
  'സ്വാലിഹ് എടയൂർ': { taken: 60, sold: 30, cash: 2613, exp: 293 },
  'സിനാൻ പുത്തനങ്ങാടി': { taken: 50, sold: 27, cash: 1985, exp: 230 },
  'നിഹാൽ പുറമണ്ണൂർ': { taken: 30, sold: 10, cash: 829, exp: 150, notes: 'gpay 75' },
  'ശാദിൽ പുറമണ്ണൂർ': { taken: 50, sold: 6, cash: 1228, exp: 200, notes: 'gpay 60' },
  'സിറാജ് തെയ്യോട്ടുചിറ': { taken: 50, sold: 2, cash: 280, exp: 100 },
  'ഹിദാഷ് പൂന്താനം': { taken: 50, sold: 8, cash: 1420, exp: 210 },
};

// Day 2 exact sales data from Excel
const day2Data: { [name: string]: { taken: number; sold: number; cash: number; exp: number } } = {
  'നുഅ്മാൻ പടപ്പറമ്പ്': { taken: 50, sold: 14, cash: 960, exp: 120 },
  'സിയാദ് കഞ്ഞിപ്പുര': { taken: 50, sold: 32, cash: 1670, exp: 110 },
  'അബ്ദുൽ ബാരി': { taken: 70, sold: 68, cash: 2845, exp: 200 },
  'നാജി പൂന്താനം': { taken: 60, sold: 56, cash: 4304, exp: 216 },
  'അൽത്വാഫ് മണ്ണുംകുളം': { taken: 70, sold: 40, cash: 3360, exp: 133 },
  'ജുബൈർ മണ്ണുംകുളം': { taken: 60, sold: 60, cash: 3022, exp: 322 },
  'മിർദാസ് താനൂർ': { taken: 50, sold: 19, cash: 2346, exp: 356 },
  'സിനാൻ പേർശനൂർ': { taken: 50, sold: 36, cash: 2020, exp: 150 },
  'സ്വാലിഹ് എടയൂർ': { taken: 57, sold: 41, cash: 1931, exp: 161 },
  'സിനാൻ പുത്തനങ്ങാടി': { taken: 50, sold: 22, cash: 1846, exp: 255 },
  'ശാദിൽ പുറമണ്ണൂർ': { taken: 50, sold: 25, cash: 1840, exp: 250 },
  'സിറാജ് തെയ്യോട്ടുചിറ': { taken: 50, sold: 35, cash: 1410, exp: 180 },
};

// Day 3 exact sales data from Excel
const day3Data: { [name: string]: { taken: number; sold: number; cash: number; exp: number; notes?: string } } = {
  'നുഅ്മാൻ പടപ്പറമ്പ്': { taken: 50, sold: 36, cash: 1730, exp: 230 },
  'സിയാദ് കഞ്ഞിപ്പുര': { taken: 50, sold: 38, cash: 2942, exp: 192 },
  'അബ്ദുൽ ബാരി': { taken: 72, sold: 72, cash: 2794, exp: 232 },
  'നാജി പൂന്താനം': { taken: 60, sold: 60, cash: 3717, exp: 256 },
  'മഖ്ബൂൽ പട്ടിക്കാട്': { taken: 50, sold: 30, cash: 1809, exp: 250, notes: 'gpay 100' },
  'അൽത്വാഫ് മണ്ണുംകുളം': { taken: 50, sold: 50, cash: 2285, exp: 94 },
  'ജുബൈർ മണ്ണുംകുളം': { taken: 60, sold: 60, cash: 5416, exp: 356 },
  'മിർദാസ് താനൂർ': { taken: 50, sold: 50, cash: 3600, exp: 429 },
  'സിനാൻ പേർശനൂർ': { taken: 50, sold: 50, cash: 2350, exp: 120 },
  'സ്വാലിഹ് എടയൂർ': { taken: 70, sold: 70, cash: 2862, exp: 292 },
  'സിനാൻ പുത്തനങ്ങാടി': { taken: 50, sold: 26, cash: 1845, exp: 300, notes: 'gpay 250' },
  'നിഹാൽ പുറമണ്ണൂർ': { taken: 30, sold: 20, cash: 1320, exp: 170 },
  'ശാദിൽ പുറമണ്ണൂർ': { taken: 50, sold: 33, cash: 1531, exp: 200, notes: 'gpay 110' },
  'മിസ്ഹബ് ഓണപ്പുട': { taken: 40, sold: 36, cash: 2296, exp: 250 },
  'സിറാജ് തെയ്യോട്ടുചിറ': { taken: 50, sold: 38, cash: 1220, exp: 220 },
  'ഹിദാഷ് പൂന്താനം': { taken: 50, sold: 43, cash: 2290, exp: 250 },
  'അനസ് കരുവാരക്കുണ്ട്': { taken: 50, sold: 28, cash: 1090, exp: 230 },
  'അബൂത്വാഹിർ': { taken: 40, sold: 18, cash: 1850, exp: 190 },
  'യാസീൻ തുവ്വക്കാട്': { taken: 35, sold: 17, cash: 1485, exp: 100, notes: 'gpay 30' },
  'ഷെഫിൻ ക്ലാരി': { taken: 40, sold: 30, cash: 1080, exp: 40 },
};

async function main() {
  console.log('🔄 Seeding user Excel data into database...');

  // 1. Ensure default users exist
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'അഡ്മിനിസ്ട്രേറ്റർ',
      username: 'admin',
      email: 'admin@calendarsales.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      name: 'ഡാറ്റാ എൻട്രി ഓപ്പറേറ്റർ',
      username: 'operator',
      email: 'operator@calendarsales.com',
      passwordHash: operatorPassword,
      role: 'OPERATOR',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      name: 'വ്യൂവർ (Viewer)',
      username: 'viewer',
      email: 'viewer@calendarsales.com',
      passwordHash: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
  });

  // 2. Find or Create the primary Campaign matching the Excel sheet
  let campaign = await prisma.campaign.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'കലണ്ടർ വിൽപ്പന ക്യാമ്പയിൻ 2026',
        institutionName: 'ദക്ഷിണ കന്നഡ / മലപ്പുറം റീജിയൺ',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-07'),
        durationDays: 7,
        calendarPrice: 100.0,
        currency: '₹',
        description: 'വിദ്യാർത്ഥികളുടെ 7 ദിവസത്തെ കലണ്ടർ വിൽപ്പനയും തത്സമയ റാങ്കിംഗും',
        status: 'ACTIVE',
        createdBy: admin.id,
      },
    });
  } else {
    // Update name
    campaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        name: 'കലണ്ടർ വിൽപ്പന ക്യാമ്പയിൻ 2026',
        durationDays: 7,
        calendarPrice: 100.0,
      },
    });
  }

  // Clear previous campaign sales and links to ensure clean synchronization
  await prisma.dailySale.deleteMany({ where: { campaignId: campaign.id } });
  await prisma.campaignStudent.deleteMany({ where: { campaignId: campaign.id } });

  console.log(`📌 Target Campaign: "${campaign.name}" (${campaign.id})`);

  // 3. Upsert the 21 students and link to campaign
  const studentMap: { [name: string]: any } = {};

  for (const s of userStudents) {
    const student = await prisma.student.upsert({
      where: { studentCode: s.code },
      update: { name: s.name },
      create: {
        studentCode: s.code,
        name: s.name,
        isActive: true,
      },
    });

    studentMap[s.name.trim()] = student;

    await prisma.campaignStudent.create({
      data: {
        campaignId: campaign.id,
        studentId: student.id,
        targetCalendars: s.target,
        isActive: true,
      },
    });
  }

  console.log(`✅ Registered ${userStudents.length} students with their specific targets.`);

  // Helper to normalize names
  const findStudent = (name: string) => {
    const clean = name.trim();
    if (studentMap[clean]) return studentMap[clean];
    // fuzzy match if whitespace differs
    const key = Object.keys(studentMap).find((k) => k.replace(/\s+/g, '') === clean.replace(/\s+/g, ''));
    return key ? studentMap[key] : null;
  };

  // 4. Insert Day 1 Sales
  let day1Count = 0;
  for (const [name, data] of Object.entries(day1Data)) {
    const st = findStudent(name);
    if (!st) {
      console.warn(`Student not found for Day 1: ${name}`);
      continue;
    }
    await prisma.dailySale.create({
      data: {
        campaignId: campaign.id,
        studentId: st.id,
        dayNumber: 1,
        calendarsTaken: data.taken,
        calendarsSold: data.sold,
        cashReceived: data.cash,
        expenses: data.exp,
        notes: data.notes,
        enteredBy: admin.id,
      },
    });
    day1Count++;
  }
  console.log(`✅ Day 1: Inserted ${day1Count} active sales entries.`);

  // 5. Insert Day 2 Sales
  let day2Count = 0;
  for (const [name, data] of Object.entries(day2Data)) {
    const st = findStudent(name);
    if (!st) {
      console.warn(`Student not found for Day 2: ${name}`);
      continue;
    }
    await prisma.dailySale.create({
      data: {
        campaignId: campaign.id,
        studentId: st.id,
        dayNumber: 2,
        calendarsTaken: data.taken,
        calendarsSold: data.sold,
        cashReceived: data.cash,
        expenses: data.exp,
        enteredBy: admin.id,
      },
    });
    day2Count++;
  }
  console.log(`✅ Day 2: Inserted ${day2Count} active sales entries.`);

  // 6. Insert Day 3 Sales
  let day3Count = 0;
  for (const [name, data] of Object.entries(day3Data)) {
    const st = findStudent(name);
    if (!st) {
      console.warn(`Student not found for Day 3: ${name}`);
      continue;
    }
    await prisma.dailySale.create({
      data: {
        campaignId: campaign.id,
        studentId: st.id,
        dayNumber: 3,
        calendarsTaken: data.taken,
        calendarsSold: data.sold,
        cashReceived: data.cash,
        expenses: data.exp,
        notes: data.notes,
        enteredBy: admin.id,
      },
    });
    day3Count++;
  }
  console.log(`✅ Day 3: Inserted ${day3Count} active sales entries.`);

  console.log('🎉 Data successfully imported and synchronized with Excel records!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
