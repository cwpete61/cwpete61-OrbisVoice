import Stripe from "stripe";
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
  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: "2024-06-20" as any,
      typescript: true,
    });
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(payment: StripePaymentIntent): Promise<Stripe.PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency,
        description: payment.description,
        metadata: payment.metadata,
      });
      logger.info({ intentId: intent.id, amount: payment.amount }, "Payment intent created");
      return intent;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack }, "Failed to create Stripe payment intent");
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
  ): Promise<Stripe.Charge> {
    try {
      const charge = await this.stripe.charges.create({
        amount: Math.round(amount * 100),
        currency,
        customer: customerId,
        description,
      });
      logger.info({ chargeId: charge.id, amount }, "Charge created");
      return charge;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack }, "Failed to create Stripe charge");
      throw err;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customer: StripeCustomer): Promise<Stripe.Customer> {
    try {
      const stripeCustomer = await this.stripe.customers.create({
        email: customer.email,
        name: customer.name,
        description: customer.description,
        metadata: customer.metadata,
      });
      logger.info({ customerId: stripeCustomer.id }, "Customer created");
      return stripeCustomer;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, email: customer.email }, "Failed to create Stripe customer");
      throw err;
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      logger.info({ subscriptionId, status: subscription.status }, "Subscription retrieved");
      return subscription;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, subscriptionId }, "Failed to get Stripe subscription");
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
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
      });
      logger.info({ subscriptionId: subscription.id }, "Subscription created");
      return subscription;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, customerId }, "Failed to create Stripe subscription");
      throw err;
    }
  }

  /**
   * Create a transfer (e.g. to a connected account)
   */
  async createTransfer(transfer: StripeTransfer): Promise<Stripe.Transfer> {
    try {
      const stripeTransfer = await this.stripe.transfers.create({
        amount: Math.round(transfer.amount * 100),
        currency: transfer.currency,
        destination: transfer.destination,
        description: transfer.description,
        metadata: transfer.metadata,
      });
      logger.info({ transferId: stripeTransfer.id, destination: transfer.destination, amount: transfer.amount }, "Transfer created");
      return stripeTransfer;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, destination: transfer.destination }, "Failed to create Stripe transfer");
      throw err;
    }
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
    mode?: "subscription" | "payment";
    description?: string;
    customText?: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: params.mode || "subscription",
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        metadata: params.metadata,
        payment_intent_data: params.mode === "payment" ? {
          description: params.description,
        } : undefined,
        subscription_data: params.mode === "subscription" ? {
          description: params.description,
          metadata: params.metadata,
        } : undefined,
        custom_text: params.customText ? {
          submit: { message: params.customText },
        } : undefined,
      });
      logger.info({ sessionId: session.id }, "Checkout session created");
      return session;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, customerId: params.customerId }, "Failed to create Stripe checkout session");
      throw err;
    }
  }

  /**
   * Create a billing portal session
   */
  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
      logger.info({ portalId: session.id }, "Portal session created");
      return session;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, customerId: params.customerId }, "Failed to create Stripe portal session");
      throw err;
    }
  }
}

export { StripeClient };
