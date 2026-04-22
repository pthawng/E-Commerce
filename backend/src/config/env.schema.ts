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
  PAGINATION_SECRET: z.string().min(32),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().nullable(),
  REDIS_URL: z.string().optional().nullable(),
  REDIS_TTL: z.coerce.number().default(60000),

  // Mail
  MAIL_PROVIDER: z.enum(['gmail', 'sendgrid']).default('gmail'),
  MAIL_FROM: z.string().email(),
  COMPANY_NAME: z.string().default('Ray Paradis'),
  SENDGRID_API_KEY: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  GMAIL_USER: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().optional(),

  // Storage
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_BUCKET: z.string(),

  // Payment
  VNPAY_TMN_CODE: z.string().optional(),
  VNPAY_HASH_SECRET: z.string().optional(),
  VNPAY_URL: z.string().url().optional(),
  VNPAY_RETURN_URL: z.string().url().optional(),
  VNPAY_API_URL: z.string().url().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

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
