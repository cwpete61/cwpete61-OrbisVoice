"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgents = void 0;
const CommunicationAgent_1 = require("./CommunicationAgent");
const CodeQualityAgent_1 = require("./CodeQualityAgent");
const GoogleCalendarAgent_1 = require("./GoogleCalendarAgent");
const GmailAgent_1 = require("./GmailAgent");
const LeadQualificationAgent_1 = require("./LeadQualificationAgent");
const PhoneTonesAgent_1 = require("./PhoneTonesAgent");
const ProductAgent_1 = require("./ProductAgent");
const StripeAgent_1 = require("./StripeAgent");
const TwilioAgent_1 = require("./TwilioAgent");
const UXUIAgent_1 = require("./UXUIAgent");
const createAgents = () => [
    new CommunicationAgent_1.CommunicationAgent(),
    new CodeQualityAgent_1.CodeQualityAgent(),
    new LeadQualificationAgent_1.LeadQualificationAgent(),
    new ProductAgent_1.ProductAgent(),
    new GoogleCalendarAgent_1.GoogleCalendarAgent(),
    new GmailAgent_1.GmailAgent(),
    new StripeAgent_1.StripeAgent(),
    new PhoneTonesAgent_1.PhoneTonesAgent(),
    new TwilioAgent_1.TwilioAgent(),
    new UXUIAgent_1.UXUIAgent(),
];
exports.createAgents = createAgents;
