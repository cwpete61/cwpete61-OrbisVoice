import type { Agent } from "../multi_agent_system";
import { CommunicationAgent } from "./CommunicationAgent";
import { CodeQualityAgent } from "./CodeQualityAgent";
import { GoogleCalendarAgent } from "./GoogleCalendarAgent";
import { GmailAgent } from "./GmailAgent";
import { LeadQualificationAgent } from "./LeadQualificationAgent";
import { PhoneTonesAgent } from "./PhoneTonesAgent";
import { ProductAgent } from "./ProductAgent";
import { StripeAgent } from "./StripeAgent";
import { TwilioAgent } from "./TwilioAgent";
import { UXUIAgent } from "./UXUIAgent";

export const createAgents = (): Agent[] => [
  new CommunicationAgent(),
  new CodeQualityAgent(),
  new LeadQualificationAgent(),
  new ProductAgent(),
  new GoogleCalendarAgent(),
  new GmailAgent(),
  new StripeAgent(),
  new PhoneTonesAgent(),
  new TwilioAgent(),
  new UXUIAgent(),
];
