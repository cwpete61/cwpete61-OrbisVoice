"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const p = new client_1.PrismaClient();
// The real Stripe Connect test account from: 
// https://dashboard.stripe.com/acct_1T2fkkEFjM4hGTWY/test/connect/accounts/acct_1T4QDVEFjMPltIDg/activity
const REAL_STRIPE_CONNECTED_ACCOUNT = "acct_1T4QDVEFjMPltIDg";
async function main() {
    console.log("Linking real Stripe Connect account to test partner...");
    // 1. Find the test partner
    const user = await p.user.findUnique({ where: { email: "partner@test.com" } });
    if (!user) {
        console.error("Test partner not found! Run seed-payouts.ts first.");
        return;
    }
    // 2. Update the affiliate record with the real Stripe account
    const affiliate = await p.affiliate.update({
        where: { userId: user.id },
        data: {
            stripeAccountId: REAL_STRIPE_CONNECTED_ACCOUNT,
            stripeAccountStatus: "active",
            taxFormCompleted: true,
        }
    });
    console.log("Updated affiliate Stripe account to:", REAL_STRIPE_CONNECTED_ACCOUNT);
    // 3. Re-seed rewards (might have been cleared after last payout)
    const availableCount = await p.rewardTransaction.count({
        where: { referrerId: user.id, status: "available" }
    });
    if (availableCount === 0) {
        for (let i = 0; i < 5; i++) {
            await p.rewardTransaction.create({
                data: {
                    referrerId: user.id,
                    refereeId: user.id,
                    amount: 100,
                    status: "available",
                    sourcePaymentId: `test_real_pay_${Date.now()}_${i}`,
                    holdEndsAt: new Date()
                }
            });
        }
        console.log("Re-seeded $500 in available rewards.");
    }
    else {
        console.log(`${availableCount} available transactions already exist.`);
    }
    // 4. Generate an admin token for testing
    const admin = await p.user.findUnique({ where: { email: "myorbislocal@gmail.com" } });
    if (admin) {
        const token = jsonwebtoken_1.default.sign({ userId: admin.id, tenantId: admin.tenantId, email: admin.email }, process.env.JWT_SECRET || "dev-secret-key-change-in-production", { expiresIn: "1h" });
        console.log("\n=== ADMIN TOKEN FOR TESTING ===");
        console.log(token);
        console.log("=================================");
    }
    console.log("\nDone! Partner is now linked to real Stripe Connect account.");
    console.log("Affiliate ID:", affiliate.id);
}
main()
    .catch(console.error)
    .finally(() => p.$disconnect());
