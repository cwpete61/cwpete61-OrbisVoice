import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
    const payouts = await p.affiliatePayout.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log("Recent payouts:", JSON.stringify(payouts, null, 2));
    const txs = await p.rewardTransaction.findMany({ where: { status: 'paid' }, take: 10 });
    console.log("Paid transactions count:", txs.length);
    await p.$disconnect();
})();
