import { PrismaClient } from "@prisma/client";
import { referralManager } from "../src/services/referral";
import { affiliateManager } from "../src/services/affiliate";

const prisma = new PrismaClient();

async function main() {
  const runId = `stress_${Date.now()}`;
  const referralCode = `STR${Math.floor(Math.random() * 900000 + 100000)}`;
  const refereeCount = 140;
  const saleAmount = 12;

  let tenantId: string | null = null;
  let referrerId: string | null = null;
  let affiliateId: string | null = null;
  const refereeIds: string[] = [];

  try {
    const tenant = await prisma.tenant.create({
      data: { name: `Stress Workspace ${runId}` },
    });
    tenantId = tenant.id;

    const referrer = await prisma.user.create({
      data: {
        tenantId,
        email: `${runId}@example.com`,
        name: `Stress Referrer ${runId}`,
        username: runId,
        passwordHash: "simulated",
        isAffiliate: true,
      },
    });
    referrerId = referrer.id;

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: referrer.id,
        status: "ACTIVE",
        slug: runId,
        stripeAccountId: `acct_dummy_${runId}`,
        stripeAccountStatus: "active",
        taxFormCompleted: true,
        tax1099Uploaded: true,
        lockedCommissionRate: 10,
      },
    });
    affiliateId = affiliate.id;

    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        code: referralCode,
        status: "accepted",
        rewardAmount: 10,
      },
    });

    for (let i = 0; i < refereeCount; i += 1) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          email: `${runId}_r${i}@example.com`,
          name: `Referee ${i}`,
          username: `${runId}_r${i}`,
          passwordHash: "simulated",
          referralCodeUsed: referralCode,
        },
      });
      refereeIds.push(user.id);
    }

    let createdEvents = 0;
    let duplicateAttempts = 0;
    for (let i = 0; i < refereeIds.length; i += 1) {
      const source = `pi_${runId}_${i}`;
      const ok1 = await referralManager.processCommission(refereeIds[i], saleAmount, source);
      const ok2 = await referralManager.processCommission(refereeIds[i], saleAmount, source);
      if (ok1) createdEvents += 1;
      if (ok2) duplicateAttempts += 1;
    }

    const txBeforeRelease = await prisma.rewardTransaction.count({
      where: { referrerId: referrer.id, status: "pending" },
    });

    await prisma.rewardTransaction.updateMany({
      where: { referrerId: referrer.id, status: "pending" },
      data: { holdEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const released = await referralManager.clearPendingHolds();

    const txAvailable = await prisma.rewardTransaction.count({
      where: { referrerId: referrer.id, status: "available" },
    });

    const payoutResult = await affiliateManager.processPayout(affiliate.id);

    const txPaid = await prisma.rewardTransaction.count({
      where: { referrerId: referrer.id, status: "paid" },
    });

    const payoutRows = await prisma.affiliatePayout.findMany({
      where: { affiliateId: affiliate.id },
      select: { id: true, amount: true, netAmount: true, transactionId: true, status: true },
    });

    console.log(
      JSON.stringify(
        {
          runId,
          refereeCount,
          saleAmount,
          createdEvents,
          duplicateAttempts,
          pendingBeforeRelease: txBeforeRelease,
          released,
          availableAfterRelease: txAvailable,
          payoutResult,
          paidAfterPayout: txPaid,
          payoutRows,
          expectedNoDuplicateRows: refereeCount,
          actualRewardRows: txPaid,
        },
        null,
        2
      )
    );
  } finally {
    if (referrerId) {
      await prisma.rewardTransaction.deleteMany({ where: { referrerId } });
    }
    if (affiliateId) {
      await prisma.affiliatePayout.deleteMany({ where: { affiliateId } });
      await prisma.affiliate.deleteMany({ where: { id: affiliateId } });
    }
    if (referrerId) {
      await prisma.referral.deleteMany({ where: { referrerId } });
    }
    if (refereeIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: refereeIds } } });
    }
    if (referrerId) {
      await prisma.user.deleteMany({ where: { id: referrerId } });
    }
    if (tenantId) {
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
