"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeClient = void 0;
const logger_1 = require("../logger");
class StripeClient {
    constructor(config) {
        this.baseUrl = "https://api.stripe.com/v1";
        this.apiKey = config.apiKey;
        this.webhookSecret = config.webhookSecret;
    }
    getAuthHeader() {
        return `Bearer ${this.apiKey}`;
    }
    /**
     * Create a payment intent
     */
    async createPaymentIntent(payment) {
        try {
            const params = new URLSearchParams({
                amount: (payment.amount * 100).toString(), // Convert to cents
                currency: payment.currency,
            });
            if (payment.description) {
                params.append("description", payment.description);
            }
            if (payment.metadata) {
                Object.entries(payment.metadata).forEach(([key, value]) => {
                    params.append(`metadata[${key}]`, String(value));
                });
            }
            const response = await fetch(`${this.baseUrl}/payment_intents`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Stripe payment intent creation failed");
                throw new Error(`Stripe error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ intentId: data.id, amount: payment.amount }, "Payment intent created");
            return data;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to create Stripe payment intent");
            throw err;
        }
    }
    /**
     * Create a charge directly
     */
    async createCharge(customerId, amount, currency = "usd", description) {
        try {
            const params = new URLSearchParams({
                amount: (amount * 100).toString(),
                currency,
                customer: customerId,
            });
            if (description) {
                params.append("description", description);
            }
            const response = await fetch(`${this.baseUrl}/charges`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Stripe charge creation failed");
                throw new Error(`Stripe error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ chargeId: data.id, amount }, "Charge created");
            return data;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to create Stripe charge");
            throw err;
        }
    }
    /**
     * Create a customer
     */
    async createCustomer(customer) {
        try {
            const params = new URLSearchParams({
                email: customer.email,
            });
            if (customer.name) {
                params.append("name", customer.name);
            }
            if (customer.description) {
                params.append("description", customer.description);
            }
            if (customer.metadata) {
                Object.entries(customer.metadata).forEach(([key, value]) => {
                    params.append(`metadata[${key}]`, String(value));
                });
            }
            const response = await fetch(`${this.baseUrl}/customers`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Stripe customer creation failed");
                throw new Error(`Stripe error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ customerId: data.id }, "Customer created");
            return data;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to create Stripe customer");
            throw err;
        }
    }
    /**
     * Get subscription
     */
    async getSubscription(subscriptionId) {
        try {
            const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
                method: "GET",
                headers: {
                    Authorization: this.getAuthHeader(),
                },
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Stripe subscription retrieval failed");
                throw new Error(`Stripe error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ subscriptionId, status: data.status }, "Subscription retrieved");
            return data;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to get Stripe subscription");
            throw err;
        }
    }
    /**
     * Create subscription
     */
    async createSubscription(customerId, priceId, metadata) {
        try {
            const params = new URLSearchParams({
                customer: customerId,
                items: JSON.stringify([{ price: priceId }]),
            });
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    params.append(`metadata[${key}]`, String(value));
                });
            }
            const response = await fetch(`${this.baseUrl}/subscriptions`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Stripe subscription creation failed");
                throw new Error(`Stripe error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ subscriptionId: data.id }, "Subscription created");
            return data;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to create Stripe subscription");
            throw err;
        }
    }
}
exports.StripeClient = StripeClient;
