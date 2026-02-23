"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const affiliate_1 = require("../src/services/affiliate");
const env_1 = require("../src/env");
const stripe_1 = __importDefault(require("stripe"));
const prisma = new client_1.PrismaClient();
async function handler(userId) {
    try {
        let affiliate = await prisma.affiliate.findUnique({ where: { userId } });
        if (!affiliate) {
            console.log("Creating affiliate...");
            const result = await affiliate_1.affiliateManager.applyForAffiliate(userId, "PENDING");
            if (!result.success || !result.data) {
                console.log("Failed to initialize partner profile");
                return;
            }
            affiliate = result.data;
        }
        if (!affiliate.stripeAccountId) {
            console.log("not_connected", null);
            return;
        }
        // If pending, check Stripe directly to see if they finished onboarding
        let currentStatus = affiliate.stripeAccountStatus;
        if (currentStatus === "pending" && env_1.env.STRIPE_API_KEY) {
            console.log("Checking Stripe directly...");
            const stripe = new stripe_1.default(env_1.env.STRIPE_API_KEY, { apiVersion: "2024-06-20" });
            const account = await stripe.accounts.retrieve(affiliate.stripeAccountId);
            if (account.details_submitted) {
                currentStatus = "active";
                await prisma.affiliate.update({
                    where: { id: affiliate.id },
                    data: { stripeAccountStatus: "active" },
                });
            }
        }
        console.log("Status:", currentStatus, "AccountId:", affiliate.stripeAccountId);
    }
    catch (err) {
        console.error("Failed to fetch Stripe Connect status:");
        console.error(err);
    }
}
async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@orbisvoice.app' }
    });
    if (!user) {
        console.log("Admin not found.");
        return;
    }
    await handler(user.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
