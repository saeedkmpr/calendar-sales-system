import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeNew = await prisma.campaign.findFirst({
    where: { name: 'കലണ്ടർ വിൽപ്പന കണക്കുപുസ്തകം 2026' },
  });

  if (activeNew) {
    await prisma.campaign.updateMany({
      where: { NOT: { id: activeNew.id } },
      data: { status: 'ARCHIVED' },
    });
    console.log(`✅ Set "${activeNew.name}" (${activeNew.id}) as the ONLY ACTIVE campaign.`);
  }
}

main().finally(() => prisma.$disconnect());
