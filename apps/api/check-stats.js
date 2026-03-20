const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStats() {
  try {
    const totalTenants = await prisma.tenant.count();
    const totalUsers = await prisma.user.count();
    const totalAgents = await prisma.agent.count();
    const totalTranscripts = await prisma.transcript.count();
    const totalLeads = await prisma.lead.count();
    const bookedLeads = await prisma.lead.count({ where: { isBooked: true } });
    const avgDurationRes = await prisma.transcript.aggregate({ _avg: { duration: true } });
    const subscriptionStats = await prisma.tenant.groupBy({ by: ["subscriptionTier"], _count: true });
    
    console.log('Stats:', {
      totalTenants, totalUsers, totalAgents, totalTranscripts, totalLeads, bookedLeads, avgDurationRes, subscriptionStats
    });
  } catch (err) {
    console.error('Stats Failure:', err);
  }
  process.exit(0);
}

checkStats();
