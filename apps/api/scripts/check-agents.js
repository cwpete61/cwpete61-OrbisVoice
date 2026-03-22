
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgents() {
  const agents = await prisma.agent.findMany({ select: { id: true, name: true, type: true, autoStart: true } });
  console.log(JSON.stringify(agents, null, 2));
  process.exit(0);
}

checkAgents().catch(e => { console.error(e); process.exit(1); });
