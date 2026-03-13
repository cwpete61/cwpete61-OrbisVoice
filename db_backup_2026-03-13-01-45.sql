--
-- PostgreSQL database dump
--

\restrict QLCn6QakQrjhMTCv6q31bXgon4lPoX3t4oOTkX0FCvw3VjWbocyOxCMLgHGTVg6

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AffiliateReferralStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AffiliateReferralStatus" AS ENUM (
    'PENDING',
    'CONVERTED',
    'REJECTED'
);


ALTER TYPE public."AffiliateReferralStatus" OWNER TO postgres;

--
-- Name: AffiliateStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AffiliateStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'REJECTED'
);


ALTER TYPE public."AffiliateStatus" OWNER TO postgres;

--
-- Name: CommissionLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommissionLevel" AS ENUM (
    'LOW',
    'MED',
    'HIGH'
);


ALTER TYPE public."CommissionLevel" OWNER TO postgres;

--
-- Name: PayoutStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayoutStatus" AS ENUM (
    'PENDING',
    'PAID',
    'CANCELLED'
);


ALTER TYPE public."PayoutStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'USER',
    'SYSTEM_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Affiliate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Affiliate" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."AffiliateStatus" DEFAULT 'PENDING'::public."AffiliateStatus" NOT NULL,
    slug text NOT NULL,
    "paymentInfo" text,
    "payoutMethod" text,
    "payoutEmail" text,
    "payoutPhone" text,
    "stripeAccountId" text,
    "stripeAccountStatus" text,
    "taxFormCompleted" boolean DEFAULT false NOT NULL,
    "tax1099Uploaded" boolean DEFAULT false NOT NULL,
    "lastPayoutAt" timestamp(3) without time zone,
    "lockedCommissionRate" double precision,
    "customCommissionRate" double precision,
    "totalEarnings" double precision DEFAULT 0 NOT NULL,
    "totalPaid" double precision DEFAULT 0 NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "payoutHeld" boolean DEFAULT false NOT NULL,
    "payoutHoldLiftedAt" timestamp(3) without time zone,
    "payoutHoldLiftedBy" text,
    "payoutHoldReason" text
);


ALTER TABLE public."Affiliate" OWNER TO postgres;

--
-- Name: AffiliatePayout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AffiliatePayout" (
    id text NOT NULL,
    "affiliateId" text NOT NULL,
    amount double precision NOT NULL,
    "feeAmount" double precision DEFAULT 0 NOT NULL,
    "netAmount" double precision DEFAULT 0 NOT NULL,
    status public."PayoutStatus" DEFAULT 'PENDING'::public."PayoutStatus" NOT NULL,
    method text DEFAULT 'stripe'::text NOT NULL,
    "transactionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AffiliatePayout" OWNER TO postgres;

--
-- Name: AffiliateReferral; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AffiliateReferral" (
    id text NOT NULL,
    "affiliateId" text NOT NULL,
    "refereeId" text,
    status public."AffiliateReferralStatus" DEFAULT 'PENDING'::public."AffiliateReferralStatus" NOT NULL,
    "commissionAmount" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AffiliateReferral" OWNER TO postgres;

--
-- Name: Agent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Agent" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "systemPrompt" text NOT NULL,
    "voiceId" text DEFAULT 'default'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Agent" OWNER TO postgres;

--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApiKey" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE public."ApiKey" OWNER TO postgres;

--
-- Name: CalendarCredentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CalendarCredentials" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "expiresAt" timestamp(3) without time zone,
    "calendarEmail" text,
    scope text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CalendarCredentials" OWNER TO postgres;

--
-- Name: ConversationPackage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConversationPackage" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    credits integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ConversationPackage" OWNER TO postgres;

--
-- Name: FaqEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FaqEntry" (
    id text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    helpful integer DEFAULT 0 NOT NULL,
    "notHelpful" integer DEFAULT 0 NOT NULL,
    published boolean DEFAULT true NOT NULL,
    source text DEFAULT 'admin'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FaqEntry" OWNER TO postgres;

--
-- Name: FaqQuestion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FaqQuestion" (
    id text NOT NULL,
    question text NOT NULL,
    "suggestedAnswer" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "faqEntryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FaqQuestion" OWNER TO postgres;

--
-- Name: GmailCredentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GmailCredentials" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "expiresAt" timestamp(3) without time zone,
    "gmailEmail" text,
    scope text,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GmailCredentials" OWNER TO postgres;

--
-- Name: GoogleAuthConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GoogleAuthConfig" (
    id text NOT NULL,
    "clientId" text,
    "clientSecret" text,
    "redirectUri" text,
    enabled boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GoogleAuthConfig" OWNER TO postgres;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "agentId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    summary text,
    "isBooked" boolean DEFAULT false NOT NULL,
    metadata text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Lead" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "emailSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: NotificationPreference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationPreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    commissions boolean DEFAULT true NOT NULL,
    payouts boolean DEFAULT true NOT NULL,
    leads boolean DEFAULT true NOT NULL,
    "usageWarnings" boolean DEFAULT true NOT NULL,
    announcements boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationPreference" OWNER TO postgres;

--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationTemplate" (
    id text NOT NULL,
    type text NOT NULL,
    subject text NOT NULL,
    "bodyHtml" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO postgres;

--
-- Name: PlatformSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformSettings" (
    id text DEFAULT 'global'::text NOT NULL,
    "lowCommission" double precision DEFAULT 10 NOT NULL,
    "medCommission" double precision DEFAULT 20 NOT NULL,
    "highCommission" double precision DEFAULT 30 NOT NULL,
    "commissionDurationMonths" integer DEFAULT 0 NOT NULL,
    "defaultCommissionLevel" public."CommissionLevel" DEFAULT 'HIGH'::public."CommissionLevel" NOT NULL,
    "payoutMinimum" double precision DEFAULT 100 NOT NULL,
    "refundHoldDays" integer DEFAULT 14 NOT NULL,
    "payoutCycleDelayMonths" integer DEFAULT 1 NOT NULL,
    "transactionFeePercent" double precision DEFAULT 3.4 NOT NULL,
    "starterLimit" integer DEFAULT 1000 NOT NULL,
    "professionalLimit" integer DEFAULT 10000 NOT NULL,
    "enterpriseLimit" integer DEFAULT 100000 NOT NULL,
    "ltdLimit" integer DEFAULT 1000 NOT NULL,
    "aiInfraLimit" integer DEFAULT 250000 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformSettings" OWNER TO postgres;

--
-- Name: Referral; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Referral" (
    id text NOT NULL,
    "referrerId" text NOT NULL,
    "refereeId" text,
    code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "rewardAmount" double precision DEFAULT 10 NOT NULL,
    "rewardCurrency" text DEFAULT 'USD'::text NOT NULL,
    "expiresAt" timestamp(3) without time zone DEFAULT (now() + '90 days'::interval) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Referral" OWNER TO postgres;

--
-- Name: RewardTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RewardTransaction" (
    id text NOT NULL,
    "referrerId" text NOT NULL,
    "refereeId" text,
    amount double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "sourcePaymentId" text,
    "holdEndsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RewardTransaction" OWNER TO postgres;

--
-- Name: StripeConnectConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StripeConnectConfig" (
    id text DEFAULT 'global'::text NOT NULL,
    "clientId" text,
    enabled boolean DEFAULT false NOT NULL,
    "minimumPayout" double precision DEFAULT 100 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StripeConnectConfig" OWNER TO postgres;

--
-- Name: SystemEmailConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemEmailConfig" (
    id text DEFAULT 'global'::text NOT NULL,
    username text,
    password text,
    "imapServer" text,
    "imapPort" text,
    "imapSecurity" text DEFAULT 'SSL'::text,
    "smtpServer" text,
    "smtpPort" text,
    "smtpSecurity" text DEFAULT 'SSL'::text,
    "pop3Server" text,
    "pop3Port" text,
    "pop3Security" text DEFAULT 'SSL'::text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemEmailConfig" OWNER TO postgres;

--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "subscriptionStatus" text,
    "subscriptionTier" text DEFAULT 'starter'::text NOT NULL,
    "subscriptionEnds" timestamp(3) without time zone,
    "usageLimit" integer DEFAULT 100 NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "usageResetAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "billingEmail" text,
    "creditBalance" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO postgres;

--
-- Name: TenantGoogleConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TenantGoogleConfig" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "clientId" text NOT NULL,
    "clientSecret" text NOT NULL,
    "geminiApiKey" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TenantGoogleConfig" OWNER TO postgres;

--
-- Name: TenantTwilioConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TenantTwilioConfig" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "accountSid" text NOT NULL,
    "authToken" text NOT NULL,
    "phoneNumber" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TenantTwilioConfig" OWNER TO postgres;

--
-- Name: ToolExecutionAudit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ToolExecutionAudit" (
    id text NOT NULL,
    "agentId" text NOT NULL,
    "userId" text,
    "toolName" text NOT NULL,
    "toolInput" text NOT NULL,
    "toolOutput" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "errorMessage" text,
    "executionTimeMs" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ToolExecutionAudit" OWNER TO postgres;

--
-- Name: Transcript; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transcript" (
    id text NOT NULL,
    "agentId" text NOT NULL,
    "userId" text,
    content text NOT NULL,
    duration integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transcript" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    "passwordHash" text,
    "referralCodeUsed" text,
    "referralRewardTotal" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    avatar text,
    username text,
    "googleId" text,
    "googleEmail" text,
    "googleName" text,
    "googleProfilePicture" text,
    "googleAuthProvider" text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    address text,
    "businessName" text,
    city text,
    "commissionLevel" public."CommissionLevel" DEFAULT 'LOW'::public."CommissionLevel" NOT NULL,
    "firstName" text,
    "isAffiliate" boolean DEFAULT false NOT NULL,
    "lastName" text,
    phone text,
    state text,
    "taxFormUrl" text,
    "tinSsn" text,
    unit text,
    zip text,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "emailVerificationToken" text,
    "resetPasswordToken" text,
    "resetPasswordExpires" timestamp(3) without time zone,
    "isEmailVerifiedByAdmin" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: Affiliate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Affiliate" (id, "userId", status, slug, "paymentInfo", "payoutMethod", "payoutEmail", "payoutPhone", "stripeAccountId", "stripeAccountStatus", "taxFormCompleted", "tax1099Uploaded", "lastPayoutAt", "lockedCommissionRate", "customCommissionRate", "totalEarnings", "totalPaid", balance, "createdAt", "updatedAt", "payoutHeld", "payoutHoldLiftedAt", "payoutHoldLiftedBy", "payoutHoldReason") FROM stdin;
\.


--
-- Data for Name: AffiliatePayout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AffiliatePayout" (id, "affiliateId", amount, "feeAmount", "netAmount", status, method, "transactionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AffiliateReferral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AffiliateReferral" (id, "affiliateId", "refereeId", status, "commissionAmount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Agent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Agent" (id, "tenantId", name, "systemPrompt", "voiceId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApiKey" (id, "tenantId", key, name, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: CalendarCredentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CalendarCredentials" (id, "userId", "tenantId", "accessToken", "refreshToken", "expiresAt", "calendarEmail", scope, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationPackage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConversationPackage" (id, name, price, credits, active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FaqEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FaqEntry" (id, question, answer, category, helpful, "notHelpful", published, source, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FaqQuestion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FaqQuestion" (id, question, "suggestedAnswer", status, "faqEntryId", "createdAt") FROM stdin;
\.


--
-- Data for Name: GmailCredentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GmailCredentials" (id, "userId", "tenantId", "accessToken", "refreshToken", "expiresAt", "gmailEmail", scope, verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GoogleAuthConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GoogleAuthConfig" (id, "clientId", "clientSecret", "redirectUri", enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lead" (id, "tenantId", "agentId", name, phone, email, summary, "isBooked", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, body, data, read, "emailSent", "createdAt") FROM stdin;
cmmo8a3xr0004cvbobnezxgi9	cmmo8a3xe0002cvbo4bbay5nt	EMAIL_VERIFICATION	Verify your email address	Welcome to OrbisVoice, Test User! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=7ilry6dtfdkm16lsnlwqln\n\nIf you did not create an account, please ignore this email.	\N	f	t	2026-03-13 01:38:38.319
cmmo8c3kp0009cvbo3ima8m6t	cmmo8c3kg0007cvbo71y9ahrt	EMAIL_VERIFICATION	Verify your email address	Welcome to OrbisVoice, Test User! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=4d3te0cl1zm95qxjy6r00j\n\nIf you did not create an account, please ignore this email.	\N	f	t	2026-03-13 01:40:11.161
cmmo8hu6u000ecvboyjq1p7ko	cmmo8hu6m000ccvbokn0j2kkl	EMAIL_VERIFICATION	Verify your email address	Welcome to OrbisVoice, Test User! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=4hl18ruz33tndd8n8te73k\n\nIf you did not create an account, please ignore this email.	\N	f	t	2026-03-13 01:44:38.935
cmmo8kgfr0004cvio9ag8c2hg	cmmo8kgfh0002cviovs1aydk0	EMAIL_VERIFICATION	Verify your email address	Welcome to OrbisVoice, Test User! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=h6uka02g13maj02y0j28\n\nIf you did not create an account, please ignore this email.	\N	f	t	2026-03-13 01:46:41.079
cmmoa3osd0004cvykzky2af6l	cmmoa3os10002cvykmgn5161n	EMAIL_VERIFICATION	Verify your email address	Welcome to OrbisVoice, John Hancock! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=atv9rsbp2ilszfb4emc92i\n\nIf you did not create an account, please ignore this email.	\N	f	t	2026-03-13 02:29:37.982
\.


--
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationPreference" (id, "userId", "emailEnabled", commissions, payouts, leads, "usageWarnings", announcements, "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationTemplate" (id, type, subject, "bodyHtml", enabled, "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlatformSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformSettings" (id, "lowCommission", "medCommission", "highCommission", "commissionDurationMonths", "defaultCommissionLevel", "payoutMinimum", "refundHoldDays", "payoutCycleDelayMonths", "transactionFeePercent", "starterLimit", "professionalLimit", "enterpriseLimit", "ltdLimit", "aiInfraLimit", "updatedAt") FROM stdin;
global	20	25	30	0	HIGH	100	14	1	3.4	250	500	1000	250	2000	2026-03-13 05:29:31.94
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Referral" (id, "referrerId", "refereeId", code, status, "rewardAmount", "rewardCurrency", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RewardTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RewardTransaction" (id, "referrerId", "refereeId", amount, status, "sourcePaymentId", "holdEndsAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StripeConnectConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StripeConnectConfig" (id, "clientId", enabled, "minimumPayout", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemEmailConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemEmailConfig" (id, username, password, "imapServer", "imapPort", "imapSecurity", "smtpServer", "smtpPort", "smtpSecurity", "pop3Server", "pop3Port", "pop3Security", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, "createdAt", "updatedAt", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "subscriptionTier", "subscriptionEnds", "usageLimit", "usageCount", "usageResetAt", "billingEmail", "creditBalance") FROM stdin;
cmmo8c3k10005cvboytceqkzx	Test User's Workspace	2026-03-13 01:40:11.138	2026-03-13 01:40:11.138	\N	\N	none	free	\N	100	0	2026-03-13 01:40:11.138	\N	0
cmmo8hu6h000acvbo1s28n4dw	Test User's Workspace	2026-03-13 01:44:38.921	2026-03-13 01:44:38.921	\N	\N	none	free	\N	100	0	2026-03-13 01:44:38.921	\N	0
cmmo8kgfb0000cvioze3qejbb	Test User's Workspace	2026-03-13 01:46:41.063	2026-03-13 01:46:41.063	\N	\N	none	free	\N	100	0	2026-03-13 01:46:41.063	\N	0
cmmoa3orl0000cvyk4fixoejh	John Hancock's Workspace	2026-03-13 02:29:37.953	2026-03-13 03:03:50.131	cus_U8dHzJdQ6GurgO	\N	active	free	\N	100	0	2026-03-13 02:29:37.953	\N	0
cmmo8a3wx0000cvbodl9u9ur4	Test User's Workspace	2026-03-13 01:38:38.289	2026-03-13 03:21:22.644	cus_U8dZv54Pch4Jg2	\N	none	free	\N	100	0	2026-03-13 01:38:38.289	\N	0
\.


--
-- Data for Name: TenantGoogleConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TenantGoogleConfig" (id, "tenantId", "clientId", "clientSecret", "geminiApiKey", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantTwilioConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TenantTwilioConfig" (id, "tenantId", "accountSid", "authToken", "phoneNumber", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ToolExecutionAudit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ToolExecutionAudit" (id, "agentId", "userId", "toolName", "toolInput", "toolOutput", status, "errorMessage", "executionTimeMs", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transcript; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transcript" (id, "agentId", "userId", content, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "tenantId", email, name, "passwordHash", "referralCodeUsed", "referralRewardTotal", "createdAt", "updatedAt", "isAdmin", avatar, username, "googleId", "googleEmail", "googleName", "googleProfilePicture", "googleAuthProvider", role, "isBlocked", address, "businessName", city, "commissionLevel", "firstName", "isAffiliate", "lastName", phone, state, "taxFormUrl", "tinSsn", unit, zip, "emailNotifications", "emailVerified", "emailVerificationToken", "resetPasswordToken", "resetPasswordExpires", "isEmailVerifiedByAdmin") FROM stdin;
cmmo8a3xe0002cvbo4bbay5nt	cmmo8a3wx0000cvbodl9u9ur4	test_40pg0p@example.com	Test User	$2b$10$Y/.LQMT7w.MpnMVERF2MhOvMFvTgf9mXDKco2pWt7RNmTn3clz41y	\N	0	2026-03-13 01:38:38.306	2026-03-13 01:38:38.504	f	\N	testuser_m2620q	\N	\N	\N	\N	\N	USER	f	\N	\N	\N	HIGH	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 01:38:38.503	\N	\N	\N	f
cmmo8c3kg0007cvbo71y9ahrt	cmmo8c3k10005cvboytceqkzx	test_lurnx@example.com	Test User	$2b$10$pV22lIlu.zS050uE1jKAmevkDebBwh.Qb9VwloRldxUTswWPNEP8e	\N	0	2026-03-13 01:40:11.153	2026-03-13 01:40:11.338	f	\N	testuser_pvzpf2	\N	\N	\N	\N	\N	USER	f	\N	\N	\N	HIGH	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 01:40:11.337	\N	\N	\N	f
cmmo8hu6m000ccvbokn0j2kkl	cmmo8hu6h000acvbo1s28n4dw	test_fq54xr@example.com	Test User	$2b$10$C/bN3X27SRCfFdFioCrGUOLhsrdUKoXev.uYJWPGCLPkL/S9Y4fdq	\N	0	2026-03-13 01:44:38.927	2026-03-13 01:44:39.13	f	\N	testuser_pzo4eo	\N	\N	\N	\N	\N	USER	f	\N	\N	\N	HIGH	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 01:44:39.129	\N	\N	\N	f
cmmo8kgfh0002cviovs1aydk0	cmmo8kgfb0000cvioze3qejbb	test_ix4vi9@example.com	Test User	$2b$10$K.xib5INU1Ylo1ZJCJkLQ.oAJZB4Fw.HBnSY7qt0dqNcOR6av3eE6	\N	0	2026-03-13 01:46:41.069	2026-03-13 01:46:41.261	f	\N	testuser_lij3if	\N	\N	\N	\N	\N	USER	f	\N	\N	\N	HIGH	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 01:46:41.26	\N	\N	\N	f
cmmoa3os10002cvykmgn5161n	cmmoa3orl0000cvyk4fixoejh	jhancock@test.com	John Hancock	$2b$10$6pg/gblCfj7pPCy/Wfz3p.rxhPZAcs9IQmCVS3Kz8W1kRGChDa8dG	\N	0	2026-03-13 02:29:37.969	2026-03-13 02:54:03.553	f	\N	jhancock	\N	\N	\N	\N	\N	USER	f	\N	\N	\N	HIGH	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 02:54:03.51	atv9rsbp2ilszfb4emc92i	\N	\N	t
cmmo92beh0001cvq4owuahkkl	cmmo8a3wx0000cvbodl9u9ur4	admin@orbisvoice.app	System Admin	$2b$10$lhlSG/nVHT4bx67Wc/DkCeOcu6OhyeONMG7bZuomc0pSYOxSO8Lsu	\N	0	2026-03-13 02:00:34.361	2026-03-13 05:35:36.675	t	\N	\N	\N	\N	\N	\N	\N	SYSTEM_ADMIN	f	\N	\N	\N	LOW	\N	f	\N	\N	\N	\N	\N	\N	\N	t	2026-03-13 02:00:34.359	\N	\N	\N	f
\.


--
-- Name: AffiliatePayout AffiliatePayout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AffiliatePayout"
    ADD CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY (id);


--
-- Name: AffiliateReferral AffiliateReferral_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AffiliateReferral"
    ADD CONSTRAINT "AffiliateReferral_pkey" PRIMARY KEY (id);


--
-- Name: Affiliate Affiliate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Affiliate"
    ADD CONSTRAINT "Affiliate_pkey" PRIMARY KEY (id);


--
-- Name: Agent Agent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agent"
    ADD CONSTRAINT "Agent_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: CalendarCredentials CalendarCredentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CalendarCredentials"
    ADD CONSTRAINT "CalendarCredentials_pkey" PRIMARY KEY (id);


--
-- Name: ConversationPackage ConversationPackage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationPackage"
    ADD CONSTRAINT "ConversationPackage_pkey" PRIMARY KEY (id);


--
-- Name: FaqEntry FaqEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FaqEntry"
    ADD CONSTRAINT "FaqEntry_pkey" PRIMARY KEY (id);


--
-- Name: FaqQuestion FaqQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FaqQuestion"
    ADD CONSTRAINT "FaqQuestion_pkey" PRIMARY KEY (id);


--
-- Name: GmailCredentials GmailCredentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GmailCredentials"
    ADD CONSTRAINT "GmailCredentials_pkey" PRIMARY KEY (id);


--
-- Name: GoogleAuthConfig GoogleAuthConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoogleAuthConfig"
    ADD CONSTRAINT "GoogleAuthConfig_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSettings PlatformSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformSettings"
    ADD CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY (id);


--
-- Name: Referral Referral_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_pkey" PRIMARY KEY (id);


--
-- Name: RewardTransaction RewardTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RewardTransaction"
    ADD CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY (id);


--
-- Name: StripeConnectConfig StripeConnectConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StripeConnectConfig"
    ADD CONSTRAINT "StripeConnectConfig_pkey" PRIMARY KEY (id);


--
-- Name: SystemEmailConfig SystemEmailConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemEmailConfig"
    ADD CONSTRAINT "SystemEmailConfig_pkey" PRIMARY KEY (id);


--
-- Name: TenantGoogleConfig TenantGoogleConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantGoogleConfig"
    ADD CONSTRAINT "TenantGoogleConfig_pkey" PRIMARY KEY (id);


--
-- Name: TenantTwilioConfig TenantTwilioConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantTwilioConfig"
    ADD CONSTRAINT "TenantTwilioConfig_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: ToolExecutionAudit ToolExecutionAudit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ToolExecutionAudit"
    ADD CONSTRAINT "ToolExecutionAudit_pkey" PRIMARY KEY (id);


--
-- Name: Transcript Transcript_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transcript"
    ADD CONSTRAINT "Transcript_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AffiliateReferral_refereeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AffiliateReferral_refereeId_key" ON public."AffiliateReferral" USING btree ("refereeId");


--
-- Name: Affiliate_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Affiliate_slug_key" ON public."Affiliate" USING btree (slug);


--
-- Name: Affiliate_stripeAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Affiliate_stripeAccountId_key" ON public."Affiliate" USING btree ("stripeAccountId");


--
-- Name: Affiliate_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Affiliate_userId_key" ON public."Affiliate" USING btree ("userId");


--
-- Name: ApiKey_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ApiKey_key_key" ON public."ApiKey" USING btree (key);


--
-- Name: CalendarCredentials_userId_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CalendarCredentials_userId_tenantId_key" ON public."CalendarCredentials" USING btree ("userId", "tenantId");


--
-- Name: GmailCredentials_userId_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GmailCredentials_userId_tenantId_key" ON public."GmailCredentials" USING btree ("userId", "tenantId");


--
-- Name: NotificationPreference_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON public."NotificationPreference" USING btree ("userId");


--
-- Name: NotificationTemplate_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "NotificationTemplate_type_key" ON public."NotificationTemplate" USING btree (type);


--
-- Name: Referral_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Referral_code_key" ON public."Referral" USING btree (code);


--
-- Name: TenantGoogleConfig_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TenantGoogleConfig_tenantId_key" ON public."TenantGoogleConfig" USING btree ("tenantId");


--
-- Name: TenantTwilioConfig_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TenantTwilioConfig_tenantId_key" ON public."TenantTwilioConfig" USING btree ("tenantId");


--
-- Name: Tenant_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON public."Tenant" USING btree ("stripeCustomerId");


--
-- Name: Tenant_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON public."Tenant" USING btree ("stripeSubscriptionId");


--
-- Name: User_emailVerificationToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON public."User" USING btree ("emailVerificationToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: User_resetPasswordToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON public."User" USING btree ("resetPasswordToken");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: AffiliatePayout AffiliatePayout_affiliateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AffiliatePayout"
    ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES public."Affiliate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AffiliateReferral AffiliateReferral_affiliateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AffiliateReferral"
    ADD CONSTRAINT "AffiliateReferral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES public."Affiliate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Affiliate Affiliate_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Affiliate"
    ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Agent Agent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agent"
    ADD CONSTRAINT "Agent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApiKey ApiKey_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public."Agent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Referral Referral_refereeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Referral Referral_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RewardTransaction RewardTransaction_refereeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RewardTransaction"
    ADD CONSTRAINT "RewardTransaction_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RewardTransaction RewardTransaction_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RewardTransaction"
    ADD CONSTRAINT "RewardTransaction_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TenantGoogleConfig TenantGoogleConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantGoogleConfig"
    ADD CONSTRAINT "TenantGoogleConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TenantTwilioConfig TenantTwilioConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantTwilioConfig"
    ADD CONSTRAINT "TenantTwilioConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ToolExecutionAudit ToolExecutionAudit_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ToolExecutionAudit"
    ADD CONSTRAINT "ToolExecutionAudit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public."Agent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transcript Transcript_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transcript"
    ADD CONSTRAINT "Transcript_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public."Agent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict QLCn6QakQrjhMTCv6q31bXgon4lPoX3t4oOTkX0FCvw3VjWbocyOxCMLgHGTVg6

