import { prisma } from "../apps/api/src/db";

async function checkAgents() {
  const agents = await prisma.agent.findMany();
  console.log("Agents with phone numbers:");
  agents.forEach(a => {
    console.log(`ID: ${a.id}, Name: ${a.name}, Phone: ${a.phoneNumber}`);
  });
}

checkAgents().then(() => process.exit(0));
