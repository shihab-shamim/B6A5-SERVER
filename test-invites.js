const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvitations() {
  const invites = await prisma.invitation.findMany({ include: { invitee: { select: { email: true } } } });
  console.log("Total invitations:", invites.length);
  invites.forEach(inv => {
    console.log(`- To: ${inv.invitee.email}, Status: ${inv.status}, Event: ${inv.eventId}`);
  });
}

checkInvitations().catch(console.error).finally(() => prisma.$disconnect());
