import { z } from 'zod';

/**
 * Frontend Environment Schema
 * Note: Only variables prefixed with VITE_ are exposed to the client.
 */
export const envSchema = z.object({
    VITE_API_BASE_URL: z.string().url(),
    MODE: z.enum(['development', 'production', 'test']).default('development'),
    PROD: z.boolean(),
    DEV: z.boolean(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates the frontend environment.
 * Fail-fast if any critical variable is missing.
 */
function validateFrontendEnv(): Readonly<EnvConfig> {
    const result = envSchema.safeParse(import.meta.env);

    if (!result.success) {
        const errorMessages = result.error.issues
            .map((err) => `[${err.path.join('.')}] ${err.message}`)
            .join('\n');

        console.error('❌ CRITICAL_FRONTEND_CONFIG_ERROR: Environment validation failed:');
        console.error(errorMessages);

        // In browser, we throw to stop the app
        throw new Error(`CRITICAL_FRONTEND_CONFIG_ERROR:\n${errorMessages}`);
    }

    return Object.freeze(result.data) as Readonly<EnvConfig>;
}

export const env = validateFrontendEnv();
