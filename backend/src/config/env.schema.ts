import { z } from 'zod';

/**
 * Staff+ Enforcement: Deep Freeze configuration to prevent runtime mutation.
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj as Readonly<T>;
}

export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  BACKEND_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((s) => (s ? s.split(',').map((o) => o.trim()) : [])),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  JWT_CHECKOUT_SECRET: z.string().min(32).optional(),
  JWT_CHECKOUT_EXPIRES_IN: z.string().default('15m'),
  PAGINATION_SECRET: z.string().min(32),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().nullable(),
  REDIS_URL: z.string().optional().nullable(),
  REDIS_TTL: z.coerce.number().default(60000),

  // Mail
  MAIL_PROVIDER: z
    .enum(['smtp', 'sendgrid'])
    .default(process.env.NODE_ENV === 'production' ? 'sendgrid' : 'smtp'),
  MAIL_FROM: z.string().email(),
  MAIL_FROM_NAME: z.string().default('Ray Paradis'),
  COMPANY_NAME: z.string().default('Ray Paradis'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.preprocess((v) => v === true || v === 'true', z.boolean().default(false)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  // Customer OAuth
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_OAUTH_CLIENT_ID: z.string().optional(),
  FACEBOOK_OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_STATE_TTL_SECONDS: z.coerce.number().default(600),

  // Storage
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_BUCKET: z.string(),

  // Payment: VNPay
  VNPAY_TMN_CODE: z.string().optional(),
  VNPAY_HASH_SECRET: z.string().optional(),
  VNPAY_URL: z.string().url().optional(),
  VNPAY_RETURN_URL: z.string().url().optional(),
  VNPAY_API_URL: z.string().url().optional(),

  // Payment: PayPal
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Payment: VietQR / Bank Transfer
  VIETQR_BANK_BIN: z.string().optional(),
  VIETQR_BANK_ACCOUNT_NO: z.string().optional(),
  VIETQR_BANK_ACCOUNT_NAME: z.string().optional(),
  VIETQR_TEMPLATE: z.string().default('compact'),
  VIETQR_EXPIRE_MINUTES: z.coerce.number().default(20),
  VIETQR_WEBHOOK_SECRET: z.string().optional(),
  VIETQR_WEBHOOK_IPS: z.string().optional(),

  // AI Service
  AI_SERVICE_URL: z.string().url().default('http://localhost:4100'),
  AI_QUERY_TIMEOUT_MS: z.coerce.number().default(500),
  AI_EMBED_TIMEOUT_MS: z.coerce.number().default(3000),
  AI_SEARCH_TIMEOUT_MS: z.coerce.number().default(800),
  AI_SEARCH_CACHE_TTL_MS: z.coerce.number().default(120000),
  AI_RECOMMENDATION_CACHE_TTL_MS: z.coerce.number().default(600000),
  AI_CHAT_TIMEOUT_MS: z.coerce.number().default(30000),
  INTERNAL_SERVICE_TOKEN: z.string().default('dev_internal_token_123'),

  // Currency
  SYSTEM_BASE_CURRENCY: z.string().default('VND'),
  CURRENCY_API_URL: z.string().optional(),

  // Operational Hardening
  TRUST_PROXY_DEPTH: z.coerce.number().default(1),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  ALLOW_PROD_SEED: z.preprocess((v) => v === 'true', z.boolean().default(false)),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and freezes the configuration object.
 * This is the ONLY place where process.env should be accessed.
 */
export function validateAndFreezeConfig(config: Record<string, unknown>): Readonly<EnvConfig> {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err) => `   - [${err.path.join('.')}] ${err.message}`)
      .join('\n');

    const fatalMessage = `
❌ CRITICAL_CONFIG_ERROR: Environment validation failed in ${process.env.NODE_ENV} mode!
Missing or invalid variables:
${errorMessages}
Please check your Render Environment Variables / .env file.
`;

    // Use process.stderr.write for immediate synchronous flushing
    process.stderr.write(fatalMessage);

    // Fail-fast logic for production and CI
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      process.exit(1);
    }

    throw new Error('Environment validation failed');
  }

  return deepFreeze(result.data);
}
