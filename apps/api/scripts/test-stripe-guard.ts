import { StripeClient } from "../src/integrations/stripe";
import { logger } from "../src/logger";

console.log("Testing StripeClient with empty key...");
try {
  const client = new StripeClient({ apiKey: "" });
  console.log("SUCCESS: StripeClient initialized with empty key without throwing.");
} catch (err) {
  console.error("FAILURE: StripeClient threw with empty key:", err);
  process.exit(1);
}

console.log("Testing StripeClient with 'undefined' string...");
try {
  const client = new StripeClient({ apiKey: "undefined" });
  console.log("SUCCESS: StripeClient initialized with 'undefined' string without throwing.");
} catch (err) {
  console.error("FAILURE: StripeClient threw with 'undefined' string:", err);
  process.exit(1);
}

console.log("Testing StripeClient with malformed key...");
try {
  const client = new StripeClient({ apiKey: "sk_test_too_short" });
  console.log("SUCCESS: StripeClient initialized with malformed key without throwing.");
} catch (err) {
  console.error("FAILURE: StripeClient threw with malformed key:", err);
  process.exit(1);
}

console.log("All guards verified.");
