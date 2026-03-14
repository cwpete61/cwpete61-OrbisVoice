import Stripe from "stripe";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from the root of apps/api
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyAccount(accountId: string) {
    const apiKey = process.env.STRIPE_API_KEY;
    
    if (!apiKey) {
        console.error("STRIPE_API_KEY is not defined in .env");
        return;
    }

    console.log(`Verifying Stripe Account: ${accountId}`);
    console.log(`Using API Key starting with: ${apiKey.substring(0, 15)}...`);

    const stripe = new Stripe(apiKey, {
        apiVersion: "2024-06-20" as any,
    });

    try {
        // Retrieve the account details
        const account = await stripe.accounts.retrieve(accountId);
        console.log("\n✅ Account found!");
        console.log("ID:", account.id);
        console.log("Details Submitted:", account.details_submitted);
        console.log("Charges Enabled:", account.charges_enabled);
        console.log("Payouts Enabled:", account.payouts_enabled);
        console.log("Default Currency:", account.default_currency);
        console.log("Email:", account.email);
        
        if (account.capabilities) {
            console.log("Capabilities:", JSON.stringify(account.capabilities, null, 2));
        }

    } catch (err: any) {
        console.error("\n❌ Failed to verify account:");
        console.error("Error:", err.message);
        if (err.raw) {
            console.error("Raw Error:", JSON.stringify(err.raw, null, 2));
        }
    }
}

const accountToTest = process.argv[2] || "acct_1T2fkkEFjM4hGTWY";
verifyAccount(accountToTest);
