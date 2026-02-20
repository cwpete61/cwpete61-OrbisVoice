--
-- PostgreSQL database dump
--

\restrict Gl0O5yPCnBPGTbwJygbm1SnYllFfRTIDLsc4g4zcdVgCXz051cvKbQRCNk7GlO1

-- Dumped from database version 17.2
-- Dumped by pg_dump version 18.1

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
    'USER'
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
    "totalEarnings" double precision DEFAULT 0 NOT NULL,
    "totalPaid" double precision DEFAULT 0 NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Affiliate" OWNER TO postgres;

--
-- Name: AffiliatePayout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AffiliatePayout" (
    id text NOT NULL,
    "affiliateId" text NOT NULL,
    amount double precision NOT NULL,
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
-- Name: PlatformSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformSettings" (
    id text DEFAULT 'global'::text NOT NULL,
    "lowCommission" double precision DEFAULT 10 NOT NULL,
    "medCommission" double precision DEFAULT 20 NOT NULL,
    "highCommission" double precision DEFAULT 30 NOT NULL,
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
    "billingEmail" text
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    "commissionLevel" public."CommissionLevel" DEFAULT 'LOW'::public."CommissionLevel" NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Affiliate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Affiliate" (id, "userId", status, slug, "paymentInfo", "totalEarnings", "totalPaid", balance, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AffiliatePayout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AffiliatePayout" (id, "affiliateId", amount, status, method, "transactionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AffiliateReferral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AffiliateReferral" (id, "affiliateId", "refereeId", status, "commissionAmount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Agent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Agent" (id, "tenantId", name, "systemPrompt", "voiceId", "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: PlatformSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformSettings" (id, "lowCommission", "medCommission", "highCommission", "starterLimit", "professionalLimit", "enterpriseLimit", "ltdLimit", "aiInfraLimit", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Referral" (id, "referrerId", "refereeId", code, status, "rewardAmount", "rewardCurrency", "expiresAt", "createdAt", "updatedAt") FROM stdin;
cmltzbkov0001c98djerx183t	admin-user-001	\N	REF_ADMI_MLTZBKOU_XSQ1Z	pending	5	USD	2026-05-20 16:34:44.864	2026-02-19 21:34:44.863	2026-02-19 21:34:44.863
cmlu1362o0004n5zi39rvs3xl	cmlu10olz0002n5zixqfe55c6	\N	REF_CMLU_MLU1362N_U3AXX	pending	5	USD	2026-05-20 17:24:11.905	2026-02-19 22:24:11.904	2026-02-19 22:24:11.904
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, "createdAt", "updatedAt", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "subscriptionTier", "subscriptionEnds", "usageLimit", "usageCount", "usageResetAt", "billingEmail") FROM stdin;
admin-tenant-001	Admin Workspace	2026-02-19 21:31:45.363	2026-02-19 21:31:45.363	\N	\N	\N	enterprise	\N	100	0	2026-02-19 21:31:45.363	\N
cmlu10olt0000n5zix2wj3eta	Willie Brown's Workspace	2026-02-19 22:22:15.954	2026-02-19 22:22:15.954	\N	\N	\N	starter	\N	100	0	2026-02-19 22:22:15.954	\N
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

COPY public."ToolExecutionAudit" (id, "agentId", "userId", "toolName", "toolInput", "toolOutput", status, "errorMessage", "executionTimeMs", "createdAt") FROM stdin;
\.


--
-- Data for Name: Transcript; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transcript" (id, "agentId", "userId", content, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "tenantId", email, name, "passwordHash", "referralCodeUsed", "referralRewardTotal", "createdAt", "updatedAt", "isAdmin", avatar, username, "googleId", "googleEmail", "googleName", "googleProfilePicture", "googleAuthProvider", role, "isBlocked", "commissionLevel") FROM stdin;
admin-user-001	admin-tenant-001	admin@orbisvoice.app	Admin	$2a$10$2zRzgB9qy9ljT3jX1vBRYOGcl9uM0UFoF7R2MZgmfEHz6Abt34OCm	\N	0	2026-02-19 21:31:45.37	2026-02-19 21:31:45.37	t	\N	Oadmin	\N	\N	\N	\N	\N	ADMIN	f	LOW
cmlu10olz0002n5zixqfe55c6	cmlu10olt0000n5zix2wj3eta	wbrown@browncorp.com	Willie Brown	$2a$10$CA4QblIvfi3xC5M98tLp1eJGUD8nZoneFHNE3Fwg/GjJ6/awircWe	\N	0	2026-02-19 22:22:15.96	2026-02-19 22:22:15.96	f	\N	browncorp	\N	\N	\N	\N	\N	USER	f	LOW
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
dc2ef2b7-e8cd-4f60-a0ad-03695c8bd894	93405ffcd6cdf168c1aebb619825d781902697947f6074c52f01faf35e072072	2026-02-19 16:31:42.948546-05	20260218050733_init	\N	\N	2026-02-19 16:31:42.910101-05	1
0df77dc5-6474-4d3c-86f9-49b09d845533	dd4ea3453519626e1f39a6b39eb5b85650695f93d2ecfac34d17485173c1afe5	2026-02-19 16:31:42.956603-05	20260218060500_add_billing_and_admin_fields	\N	\N	2026-02-19 16:31:42.949405-05	1
e6ba562f-a3fb-4259-9226-e08d96b376ae	76525e971832c1f7408fc63ad279056e95ec94ca30ed743f485f17e9b8f07ee6	2026-02-19 16:31:42.959216-05	20260218102600_add_user_avatar	\N	\N	2026-02-19 16:31:42.957319-05	1
a824adef-bf89-4395-b74b-499273f07bf5	f733620cf8d6f8d9289f9c157319527894c5da22be70f5679f604f14fcd6a872	2026-02-19 16:31:42.962848-05	20260218105300_add_username	\N	\N	2026-02-19 16:31:42.959899-05	1
6ed854b9-27b8-40d1-bda5-8527025c5531	31f0b7446e002517c9b78ed16115ee6a913dedc668b83c189e9f496f85a06bcd	2026-02-19 16:31:42.967239-05	20260218120000_add_google_oauth	\N	\N	2026-02-19 16:31:42.963626-05	1
db42e766-86ec-461b-be38-b58416e6205b	c62dc6c839b75b6e887981f2258269f141b02e19c47e6679c35a5b0bd40c899a	2026-02-19 16:31:42.97004-05	20260218123000_add_user_role	\N	\N	2026-02-19 16:31:42.967876-05	1
7f47ddc7-0e29-47d1-9719-54a89beec931	3dd54c9e330a0c6c15f4cccfd4d90c43b9e2de874a226042c9cbc48f09746d48	2026-02-19 16:31:42.975684-05	20260218124500_add_google_auth_config	\N	\N	2026-02-19 16:31:42.970787-05	1
32ee70da-4843-4813-a9e6-c518a204412c	9f11106ef43d49c0d1f606a639d9bf1f010bfbac688475bb2a23363798e71a06	2026-02-19 16:31:42.978581-05	20260218150000_add_user_blocked	\N	\N	2026-02-19 16:31:42.976615-05	1
cd073546-df7e-4ae3-a713-d0369434a30e	04ab6d2f81348127120730b9e8208b28dadc933d025d46dd8b87c86ff2869825	2026-02-19 16:31:42.988046-05	20260219021022_add_calendar_credentials	\N	\N	2026-02-19 16:31:42.979248-05	1
74ce38d8-9966-4061-bf81-55db47902ee4	aa9b6c35e317d8c87db7b2b3dfee08e99ec65a8e6b7971c3b97dd05f568073bc	2026-02-19 16:31:42.995172-05	20260219021800_add_gmail_credentials	\N	\N	2026-02-19 16:31:42.988823-05	1
61fcd3a2-37e3-4b00-bd41-e7a7bb3dfe27	5999c28cb04f789814208a7171c61a399f5df6357f6a975d7d358adfd4d7fd2a	2026-02-19 16:31:43.002402-05	20260219042759_add_user_oauth_config	\N	\N	2026-02-19 16:31:42.995798-05	1
44831072-bce7-4b34-a10d-3da125f2f0b1	18c4e59350d77ddda2f097c5398c65f4d02c4a8fe428a586d4246e9d93de63a7	2026-02-19 16:31:43.01412-05	20260219070346_add_tenant_google_config	\N	\N	2026-02-19 16:31:43.003176-05	1
8692a675-3ae4-4b3f-a2aa-425c34366629	c2dbb3e7695ce3f3fede44ea62e1edbff72037fadbb5385e1182a14d89d382bd	2026-02-19 16:31:44.423046-05	20260219213144_add_tier_limits	\N	\N	2026-02-19 16:31:44.39384-05	1
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
-- Name: User User_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_username_key" UNIQUE (username);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AffiliateReferral_refereeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AffiliateReferral_refereeId_key" ON public."AffiliateReferral" USING btree ("refereeId");


--
-- Name: Affiliate_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Affiliate_slug_key" ON public."Affiliate" USING btree (slug);


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
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


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
-- Name: Referral Referral_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict Gl0O5yPCnBPGTbwJygbm1SnYllFfRTIDLsc4g4zcdVgCXz051cvKbQRCNk7GlO1

