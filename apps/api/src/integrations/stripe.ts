import { logger } from "../logger";

export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
}

export interface StripePaymentIntent {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface StripeCustomer {
  email: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface StripeTransfer {
  amount: number;
  currency: string;
  destination: string;
  description?: string;
  metadata?: Record<string, any>;
}

class StripeClient {
  private apiKey: string;
  private webhookSecret?: string;
  private baseUrl = "https://api.stripe.com/v1";

  constructor(config: StripeConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
  }

  private getAuthHeader(): string {
    return `Bearer ${this.apiKey}`;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(payment: StripePaymentIntent): Promise<any> {
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
        logger.error({ status: response.status, error }, "Stripe payment intent creation failed");
        throw new Error(`Stripe error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ intentId: data.id, amount: payment.amount }, "Payment intent created");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe payment intent");
      throw err;
    }
  }

  /**
   * Create a charge directly
   */
  async createCharge(
    customerId: string,
    amount: number,
    currency: string = "usd",
    description?: string
  ): Promise<any> {
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
        logger.error({ status: response.status, error }, "Stripe charge creation failed");
        throw new Error(`Stripe error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ chargeId: data.id, amount }, "Charge created");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe charge");
      throw err;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customer: StripeCustomer): Promise<any> {
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
        logger.error({ status: response.status, error }, "Stripe customer creation failed");
        throw new Error(`Stripe error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ customerId: data.id }, "Customer created");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe customer");
      throw err;
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, "Stripe subscription retrieval failed");
        throw new Error(`Stripe error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ subscriptionId, status: data.status }, "Subscription retrieved");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to get Stripe subscription");
      throw err;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, any>
  ): Promise<any> {
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
        logger.error({ status: response.status, error }, "Stripe subscription creation failed");
        throw new Error(`Stripe error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ subscriptionId: data.id }, "Subscription created");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe subscription");
      throw err;
    }
  }

  /**
   * Create a transfer (e.g. to a connected account)
   */
  async createTransfer(transfer: StripeTransfer): Promise<any> {
    try {
      const params = new URLSearchParams({
        amount: Math.round(transfer.amount * 100).toString(), // Convert to cents and ensure integer
        currency: transfer.currency,
        destination: transfer.destination,
      });

      if (transfer.description) {
        params.append("description", transfer.description);
      }

      if (transfer.metadata) {
        Object.entries(transfer.metadata).forEach(([key, value]) => {
          params.append(`metadata[${key}]`, String(value));
        });
      }

      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, "Stripe transfer creation failed");
        throw new Error(`Stripe error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as any;
      logger.info({ transferId: data.id, destination: transfer.destination, amount: transfer.amount }, "Transfer created");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe transfer");
      throw err;
    }
  }
}

export { StripeClient };
