import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const stripe = new Stripe(process.env.STRIPE_API_KEY || "", { apiVersion: "2024-06-20" as any });
    const connectedAccountId = "acct_1T4QDVEFjMPltIDg";

    console.log("=== CREATING TEST PAYMENT TO FUND PLATFORM BALANCE ===");
    console.log("This simulates a real subscription payment going through the platform...");

    // 1. Create a PaymentIntent on the PLATFORM account, NOT the connected account
    // This puts funds in the platform balance directly
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100000, // $1,000
            currency: "usd",
            payment_method: "pm_card_visa",
            confirm: true,
            return_url: "http://localhost:3000",
            automatic_payment_methods: { enabled: false },
        });
        console.log("Payment created:", paymentIntent.id, "Status:", paymentIntent.status);
    } catch (err: any) {
        console.log("Payment attempt:", err.message);
    }

    // 2. Check balance
    const balance = await stripe.balance.retrieve();
    console.log("\n=== PLATFORM BALANCE ===");
    balance.available.forEach(b => console.log(`  Available: $${b.amount / 100} ${b.currency.toUpperCase()}`));
    balance.pending.forEach(b => console.log(`  Pending: $${b.amount / 100} ${b.currency.toUpperCase()}`));

    const totalAvailable = balance.available.reduce((s, b) => s + b.amount, 0);

    if (totalAvailable > 0) {
        console.log("\n=== ATTEMPTING REAL TRANSFER TO CONNECTED ACCOUNT ===");
        try {
            const transfer = await stripe.transfers.create({
                amount: Math.min(10000, totalAvailable), // $100 or whatever is available
                currency: "usd",
                destination: connectedAccountId,
                description: "OrbisVoice affiliate payout test",
                metadata: { type: "affiliate_payout", partner: "testpartner" }
            });
            console.log("✅ Transfer succeeded!");
            console.log("   Transfer ID:", transfer.id);
            console.log("   Amount sent: $", transfer.amount / 100);
        } catch (err: any) {
            console.error("❌ Transfer failed:", err.message);
        }
    } else {
        console.log("\n⚠️  Platform still has $0 available.");
        console.log("\nManual steps to add test funds in Stripe Dashboard:");
        console.log("1. Go to: https://dashboard.stripe.com/test/balance");
        console.log("2. Click 'Add to balance'");
        console.log("3. Enter amount (e.g. $1000)");
        console.log("4. This instantly makes funds available for transfers");
        console.log("\nAlternatively, you can run a test subscription payment:");
        console.log("- Use card: 4242 4242 4242 4242");
        console.log("- Any future expiry (12/34)");
        console.log("- Any CVC (123)");
    }
}

main().catch(console.error);
