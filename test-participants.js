const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const p = await prisma.participant.findMany({ include: { user: { select: { email: true } } } });
  console.log("Total Participants:", p.length);
  console.log(p);
}

check().catch(console.error).finally(() => prisma.$disconnect());
