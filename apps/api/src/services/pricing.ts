import { prisma } from "../db";
import { logger } from "../logger";

export interface SessionUsage {
  inputTokens: number;
  outputTokens: number;
  durationSeconds: number;
  toolsCalled: number;
  smsSent?: number;
}

export class PricingService {
  private static instance: PricingService;
  private registryCache: any = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  static getInstance() {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  /** For testing only */
  public static clearCache() {
    if (this.instance) {
      this.instance.registryCache = null;
      this.instance.lastFetch = 0;
    }
  }

  private async getRegistry() {
    const now = Date.now();
    if (this.registryCache && now - this.lastFetch < this.CACHE_TTL) {
      return this.registryCache;
    }

    try {
      let registry = await prisma.pricingRegistry.findUnique({
        where: { id: "global" },
      });

      if (!registry) {
        // Create defaults if not exists
        registry = await prisma.pricingRegistry.create({
          data: { id: "global" },
        });
      }

      this.registryCache = registry;
      this.lastFetch = now;
      return registry;
    } catch (err) {
      logger.error({ err }, "Failed to fetch pricing registry");
      // Fallback to hardcoded defaults if DB is down
      return {
        inputTokenPrice: 0.00000035,
        outputTokenPrice: 0.00000105,
        minutePrice: 0.015,
        smsPrice: 0.05,
        toolCallPrice: 0.005,
      };
    }
  }

  public async calculateSessionFinance(usage: SessionUsage) {
    const registry = await this.getRegistry();

    // 1. Compute Base Provider Cost
    const costInputTokens = usage.inputTokens * registry.inputTokenPrice;
    const costOutputTokens = usage.outputTokens * registry.outputTokenPrice;
    const durationMinutes = usage.durationSeconds / 60;
    const costMinutes = durationMinutes * registry.minutePrice;
    const costTools = usage.toolsCalled * registry.toolCallPrice;
    const costSms = (usage.smsSent || 0) * registry.smsPrice;

    const totalCost = costInputTokens + costOutputTokens + costMinutes + costTools + costSms;

    // 2. Compute Retail Revenue (how much the customer pays)
    const revInputTokens = usage.inputTokens * (registry.retailInputTokenPrice || registry.inputTokenPrice * 3);
    const revOutputTokens = usage.outputTokens * (registry.retailOutputTokenPrice || registry.outputTokenPrice * 3);
    const revMinutes = durationMinutes * (registry.retailMinutePrice || 0.15);
    const revTools = usage.toolsCalled * (registry.retailToolCallPrice || 0.05);
    const revSms = (usage.smsSent || 0) * (registry.retailSmsPrice || 0.12);

    const totalRevenue = revInputTokens + revOutputTokens + revMinutes + revTools + revSms;

    // 3. Compute Margin
    const margin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;
    const isLowMargin = marginPercent < registry.minMarginPercent;

    logger.info({ 
      sessionId: (usage as any).sessionId,
      finance: {
        cost: totalCost.toFixed(4),
        revenue: totalRevenue.toFixed(4),
        margin: margin.toFixed(4),
        marginPercent: marginPercent.toFixed(2) + "%",
        isLowMargin
      }
    }, "Session finance calculated");

    return {
      cost: parseFloat(totalCost.toFixed(4)),
      revenue: parseFloat(totalRevenue.toFixed(4)),
      margin: parseFloat(margin.toFixed(4)),
      isLowMargin
    };
  }

  /** @deprecated use calculateSessionFinance */
  public async calculateSessionCost(usage: SessionUsage): Promise<number> {
    const res = await this.calculateSessionFinance(usage);
    return res.cost;
  }
}

export const pricingService = PricingService.getInstance();
