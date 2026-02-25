"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const p = new client_1.PrismaClient();
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
