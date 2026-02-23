
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  stripeCustomerId: 'stripeCustomerId',
  stripeSubscriptionId: 'stripeSubscriptionId',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionTier: 'subscriptionTier',
  subscriptionEnds: 'subscriptionEnds',
  usageLimit: 'usageLimit',
  usageCount: 'usageCount',
  usageResetAt: 'usageResetAt',
  billingEmail: 'billingEmail',
  creditBalance: 'creditBalance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TenantTwilioConfigScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  accountSid: 'accountSid',
  authToken: 'authToken',
  phoneNumber: 'phoneNumber',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  email: 'email',
  name: 'name',
  username: 'username',
  passwordHash: 'passwordHash',
  isAdmin: 'isAdmin',
  role: 'role',
  isBlocked: 'isBlocked',
  avatar: 'avatar',
  commissionLevel: 'commissionLevel',
  googleId: 'googleId',
  googleEmail: 'googleEmail',
  googleName: 'googleName',
  googleProfilePicture: 'googleProfilePicture',
  googleAuthProvider: 'googleAuthProvider',
  referralCodeUsed: 'referralCodeUsed',
  referralRewardTotal: 'referralRewardTotal',
  isAffiliate: 'isAffiliate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  firstName: 'firstName',
  lastName: 'lastName',
  businessName: 'businessName',
  phone: 'phone',
  address: 'address',
  unit: 'unit',
  city: 'city',
  state: 'state',
  zip: 'zip',
  tinSsn: 'tinSsn',
  taxFormUrl: 'taxFormUrl'
};

exports.Prisma.AgentScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  systemPrompt: 'systemPrompt',
  voiceId: 'voiceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  key: 'key',
  name: 'name',
  createdAt: 'createdAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.TranscriptScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  userId: 'userId',
  content: 'content',
  duration: 'duration',
  createdAt: 'createdAt'
};

exports.Prisma.ReferralScalarFieldEnum = {
  id: 'id',
  referrerId: 'referrerId',
  refereeId: 'refereeId',
  code: 'code',
  status: 'status',
  rewardAmount: 'rewardAmount',
  rewardCurrency: 'rewardCurrency',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RewardTransactionScalarFieldEnum = {
  id: 'id',
  referrerId: 'referrerId',
  refereeId: 'refereeId',
  amount: 'amount',
  status: 'status',
  sourcePaymentId: 'sourcePaymentId',
  holdEndsAt: 'holdEndsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ToolExecutionAuditScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  userId: 'userId',
  toolName: 'toolName',
  toolInput: 'toolInput',
  toolOutput: 'toolOutput',
  status: 'status',
  errorMessage: 'errorMessage',
  executionTimeMs: 'executionTimeMs',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  agentId: 'agentId',
  name: 'name',
  phone: 'phone',
  email: 'email',
  summary: 'summary',
  isBooked: 'isBooked',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GoogleAuthConfigScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  redirectUri: 'redirectUri',
  enabled: 'enabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemEmailConfigScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  imapServer: 'imapServer',
  imapPort: 'imapPort',
  imapSecurity: 'imapSecurity',
  smtpServer: 'smtpServer',
  smtpPort: 'smtpPort',
  smtpSecurity: 'smtpSecurity',
  pop3Server: 'pop3Server',
  pop3Port: 'pop3Port',
  pop3Security: 'pop3Security',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StripeConnectConfigScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  enabled: 'enabled',
  minimumPayout: 'minimumPayout',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TenantGoogleConfigScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  geminiApiKey: 'geminiApiKey',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CalendarCredentialsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tenantId: 'tenantId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expiresAt: 'expiresAt',
  calendarEmail: 'calendarEmail',
  scope: 'scope',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GmailCredentialsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tenantId: 'tenantId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expiresAt: 'expiresAt',
  gmailEmail: 'gmailEmail',
  scope: 'scope',
  verified: 'verified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlatformSettingsScalarFieldEnum = {
  id: 'id',
  lowCommission: 'lowCommission',
  medCommission: 'medCommission',
  highCommission: 'highCommission',
  commissionDurationMonths: 'commissionDurationMonths',
  defaultCommissionLevel: 'defaultCommissionLevel',
  payoutMinimum: 'payoutMinimum',
  refundHoldDays: 'refundHoldDays',
  payoutCycleDelayMonths: 'payoutCycleDelayMonths',
  transactionFeePercent: 'transactionFeePercent',
  starterLimit: 'starterLimit',
  professionalLimit: 'professionalLimit',
  enterpriseLimit: 'enterpriseLimit',
  ltdLimit: 'ltdLimit',
  aiInfraLimit: 'aiInfraLimit',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliateScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  status: 'status',
  slug: 'slug',
  paymentInfo: 'paymentInfo',
  payoutMethod: 'payoutMethod',
  payoutEmail: 'payoutEmail',
  payoutPhone: 'payoutPhone',
  stripeAccountId: 'stripeAccountId',
  stripeAccountStatus: 'stripeAccountStatus',
  taxFormCompleted: 'taxFormCompleted',
  tax1099Uploaded: 'tax1099Uploaded',
  lastPayoutAt: 'lastPayoutAt',
  lockedCommissionRate: 'lockedCommissionRate',
  customCommissionRate: 'customCommissionRate',
  totalEarnings: 'totalEarnings',
  totalPaid: 'totalPaid',
  balance: 'balance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliateReferralScalarFieldEnum = {
  id: 'id',
  affiliateId: 'affiliateId',
  refereeId: 'refereeId',
  status: 'status',
  commissionAmount: 'commissionAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliatePayoutScalarFieldEnum = {
  id: 'id',
  affiliateId: 'affiliateId',
  amount: 'amount',
  feeAmount: 'feeAmount',
  netAmount: 'netAmount',
  status: 'status',
  method: 'method',
  transactionId: 'transactionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationPackageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  credits: 'credits',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.CommissionLevel = exports.$Enums.CommissionLevel = {
  LOW: 'LOW',
  MED: 'MED',
  HIGH: 'HIGH'
};

exports.AffiliateStatus = exports.$Enums.AffiliateStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED'
};

exports.AffiliateReferralStatus = exports.$Enums.AffiliateReferralStatus = {
  PENDING: 'PENDING',
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED'
};

exports.PayoutStatus = exports.$Enums.PayoutStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  TenantTwilioConfig: 'TenantTwilioConfig',
  User: 'User',
  Agent: 'Agent',
  ApiKey: 'ApiKey',
  Transcript: 'Transcript',
  Referral: 'Referral',
  RewardTransaction: 'RewardTransaction',
  ToolExecutionAudit: 'ToolExecutionAudit',
  Lead: 'Lead',
  GoogleAuthConfig: 'GoogleAuthConfig',
  SystemEmailConfig: 'SystemEmailConfig',
  StripeConnectConfig: 'StripeConnectConfig',
  TenantGoogleConfig: 'TenantGoogleConfig',
  CalendarCredentials: 'CalendarCredentials',
  GmailCredentials: 'GmailCredentials',
  PlatformSettings: 'PlatformSettings',
  Affiliate: 'Affiliate',
  AffiliateReferral: 'AffiliateReferral',
  AffiliatePayout: 'AffiliatePayout',
  ConversationPackage: 'ConversationPackage'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
