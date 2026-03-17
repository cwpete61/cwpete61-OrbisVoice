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
  public stripe: Stripe | null;
  private webhookSecret?: string;

  constructor(config: StripeConfig) {
    const apiKey = config.apiKey?.trim();
    
    // Stricter check to prevent "Neither apiKey nor config.authenticator provided" error
    if (apiKey && typeof apiKey === "string" && apiKey.length > 5 && apiKey !== "undefined" && apiKey !== "null") {
      try {
        this.stripe = new Stripe(apiKey, {
          apiVersion: "2024-06-20" as any,
          typescript: true,
        });
        logger.info({ keyPrefix: apiKey.substring(0, 7) }, "StripeClient initialized successfully");
      } catch (err: any) {
        this.stripe = null;
        logger.error({ 
          error: err.message, 
          keyLength: apiKey?.length,
          keyPrefix: apiKey?.substring(0, 7)
        }, "CRITICAL: Stripe SDK failed to initialize properly. Stripe features will be disabled.");
      }
    } else {
      this.stripe = null;
      logger.warn({ 
        keyLength: apiKey?.length, 
        isString: typeof apiKey === "string",
        val: apiKey === "undefined" || apiKey === "null" ? apiKey : "[REDACTED]"
      }, "StripeClient initialized without a valid API key. Stripe features will be disabled.");
    }
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(payment: StripePaymentIntent): Promise<Stripe.PaymentIntent> {
    if (!this.stripe) throw new Error("Stripe is not configured");
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
    if (!this.stripe) throw new Error("Stripe is not configured");
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
    if (!this.stripe) throw new Error("Stripe is not configured");
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
   * Create or get a customer by email
   */
  async getOrCreateCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    if (!this.stripe) throw new Error("Stripe is not configured");
    try {
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      logger.info({ customerId: customer.id }, "Stripe customer created");
      return customer;
    } catch (err: any) {
      logger.error({ err: err.message, stack: err.stack, email }, "Failed to get or create Stripe customer");
      throw err;
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) throw new Error("Stripe is not configured");
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
    if (!this.stripe) throw new Error("Stripe is not configured");
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
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    mode?: Stripe.Checkout.SessionCreateParams.Mode;
    allowPromotionCodes?: boolean;
    clientReferenceId?: string;
    metadata?: Record<string, string>;
    description?: string;
    customText?: string;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) throw new Error("Stripe is not configured");
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: params.mode || "subscription",
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        allow_promotion_codes: params.allowPromotionCodes,
        client_reference_id: params.clientReferenceId,
        metadata: params.metadata,
        subscription_data: params.mode === "subscription" ? {
          metadata: params.metadata,
        } : undefined,
        custom_text: params.customText ? {
          submit: {
            message: params.customText
          }
        } : undefined,
      });

      logger.info({ sessionId: session.id }, "Stripe checkout session created");
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
    if (!this.stripe) throw new Error("Stripe is not configured");
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

  /**
   * List active subscriptions for a customer
   */
  async listSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    if (!this.stripe) throw new Error("Stripe is not configured");
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 5,
      });
      return subscriptions.data;
    } catch (err: any) {
      logger.error({ err: err.message, customerId }, "Failed to list Stripe subscriptions");
      return [];
    }
  }

  /**
   * List recent checkout sessions for a customer
   */
  async listCheckoutSessions(customerId: string): Promise<Stripe.Checkout.Session[]> {
    if (!this.stripe) throw new Error("Stripe is not configured");
    try {
      const sessions = await this.stripe.checkout.sessions.list({
        customer: customerId,
        limit: 5,
      });
      return sessions.data;
    } catch (err: any) {
      logger.error({ err: err.message, customerId }, "Failed to list Stripe checkout sessions");
      return [];
    }
  }

  /**
   * Create a transfer
   */
  async createTransfer(transfer: StripeTransfer): Promise<Stripe.Transfer> {
    if (!this.stripe) throw new Error("Stripe is not configured");
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
   * Handle webhook events
   */
  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.stripe || !this.webhookSecret) {
      throw new Error("Stripe or Webhook Secret is not configured");
    }
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  /**
   * Get a StripeClient initialized with platform-wide settings from the database
   */
  static async getPlatformClient(prisma: any, env: any): Promise<StripeClient> {
    const config = await prisma.stripeConnectConfig.findUnique({
      where: { id: "global" },
    });

    const apiKey = config?.secretKey || env.STRIPE_API_KEY;
    
    return new StripeClient({
      apiKey: apiKey || "",
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });
  }
}

export { StripeClient };
